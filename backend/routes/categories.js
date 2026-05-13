const express = require('express');
const router = express.Router();
const { query } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order');
  res.json(result.rows);
}));

router.post('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, slug, description } = req.body;
  const result = await query(
    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
    [name, slug, description]
  );
  res.status(201).json(result.rows[0]);
}));

module.exports = router;
