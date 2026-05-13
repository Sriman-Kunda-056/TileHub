const express = require('express');
const router = express.Router();
const { query } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'sales', 'accountant'), asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT c.*, u.name, u.phone, u.email, u.created_at
    FROM customers c JOIN users u ON u.id = c.user_id
    ORDER BY u.created_at DESC
  `);
  res.json(result.rows);
}));

router.post('/', authenticate, authorize('admin', 'sales'), asyncHandler(async (req, res) => {
  const { user_id, company_name, gst_number, billing_address, shipping_address, city, state, pincode } = req.body;
  const result = await query(
    'INSERT INTO customers (user_id, company_name, gst_number, billing_address, shipping_address, city, state, pincode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [user_id, company_name, gst_number, billing_address, shipping_address, city, state, pincode]
  );
  res.status(201).json(result.rows[0]);
}));

router.post('/showroom-booking', asyncHandler(async (req, res) => {
  const { user_id, name, phone, visit_date, visit_time, notes } = req.body;
  await query(
    'INSERT INTO showroom_bookings (user_id, name, phone, visit_date, visit_time, notes) VALUES ($1,$2,$3,$4,$5,$6)',
    [user_id, name, phone, visit_date, visit_time, notes]
  );
  res.status(201).json({ message: 'Showroom visit booked! We will confirm shortly.' });
}));

module.exports = router;
