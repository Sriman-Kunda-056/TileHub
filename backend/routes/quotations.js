const express = require('express');
const router = express.Router();
const { query } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'sales'), asyncHandler(async (req, res) => {
  const result = await query('SELECT q.*, p.name AS product_name FROM quotations q LEFT JOIN products p ON p.id = q.product_id ORDER BY q.created_at DESC');
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { customer_name, customer_phone, customer_email, product_id, room_dimensions, message } = req.body;
  const num = await query('SELECT COUNT(*) FROM quotations');
  const quote_number = `QT-${String(parseInt(num.rows[0].count)+1).padStart(5,'0')}`;
  const result = await query(
    'INSERT INTO quotations (quote_number, customer_name, customer_phone, customer_email, product_id, room_dimensions, message) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [quote_number, customer_name, customer_phone, customer_email, product_id, room_dimensions, message]
  );
  res.status(201).json({ message: 'Quotation submitted. Our team will contact you within 24 hours.', id: result.rows[0].id });
}));

router.put('/:id/status', authenticate, authorize('admin', 'sales'), asyncHandler(async (req, res) => {
  await query('UPDATE quotations SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
  res.json({ message: 'Status updated' });
}));

module.exports = router;
