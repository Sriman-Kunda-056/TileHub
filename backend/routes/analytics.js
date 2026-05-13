const express = require('express');
const router = express.Router();
const { getDashboard, getStockReport, getSalesReport } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('admin', 'accountant'), getDashboard);
router.get('/stock', authenticate, authorize('admin', 'accountant', 'warehouse'), getStockReport);
router.get('/sales', authenticate, authorize('admin', 'accountant'), getSalesReport);

module.exports = router;
