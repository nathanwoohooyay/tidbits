const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const { sendError } = require('./utils/errorResponse');
const {
  validateSignupInput,
  validateLoginInput,
  getSignupConflictError,
} = require('./validation/authValidation');
const {
  publishUserAuditEvent,
  resolveIpAddress,
} = require('./audit/userAuditPublisher');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Shared secret - the mission service (Java) validates tokens signed with
// this exact string. In a real system this would come from a secrets
// manager, never be hardcoded, and never be the same value in two
// unrelated services - here it's deliberately visible so the group can see
// EXACTLY what "the two services agree on a secret" means in practice.
const SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
const DEFAULT_SIGNUP_ROLE = 'client';
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

function hashRefreshToken(refreshToken) {
  return crypto.createHash('sha256').update(refreshToken).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: false, // Needs to be set to false to use over http
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/api/auth',
  };
}

app.post('/api/auth/signup', async (req, res) => {
  const validation = validateSignupInput(req.body);
  if (!validation.ok) {
    await publishUserAuditEvent({
      eventType: 'SIGNUP',
      userId: null,
      status: 'FAILURE',
      ipAddress: resolveIpAddress(req),
      details: validation.errorCode,
    });
    return sendError(res, req, validation.status, validation.errorCode, validation.message);
  }

  const { normalizedUsername, normalizedEmail, normalizedPhoneNumber, password } = validation.data;

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await pool.query(
      `
      INSERT INTO users (role_id, username, email, password_hash, phone_number)
      VALUES (
        (SELECT role_id FROM roles WHERE name = $1),
        $2,
        $3,
        $4,
        $5
      )
      RETURNING user_id, username, email, phone_number AS "phoneNumber", created_at
      `,
      [DEFAULT_SIGNUP_ROLE, normalizedUsername, normalizedEmail, passwordHash, normalizedPhoneNumber]
    );

    await publishUserAuditEvent({
      eventType: 'SIGNUP',
      userId: result.rows[0].user_id,
      status: 'SUCCESS',
      ipAddress: resolveIpAddress(req),
      details: null,
    });

    return res.status(201).json({
      message: 'user created',
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      const conflict = getSignupConflictError(error);
      await publishUserAuditEvent({
        eventType: 'SIGNUP',
        userId: null,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: conflict.errorCode,
      });
      return sendError(res, req, 409, conflict.errorCode, conflict.message);
    }
    if (error.code === '23502') {
      await publishUserAuditEvent({
        eventType: 'SIGNUP',
        userId: null,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: 'ROLE_NOT_CONFIGURED',
      });
      return sendError(res, req, 500, 'ROLE_NOT_CONFIGURED', 'default signup role is not configured in roles table');
    }
    console.error('signup failed', error);
    await publishUserAuditEvent({
      eventType: 'SIGNUP',
      userId: null,
      status: 'FAILURE',
      ipAddress: resolveIpAddress(req),
      details: 'INTERNAL_SERVER_ERROR',
    });
    return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const validation = validateLoginInput(req.body);
  if (!validation.ok) {
    await publishUserAuditEvent({
      eventType: 'LOGIN',
      userId: null,
      status: 'FAILURE',
      ipAddress: resolveIpAddress(req),
      details: validation.errorCode,
    });
    return sendError(res, req, validation.status, validation.errorCode, validation.message);
  }

  const { normalizedUsername, password } = validation.data;

  try {
    const result = await pool.query(
      `
      SELECT u.user_id, u.password_hash, r.name AS role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.username = $1
      `,
      [normalizedUsername]
    );

    if (result.rows.length === 0) {
      await publishUserAuditEvent({
        eventType: 'LOGIN',
        userId: null,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: 'INVALID_LOGIN',
      });
      return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password || '', user.password_hash);
    if (!passwordMatches) {
      await publishUserAuditEvent({
        eventType: 'LOGIN',
        userId: user.user_id,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: 'INVALID_LOGIN',
      });
      return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
    }

    const token = jwt.sign(
      { sub: user.user_id, roles: [String(user.role_name).toUpperCase()] },
      SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, refresh_token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at
      `,
      [user.user_id, refreshTokenHash, refreshTokenExpiresAt]
    );

    await publishUserAuditEvent({
      eventType: 'LOGIN',
      userId: user.user_id,
      status: 'SUCCESS',
      ipAddress: resolveIpAddress(req),
      details: null,
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    return res.json({ token });
  } catch (error) {
    console.error('login failed', error);
    await publishUserAuditEvent({
      eventType: 'LOGIN',
      userId: null,
      status: 'FAILURE',
      ipAddress: resolveIpAddress(req),
      details: 'INTERNAL_SERVER_ERROR',
    });
    return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const { [REFRESH_COOKIE_NAME]: refreshToken } = req.cookies;
  if (!refreshToken) {
    return sendError(res, req, 401, 'MISSING_REFRESH_TOKEN', 'refresh token is required');
  }

  try {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const result = await pool.query(
      `
      SELECT r.user_id, r.expires_at, role.name AS role_name
      FROM refresh_tokens r
      JOIN users u ON r.user_id = u.user_id
      JOIN roles role ON role.role_id = u.role_id
      WHERE r.refresh_token = $1
      `,
      [refreshTokenHash]
    );

    if (result.rows.length === 0) {
      return sendError(res, req, 401, 'INVALID_REFRESH_TOKEN', 'invalid refresh token');
    }

    const {user_id: userId, expires_at: tokenExpiresAt, role_name: roleName} = result.rows[0];
    if (new Date(tokenExpiresAt) < new Date()) {
      return sendError(res, req, 401, 'EXPIRED_REFRESH_TOKEN', 'refresh token has expired');
    }

    const newToken = jwt.sign(
      { sub: userId, roles: [String(roleName).toUpperCase()] },
      SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    return res.json({ accessToken: newToken });
  } catch (error) {
    console.error('refresh token failed', error);
    return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const { [REFRESH_COOKIE_NAME]: refreshToken } = req.cookies;

  if (!refreshToken) {
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
    return res.status(204).send();
  }

  try {
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await pool.query(
      `
      DELETE FROM refresh_tokens
      WHERE refresh_token = $1
      `,
      [refreshTokenHash]
    );

    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
    return res.status(204).send();
  } catch (error) {
    console.error('logout failed', error);
    return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
  }
});

app.get('/api/auth/health', (req, res) => res.json({ status: 'up' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
