const { poolPromise } = require('../config/db');

async function getProductsByCategory(categoryId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('categoryId', categoryId)
    .query('SELECT product_id, name, price, category_id, store_id, be_liked FROM Products WHERE category_id = @categoryId');
  return result.recordset;
}

async function searchProducts({ term, minPrice, maxPrice, categoryId }) {
  const pool = await poolPromise;

  let sqlQuery = `
    SELECT p.product_id, p.name, p.price, c.name as category_name, s.name as store_name
    FROM Products p
    INNER JOIN Categories c ON p.category_id = c.category_id
    INNER JOIN Stores s ON p.store_id = s.store_id
    WHERE 1=1
  `;
  let request = pool.request();

  if (term) {
    sqlQuery += ' AND (p.name LIKE @term)';
    request.input('term', `%${term}%`);
  }
  if (minPrice) {
    sqlQuery += ' AND p.price >= @minPrice';
    request.input('minPrice', minPrice);
  }
  if (maxPrice) {
    sqlQuery += ' AND p.price <= @maxPrice';
    request.input('maxPrice', maxPrice);
  }
  if (categoryId) {
    sqlQuery += ' AND p.category_id = @categoryId';
    request.input('categoryId', categoryId);
  }

  const result = await request.query(sqlQuery);
  return result.recordset;
}

module.exports = {
  getProductsByCategory,
  searchProducts,
};
