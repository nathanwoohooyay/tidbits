require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { sendError } = require('./utils/errorResponse');
const {
  validateSignupInput,
  validateLoginInput,
  getSignupConflictError,
} = require('./validation/authValidation');

const app = express();
app.use(express.json());

// Shared secret - the mission service (Java) validates tokens signed with
// this exact string. In a real system this would come from a secrets
// manager, never be hardcoded, and never be the same value in two
// unrelated services - here it's deliberately visible so the group can see
// EXACTLY what "the two services agree on a secret" means in practice.
const SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
const DEFAULT_SIGNUP_ROLE = 'client';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.post('/api/auth/signup', async (req, res) => {
  const validation = validateSignupInput(req.body);
  if (!validation.ok) {
    return sendError(res, req, validation.status, validation.errorCode, validation.message);
  }

  const { normalizedUsername, normalizedEmail, normalizedPhoneNumber, password } = validation.data;

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `
      INSERT INTO users (role_id, username, email, password_hash, phone_number)
      VALUES (
        (SELECT role_id FROM roles WHERE name = $1::role_type),
        $2,
        $3,
        $4,
        $5
      )
      RETURNING user_id, username, email, phone_number AS "phoneNumber", created_at
      `,
      [DEFAULT_SIGNUP_ROLE, normalizedUsername, normalizedEmail, passwordHash, normalizedPhoneNumber]
    );

    return res.status(201).json({
      message: 'user created',
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      const conflict = getSignupConflictError(error);
      return sendError(res, req, 409, conflict.errorCode, conflict.message);
    }
    if (error.code === '23502') {
      return sendError(res, req, 500, 'ROLE_NOT_CONFIGURED', 'default signup role is not configured in roles table');
    }
    console.error('signup failed', error);
    return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const validation = validateLoginInput(req.body);
  if (!validation.ok) {
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
      return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password || '', user.password_hash);
    if (!passwordMatches) {
      return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
    }

    const token = jwt.sign(
      { sub: user.user_id, roles: [String(user.role_name).toUpperCase()] },
      SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );
    return res.json({ token });
  } catch (error) {
    console.error('login failed', error);
    return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
  }
});

app.get('/api/auth/health', (req, res) => res.json({ status: 'up' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`mission-auth-stub listening on http://localhost:${PORT}`);
  console.log(`Try: curl -X POST http://localhost:${PORT}/api/auth/signup -H "Content-Type: application/json" -d '{"username":"alice","email":"alice@example.com","password":"mission123","phoneNumber":"+1-555-0123"}'`);
});
