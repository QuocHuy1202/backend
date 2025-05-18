const productModel = require('../models/productModel');

async function getProductsByCategory(req, res) {
  const categoryId = parseInt(req.params.id);
  if (isNaN(categoryId)) return res.status(400).json({ error: 'Invalid category id' });

  try {
    const products = await productModel.getProductsByCategory(categoryId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function searchProducts(req, res) {
  const { term, minPrice, maxPrice, categoryId } = req.query;
  try {
    const products = await productModel.searchProducts({
      term,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getProductsByCategory,
  searchProducts,
};
