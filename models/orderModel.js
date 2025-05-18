const { poolPromise, sql } = require('../config/db');

async function checkStockAndPrice(items, transaction) {
  let totalPrice = 0;
  for (const item of items) {
    const { product_id, variant_id, quantity } = item;
    if (!product_id||!variant_id || !quantity || quantity <= 0) {
      throw new Error('Invalid product_id or variant_id or quantity');
    }

    let request = new sql.Request(transaction);
    const stockRes = await request
      .input('variant_id', sql.Int, variant_id)
      .query('SELECT quantity FROM ProductDetails WHERE variant_id = @variant_id');
    if (stockRes.recordset.length === 0) throw new Error(`Variant ${variant_id} not found`);
    if (stockRes.recordset[0].quantity < quantity) throw new Error(`Insufficient stock for variant ${variant_id}`);

    request = new sql.Request(transaction);
    const priceRes = await request
      .input('variant_id', sql.Int, variant_id)
      .query(`SELECT p.price 
              FROM Products p 
              INNER JOIN ProductDetails pd ON p.product_id = pd.product_id 
              WHERE pd.variant_id = @variant_id`);
    if (priceRes.recordset.length === 0) throw new Error(`Price not found for variant ${variant_id}`);

    totalPrice += priceRes.recordset[0].price * quantity;
  }
  return totalPrice;
}

async function insertOrder(user_id, totalPrice, transaction) {
  const request = new sql.Request(transaction);
  const insertOrderRes = await request
    .input('user_id', sql.Int, user_id)
    .input('order_date', sql.DateTime, new Date())
    .input('total_price', sql.Decimal(18, 2), totalPrice)
    .input('status', sql.NVarChar(50), 'Đã đặt hàng')
    .query(`INSERT INTO Orders (user_id, order_date, total_price, status)
            OUTPUT INSERTED.order_id
            VALUES (@user_id, @order_date, @total_price, @status)`);
  return insertOrderRes.recordset[0].order_id;
}

async function updateStockAndInsertOrderItems(order_id, items, transaction) {
  for (const item of items) {
    const { product_id, variant_id, quantity } = item;

    let request = new sql.Request(transaction);
    await request
      .input('variant_id', sql.Int, variant_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE ProductDetails SET quantity = quantity - @quantity WHERE variant_id = @variant_id');

    request = new sql.Request(transaction);
    const priceRes = await request
      .input('variant_id', sql.Int, variant_id)
      .query(`SELECT p.price 
              FROM Products p 
              INNER JOIN ProductDetails pd ON p.product_id = pd.product_id 
              WHERE pd.variant_id = @variant_id`);

    request = new sql.Request(transaction);
    await request
      .input('order_id', sql.Int, order_id)
      .input('product_id', sql.Int, product_id)
      .input('variant_id', sql.Int, variant_id)
      .input('quantity', sql.Int, quantity)
      .input('price_each', sql.Decimal(18, 2), priceRes.recordset[0].price)
      .query('INSERT INTO OrderItems (order_id, product_id, variant_id, quantity, price_each) VALUES (@order_id, @product_id, @variant_id, @quantity, @price_each)');
  }
}

async function getOrderWithUser(order_id) {
  const pool = await poolPromise;

  // Lấy thông tin order
  const orderResult = await pool.request()
    .input('order_id', sql.Int, order_id)
    .query('SELECT o.order_id, o.total_price, o.order_date, u.email, u.name FROM Orders o JOIN Users u ON o.user_id = u.user_id WHERE o.order_id = @order_id');

  if (orderResult.recordset.length === 0) return null;

  const order = orderResult.recordset[0];

  // Lấy danh sách item kèm product_id, quantity, price
  const itemsResult = await pool.request()
    .input('order_id', sql.Int, order_id)
    .query('SELECT product_id, quantity, price_each FROM OrderItems WHERE order_id = @order_id');

  order.items = itemsResult.recordset;

  // Nếu bạn muốn, bạn có thể lấy tên sản phẩm ngay ở đây hoặc bên hàm gửi mail cũng được.

  return order;
}

module.exports = {
  checkStockAndPrice,
  insertOrder,
  updateStockAndInsertOrderItems,
  getOrderWithUser,
};
