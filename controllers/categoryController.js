const categoryModel = require('../models/categoryModel');

async function getAllCategories(req, res) {
  try {
    const categories = await categoryModel.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAllCategories };
