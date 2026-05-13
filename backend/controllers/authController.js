const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'customer' } = req.body;

  const existing = await query('SELECT id FROM users WHERE phone = $1 OR email = $2', [phone, email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Phone or email already registered' });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role, created_at`,
    [name, email, phone, password_hash, role]
  );

  const user = result.rows[0];
  res.status(201).json({ user, token: generateToken(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const result = await query(
    'SELECT id, name, email, phone, role, password_hash, is_active FROM users WHERE phone = $1',
    [phone]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid phone or password' });
  }

  const user = result.rows[0];
  if (!user.is_active) {
    return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid phone or password' });
  }

  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser, token: generateToken(user) });
});

// POST /api/auth/send-otp
const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const otp = generateOTP();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const result = await query(
    `INSERT INTO users (phone, role, otp_code, otp_expires_at)
     VALUES ($1, 'customer', $2, $3)
     ON CONFLICT (phone) DO UPDATE
       SET otp_code = $2, otp_expires_at = $3
     RETURNING id, phone`,
    [phone, otp, expires]
  );

  // In production: send SMS via Twilio
  // await twilioClient.messages.create({ body: `Your TileHub OTP: ${otp}`, from: ..., to: phone });

  console.log(`OTP for ${phone}: ${otp}`); // remove in production
  res.json({ message: 'OTP sent successfully', ...(process.env.NODE_ENV === 'development' && { otp }) });
});

// POST /api/auth/verify-otp
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const result = await query(
    `SELECT id, name, phone, role, otp_code, otp_expires_at
     FROM users WHERE phone = $1`,
    [phone]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Phone not found' });
  }

  const user = result.rows[0];
  if (user.otp_code !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  if (new Date() > new Date(user.otp_expires_at)) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  await query('UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1', [user.id]);

  res.json({ user, token: generateToken(user) });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json(result.rows[0]);
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!valid) return res.status(400).json({ error: 'Current password incorrect' });

  const hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ message: 'Password updated successfully' });
});

module.exports = { register, login, sendOTP, verifyOTP, getMe, changePassword };
