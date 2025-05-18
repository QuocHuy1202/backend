const { sendOrderConfirmationMail } = require('./utils/emailService');

(async () => {
  const fakeOrder = {
    order_id: 12345,
    order_date: new Date(),
    total_price: 500000,
  };

  try {
    await sendOrderConfirmationMail(
      'huy.huynh120204@hcmut.edu.vn', // email nhận
      'Huỳnh Quốc Huy',               // tên người nhận
      fakeOrder                       // đơn hàng mẫu
    );
    console.log('📬 Test gửi email thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error.message);
  }
})();
