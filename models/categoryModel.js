const { poolPromise } = require('../config/db');

async function getAllCategories() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT category_id, name FROM Categories');
  return result.recordset;
}

module.exports = {
  getAllCategories,
};
