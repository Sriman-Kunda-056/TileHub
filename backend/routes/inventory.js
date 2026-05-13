const express = require('express');
const router = express.Router();
const { getInventory, getProductInventory, adjustStock, restock, getLowStockAlerts, updateSettings } = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'sales', 'warehouse', 'accountant'), getInventory);
router.get('/alerts', authenticate, authorize('admin', 'sales'), getLowStockAlerts);
router.get('/:productId', authenticate, getProductInventory);
router.post('/adjust', authenticate, authorize('admin', 'warehouse'), adjustStock);
router.post('/restock', authenticate, authorize('admin'), restock);
router.put('/:productId/settings', authenticate, authorize('admin'), updateSettings);

module.exports = router;
