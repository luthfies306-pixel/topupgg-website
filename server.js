const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

const {
  getAllProducts,
  getProductsByGame,
  getGameList,
  getProductById,
  getProductBySlug,
  findUserByEmail,
  createUser,
  verifyPassword,
  createOrder,
  getOrderByNumber,
  getOrdersForUser,
  listAllOrders,
  updateOrderStatus,
  applyPromoToAmount,
  incrementPromoUsage,
  sanitizeUser,
  getStats,
  getAdminActivity,
  logActivity,
} = require('./src/db');

const { createSampleMidtransPayload, verifyMidtransSignature } = require('./src/payment');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'topupgg-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  res.locals.currentPath = req.path;
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Akses ditolak',
      message: 'Halaman admin hanya bisa diakses oleh admin yang terautentikasi.'
    });
  }
  next();
}

app.get('/', (req, res) => {
  const products = getAllProducts();
  const games = getGameList();
  res.render('index', {
    title: 'TopupGG | Top-Up Game Profesional',
    games,
    products,
    page: 'home'
  });
});

app.get('/games/:slug', (req, res) => {
  const product = getProductBySlug(req.params.slug);
  if (!product) {
    return res.status(404).render('error', {
      title: 'Game tidak ditemukan',
      message: 'Produk game yang Anda cari tidak tersedia.'
    });
  }

  const gameProducts = getProductsByGame(product.game);
  res.render('game', {
    title: `${product.game} | TopupGG`,
    product,
    gameProducts,
    games: getGameList(),
    page: 'topup'
  });
});

app.get('/cek-pesanan', (req, res) => {
  const orderNumber = req.query.order || '';
  let currentOrder = null;
  if (orderNumber) {
    currentOrder = getOrderByNumber(orderNumber.trim());
  }

  res.render('order-check', {
    title: 'Cek Pesanan | TopupGG',
    orderNumber,
    currentOrder,
    page: 'cek-pesanan'
  });
});

app.get('/promo', (req, res) => {
  res.render('promo', {
    title: 'Promo & Redeem Kode | TopupGG',
    page: 'promo'
  });
});

app.get('/bantuan', (req, res) => {
  res.render('help', {
    title: 'Pusat Bantuan | TopupGG',
    page: 'bantuan'
  });
});

app.get('/terms', (req, res) => {
  res.render('terms', {
    title: 'Syarat & Ketentuan | TopupGG',
    page: 'terms'
  });
});

app.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: 'Kebijakan Privasi | TopupGG',
    page: 'privacy'
  });
});

app.get('/refund', (req, res) => {
  res.render('refund', {
    title: 'Kebijakan Refund | TopupGG',
    page: 'refund'
  });
});

app.get('/login', (req, res) => {
  const nextPath = req.query.next || '/';
  if (req.session.user) {
    return res.redirect(nextPath);
  }
  res.render('login', {
    title: 'Masuk | TopupGG',
    nextPath,
    page: 'login'
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).render('login', {
      title: 'Masuk | TopupGG',
      error: 'Email atau password salah.',
      page: 'login'
    });
  }

  req.session.user = sanitizeUser(user);
  const nextPath = req.body.next || '/';
  res.redirect(nextPath);
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/account');
  }
  res.render('register', {
    title: 'Daftar | TopupGG',
    page: 'register'
  });
});

app.post('/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return res.status(400).render('register', {
      title: 'Daftar | TopupGG',
      error: 'Semua field wajib diisi.',
      page: 'register'
    });
  }

  if (password.length < 8) {
    return res.status(400).render('register', {
      title: 'Daftar | TopupGG',
      error: 'Password minimal 8 karakter.',
      page: 'register'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).render('register', {
      title: 'Daftar | TopupGG',
      error: 'Konfirmasi password tidak cocok.',
      page: 'register'
    });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(400).render('register', {
      title: 'Daftar | TopupGG',
      error: 'Email sudah terdaftar.',
      page: 'register'
    });
  }

  const user = createUser({ name, email, password, role: 'user' });
  req.session.user = sanitizeUser(user);
  res.redirect('/account');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/account', requireAuth, (req, res) => {
  const orders = getOrdersForUser(req.session.user.id);
  res.render('account', {
    title: 'Akun Saya | TopupGG',
    orders,
    page: 'account'
  });
});

app.get('/admin', requireAdmin, (req, res) => {
  const orders = listAllOrders(20);
  const stats = getStats();
  const activities = getAdminActivity(15);
  res.render('admin', {
    title: 'Admin Dashboard | TopupGG',
    orders,
    stats,
    activities,
    page: 'admin'
  });
});

app.get('/api/products', (req, res) => {
  res.json(getAllProducts());
});

app.post('/api/orders', (req, res) => {
  const { productId, paymentMethod, userIdGame, zoneId, notes, promoCode, customerName, customerEmail } = req.body;
  const product = getProductById(Number(productId));

  if (!product || product.active !== 1) {
    return res.status(400).json({ ok: false, message: 'Produk tidak valid.' });
  }

  const finalName = customerName || req.session.user?.name || 'Pelanggan';
  const finalEmail = customerEmail || req.session.user?.email || 'guest@topupgg.local';

  if (!userIdGame || !finalName || !finalEmail) {
    return res.status(400).json({ ok: false, message: 'User ID/Game ID, nama, dan email wajib diisi.' });
  }

  const promoResult = promoCode ? applyPromoToAmount(promoCode, product.price) : { valid: true, discount_amount: 0 };
  if (promoCode && !promoResult.valid) {
    return res.status(400).json({ ok: false, message: promoResult.message });
  }

  const discountAmount = Number(promoResult.discount_amount || 0);
  const totalAmount = Math.max(0, product.price - discountAmount);

  const orderPayload = {
    user_id: req.session.user?.id || null,
    user_name: finalName,
    user_email: finalEmail,
    game: product.game,
    product_id: product.id,
    product_title: product.title,
    nominal: product.nominal,
    item_price: product.price,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    payment_method: paymentMethod || 'QRIS',
    payment_status: 'pending_payment',
    order_status: 'pending_payment',
    user_id_game: userIdGame,
    zone_id: zoneId || '',
    notes: notes || '',
    provider: 'midtrans',
    provider_response: JSON.stringify({ promoCode: promoCode || null, status: 'sandbox' }),
  };

  const order = createOrder(orderPayload);

  if (promoCode && promoResult.valid) {
    incrementPromoUsage(promoCode);
  }

  if (req.session.user) {
    logActivity(req.session.user.id, 'CREATE_ORDER', `Membuat order ${order.order_number}`);
  }

  const paymentPayload = createSampleMidtransPayload(order, {
    baseUrl: process.env.BASE_URL || `http://localhost:${PORT}`
  });

  return res.json({
    ok: true,
    order,
    payment: {
      mode: 'sandbox',
      provider: 'midtrans',
      status: 'pending_payment',
      paymentDetails: paymentPayload,
      instructions: 'Transaksi dibuat dalam mode sandbox. Masukkan MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY untuk memproses pembayaran live.'
    }
  });
});

app.get('/orders/:orderNumber', (req, res) => {
  const order = getOrderByNumber(req.params.orderNumber);
  if (!order) {
    return res.status(404).render('error', {
      title: 'Pesanan tidak ditemukan',
      message: 'Nomor pesanan yang Anda masukkan tidak tersedia.'
    });
  }

  res.render('order-detail', {
    title: `Pesanan ${order.order_number} | TopupGG`,
    order,
    page: 'order-detail'
  });
});

app.get('/api/orders/:orderNumber', (req, res) => {
  const order = getOrderByNumber(req.params.orderNumber);
  if (!order) {
    return res.status(404).json({ ok: false, message: 'Pesanan tidak ditemukan.' });
  }

  return res.json({ ok: true, order });
});

app.post('/api/redeem', (req, res) => {
  const { code, amount } = req.body;
  if (!code) {
    return res.status(400).json({ ok: false, message: 'Kode promo wajib diisi.' });
  }

  const promoResult = applyPromoToAmount(code, Number(amount || 0));
  return res.json({ ok: promoResult.valid, ...promoResult });
});

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const rawBody = req.body.toString('utf8');
  const signature = req.headers['x-midtrans-signature'];
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    return res.status(200).json({ ok: true, mode: 'sandbox', message: 'Webhook diterima dalam mode sandbox.' });
  }

  const verified = verifyMidtransSignature(rawBody, serverKey);
  if (!verified) {
    return res.status(400).json({ ok: false, message: 'Signature tidak valid.' });
  }

  try {
    const payload = JSON.parse(rawBody);
    const order = getOrderByNumber(payload.order_id || payload.order_number || payload.transaction_id);
    if (order) {
      updateOrderStatus(order.id, {
        payment_status: payload.transaction_status === 'settlement' ? 'paid' : 'pending_payment',
        order_status: payload.transaction_status === 'settlement' ? 'processing' : 'pending_payment',
        provider_response: JSON.stringify(payload)
      });
    }
  } catch (error) {
    console.error('Webhook error', error);
  }

  return res.status(200).json({ ok: true, received: true });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({ ok: true, stats: getStats() });
});

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Halaman tidak ditemukan',
    message: 'Maaf, halaman yang Anda buka tidak tersedia saat ini.'
  });
});

app.listen(PORT, () => {
  console.log(`TopupGG running on http://localhost:${PORT}`);
  console.log('Mode aktif: sandbox. Konfigurasi real API di .env untuk transaksi live.');
});
