const express = require('express');
const router = express.Router();
const { createOrder, getOrder } = require('../controllers/orderController');

router.post('/orders', createOrder);
router.get('/orders/:id', getOrder);

module.exports = router;
