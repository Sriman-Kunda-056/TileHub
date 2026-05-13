const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, uploadImages } = require('../controllers/productController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = multer({ dest: '/tmp/uploads/' });

router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProduct);
router.post('/', authenticate, authorize('admin', 'sales'), createProduct);
router.put('/:id', authenticate, authorize('admin', 'sales'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);
router.post('/:id/images', authenticate, authorize('admin', 'sales'), upload.array('images', 10), uploadImages);

module.exports = router;
