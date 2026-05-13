const express = require('express');
const router = express.Router();
const { getShipments, getShipment, createShipment, dispatchShipment, scanQR, markDelivered } = require('../controllers/shipmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getShipments);
router.get('/:id', authenticate, getShipment);
router.post('/', authenticate, authorize('admin', 'sales'), createShipment);
router.post('/scan', authenticate, authorize('admin', 'warehouse'), scanQR);
router.post('/:id/dispatch', authenticate, authorize('admin', 'warehouse'), dispatchShipment);
router.put('/:id/deliver', authenticate, authorize('admin', 'warehouse', 'sales'), markDelivered);

module.exports = router;
