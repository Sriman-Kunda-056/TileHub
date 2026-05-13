const express = require('express');
const router = express.Router();
const { generateBOQ } = require('../controllers/billingController');
router.post('/', generateBOQ);
module.exports = router;
