const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, recordPayment, generatePDF, generateBOQ } = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/invoices', authenticate, authorize('admin', 'accountant', 'sales'), getInvoices);
router.get('/invoices/:id', authenticate, getInvoice);
router.get('/invoices/:id/pdf', authenticate, generatePDF);
router.post('/invoices', authenticate, authorize('admin', 'accountant', 'sales'), createInvoice);
router.post('/invoices/:id/payment', authenticate, authorize('admin', 'accountant'), recordPayment);
router.post('/boq', generateBOQ);

module.exports = router;
