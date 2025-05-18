const nodemailer = require('nodemailer');
const { poolPromise, sql } = require('../config/db'); 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL,
    pass: process.env.APPPASSWORD //Dùng app password
  }
});

async function sendOrderConfirmationMail(toEmail, userName, order) {
  const pool = await poolPromise;

  
  
  const itemsWithName = await Promise.all(order.items.map(async (item) => {
    const result = await pool.request()
      .input('product_id', sql.Int, item.product_id)
      .query('SELECT name FROM Products WHERE product_id = @product_id');
    
    const product_name = result.recordset.length > 0 ? result.recordset[0].name : 'Unknown product';
    return {
      ...item,
      product_name,
    };
  }));
  
  const itemsHTML = itemsWithName.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.product_name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.price_each.toLocaleString()} VND</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: '"ShopABC" <quochuyhuynh.120204@gmail.com>',
    to: toEmail,
    subject: `🛒 Xác nhận đơn hàng #${order.order_id} từ ShopABC`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Xin chào ${userName},</h2>
        <p>Bạn đã đặt hàng thành công tại <strong>Shop ABC</strong> vào lúc <strong>${new Date(order.order_date).toLocaleString()}</strong>.</p>

        <p><strong>Mã đơn hàng:</strong> ${order.order_id}</p>

        <h3>🧾 Thông tin đơn hàng:</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Sản phẩm</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Số lượng</th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Giá mỗi sản phẩm</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <p style="margin-top: 10px;"><strong>Tổng cộng:</strong> ${order.total_price.toLocaleString()} VND</p>

        <p>📦 Chúng tôi sẽ xử lý đơn hàng của bạn và thông báo khi hàng được giao.</p>
        <p>💬 Mọi thắc mắc vui lòng liên hệ <a href="mailto:quochuyhuynh.120204@gmail.com">quochuyhuynh.120204@gmail.com</a>.</p>

        <p style="margin-top: 20px;">Cảm ơn bạn đã mua sắm tại <strong>Shop ABC</strong> ❤️</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email đã được gửi đến:', toEmail);
  } catch (err) {
    console.error('❌ Gửi email thất bại:', err);
    throw new Error('Gửi email xác nhận thất bại');
  }
}

module.exports = { sendOrderConfirmationMail };
