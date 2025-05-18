const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/search', productController.searchProducts);
router.get('/categories/:id/products', productController.getProductsByCategory);

module.exports = router;
