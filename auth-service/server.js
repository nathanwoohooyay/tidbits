require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

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
  const { username, email, password, phoneNumber } = req.body || {};
  console.log(req.body);
  if (!username || !email || !password || !phoneNumber) {
    return res.status(400).json({ error: 'username, email, password, and phoneNumber are required' });
  }

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
      [DEFAULT_SIGNUP_ROLE, username, email, passwordHash, phoneNumber]
    );

    return res.status(201).json({
      message: 'user created',
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'username, email, or phone number already exists' });
    }
    if (error.code === '23502') {
      return res.status(500).json({ error: 'default signup role is not configured in roles table' });
    }
    console.error('signup failed', error);
    return res.status(500).json({ error: 'internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT u.user_id, u.password_hash, r.name AS role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'invalid username or password' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password || '', user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'invalid username or password' });
    }

    const token = jwt.sign(
      { sub: user.user_id, roles: [String(user.role_name).toUpperCase()] },
      SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );
    return res.json({ token });
  } catch (error) {
    console.error('login failed', error);
    return res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/auth/health', (req, res) => res.json({ status: 'up' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`mission-auth-stub listening on http://localhost:${PORT}`);
  console.log(`Try: curl -X POST http://localhost:${PORT}/signup -H "Content-Type: application/json" -d '{"username":"alice","email":"alice@example.com","password":"mission123","phoneNumber":"+1-555-0123"}'`);
});
