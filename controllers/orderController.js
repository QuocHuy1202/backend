const { poolPromise, sql } = require('../config/db');
const { sendOrderConfirmationMail } = require('../utils/emailService');
const {
  checkStockAndPrice,
  insertOrder,
  updateStockAndInsertOrderItems,
  getOrderWithUser,
} = require('../models/orderModel');

async function createOrder(req, res) {
  const { user_id, items } = req.body;
  if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Missing user_id or items' });
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const totalPrice = await checkStockAndPrice(items, transaction);

    const order_id = await insertOrder(user_id, totalPrice, transaction);

    await updateStockAndInsertOrderItems(order_id, items, transaction);

    await transaction.commit();

    // Lấy thông tin đơn hàng để gửi mail
    const orderInfo = await getOrderWithUser(order_id);

    // Trả response trước khi gửi mail để tránh delay hoặc lỗi ảnh hưởng transaction
    res.status(201).json({ order_id, totalPrice });

    // Gửi mail không await, nếu lỗi cũng chỉ log mà không ảnh hưởng client
    await sendOrderConfirmationMail(orderInfo.email, orderInfo.name, orderInfo).catch(err => {
      console.error('Gửi mail xác nhận thất bại:', err);
    });

  } catch (error) {
    try {
      // rollback nếu transaction đang active (chưa commit/rollback)
      await transaction.rollback();
    } catch (rollbackError) {
      // có thể transaction chưa bắt đầu hoặc đã rollback/commit rồi, bỏ qua lỗi này
    }
    res.status(500).json({ error: error.message });
  }
}


async function getOrder(req, res) {
  const orderId = parseInt(req.params.id);
  if (!orderId) return res.status(400).json({ message: 'Invalid order id' });

  try {
    const order = await getOrderWithUser(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createOrder,
  getOrder,
};
