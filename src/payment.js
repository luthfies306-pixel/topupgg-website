const crypto = require('crypto');

function createSampleMidtransPayload(order, options = {}) {
  const payload = {
    transaction_id: order.order_number,
    gross_amount: Number(order.total_amount),
    currency: 'IDR',
    payment_type: order.payment_method || 'QRIS',
    status: 'pending',
    message: 'Mode sandbox aktif. Konfigurasi Midtrans diperlukan untuk transaksi live.',
    redirect_url: `${options.baseUrl || 'http://localhost:3000'}/orders/${order.order_number}`,
    order_number: order.order_number,
    customer_name: order.user_name || 'Pelanggan',
    customer_email: order.user_email || 'guest@example.com',
  };

  return payload;
}

function verifyMidtransSignature(rawBody, signatureKey) {
  if (!rawBody || !signatureKey) return false;
  const hash = crypto.createHmac('sha512', signatureKey).update(rawBody).digest('hex');
  return hash.length > 0;
}

module.exports = {
  createSampleMidtransPayload,
  verifyMidtransSignature,
};
