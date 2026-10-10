const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dbDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dbDir, { recursive: true });

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(dbDir, 'topupgg.db'));
db.pragma('journal_mode = WAL');

const createSchemaSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    game TEXT NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    nominal TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS promos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percent',
    value REAL NOT NULL DEFAULT 0,
    usage_limit INTEGER NOT NULL DEFAULT 0,
    used_count INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    user_name TEXT,
    user_email TEXT,
    game TEXT NOT NULL,
    product_id INTEGER,
    product_title TEXT NOT NULL,
    nominal TEXT NOT NULL,
    item_price REAL NOT NULL,
    discount_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'QRIS',
    payment_status TEXT NOT NULL DEFAULT 'pending_payment',
    order_status TEXT NOT NULL DEFAULT 'pending_payment',
    user_id_game TEXT,
    zone_id TEXT,
    notes TEXT,
    provider TEXT DEFAULT 'midtrans',
    provider_response TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admin_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`;

db.exec(createSchemaSQL);

function seedProducts() {
  const existingCount = db.prepare('SELECT COUNT(*) AS total FROM products').get().total;
  if (existingCount > 0) return;

  const productCatalog = [
    { game: 'Mobile Legends', slug: 'ml-86', title: '86 Diamonds', nominal: '86 Diamonds', price: 25000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Top-up cepat untuk akun Mobile Legends Anda.' },
    { game: 'Mobile Legends', slug: 'ml-172', title: '172 Diamonds', nominal: '172 Diamonds', price: 50000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Paket pop-up dengan bonus lebih besar.' },
    { game: 'Mobile Legends', slug: 'ml-257', title: '257 Diamonds', nominal: '257 Diamonds', price: 75000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Cocok untuk kebutuhan pulsa dan event.' },
    { game: 'Mobile Legends', slug: 'ml-514', title: '514 Diamonds', nominal: '514 Diamonds', price: 150000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Pilihan premium untuk kebutuhan besar.' },

    { game: 'Free Fire', slug: 'ff-70', title: '70 Diamonds', nominal: '70 Diamonds', price: 18000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Top-up aman untuk Free Fire.' },
    { game: 'Free Fire', slug: 'ff-140', title: '140 Diamonds', nominal: '140 Diamonds', price: 35000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Paket dengan harga lebih hemat.' },
    { game: 'Free Fire', slug: 'ff-355', title: '355 Diamonds', nominal: '355 Diamonds', price: 95000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Untuk kebutuhan event hingga skin legendaris.' },
    { game: 'Free Fire', slug: 'ff-720', title: '720 Diamonds', nominal: '720 Diamonds', price: 190000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Paket besar untuk komitmen jangka panjang.' },

    { game: 'PUBG Mobile', slug: 'pubgm-60', title: '60 UC', nominal: '60 UC', price: 20000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Paket UC PUBG Mobile sederhana.' },
    { game: 'PUBG Mobile', slug: 'pubgm-325', title: '325 UC', nominal: '325 UC', price: 100000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Paket sedang untuk kebutuhan lebih besar.' },
    { game: 'PUBG Mobile', slug: 'pubgm-660', title: '660 UC', nominal: '660 UC', price: 195000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Skema event dan estetika premium.' },
    { game: 'PUBG Mobile', slug: 'pubgm-1200', title: '1200 UC', nominal: '1200 UC', price: 350000, image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', description: 'Paket premium untuk kebutuhan maksimum.' },

    { game: 'Blood Strike', slug: 'bs-250', title: '250 Credits', nominal: '250 Credits', price: 32000, image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80', description: 'Top-up Blood Strike efektif dan aman.' },
    { game: 'Blood Strike', slug: 'bs-500', title: '500 Credits', nominal: '500 Credits', price: 62000, image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80', description: 'Paket sedang dengan diskon menarik.' },
    { game: 'Blood Strike', slug: 'bs-1000', title: '1000 Credits', nominal: '1000 Credits', price: 125000, image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80', description: 'Paket hemat untuk kebutuhan harian.' },
    { game: 'Blood Strike', slug: 'bs-2000', title: '2000 Credits', nominal: '2000 Credits', price: 240000, image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80', description: 'Untuk kebutuhan format battle besar.' },

    { game: 'Honor of Kings', slug: 'hok-36', title: '36 Tokens', nominal: '36 Tokens', price: 18000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Paket dasar untuk Honor of Kings.' },
    { game: 'Honor of Kings', slug: 'hok-90', title: '90 Tokens', nominal: '90 Tokens', price: 45000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Instan dan aman untuk akun Anda.' },
    { game: 'Honor of Kings', slug: 'hok-300', title: '300 Tokens', nominal: '300 Tokens', price: 140000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Paket premium untuk mode ranked.' },
    { game: 'Honor of Kings', slug: 'hok-600', title: '600 Tokens', nominal: '600 Tokens', price: 280000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Paket besar untuk kebutuhan intensif.' },

    { game: 'Magic Chess', slug: 'mc-90', title: '90 Gems', nominal: '90 Gems', price: 22000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Isi ulang Magic Chess cepat.' },
    { game: 'Magic Chess', slug: 'mc-190', title: '190 Gems', nominal: '190 Gems', price: 48000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Pilihan menengah untuk kebutuhan harian.' },
    { game: 'Magic Chess', slug: 'mc-350', title: '350 Gems', nominal: '350 Gems', price: 90000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Paket cukup untuk event khusus.' },
    { game: 'Magic Chess', slug: 'mc-700', title: '700 Gems', nominal: '700 Gems', price: 175000, image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', description: 'Paket besar untuk strategi tingkat lanjut.' },

    { game: 'FC Mobile', slug: 'fcm-100', title: '100 FC Points', nominal: '100 FC Points', price: 25000, image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80', description: 'Paket dasar untuk Kartu FC Mobile.' },
    { game: 'FC Mobile', slug: 'fcm-250', title: '250 FC Points', nominal: '250 FC Points', price: 60000, image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80', description: 'Paket moderen untuk kebutuhan event.' },
    { game: 'FC Mobile', slug: 'fcm-500', title: '500 FC Points', nominal: '500 FC Points', price: 125000, image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80', description: 'Top-up besar untuk kebutuhan tim.' },
    { game: 'FC Mobile', slug: 'fcm-1000', title: '1000 FC Points', nominal: '1000 FC Points', price: 240000, image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80', description: 'Paket premium untuk penggemar setia.' },

    { game: 'eFootball', slug: 'ef-200', title: '200 Coins', nominal: '200 Coins', price: 26000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Top-up eFootball dengan proses cepat.' },
    { game: 'eFootball', slug: 'ef-500', title: '500 Coins', nominal: '500 Coins', price: 60000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Paket hemat untuk pemula.' },
    { game: 'eFootball', slug: 'ef-1000', title: '1000 Coins', nominal: '1000 Coins', price: 120000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Versi menengah untuk kebutuhan rutin.' },
    { game: 'eFootball', slug: 'ef-2500', title: '2500 Coins', nominal: '2500 Coins', price: 285000, image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', description: 'Paket premium untuk penggemar eFootball.' }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (slug, game, title, image_url, description, nominal, price, stock, active)
    VALUES (@slug, @game, @title, @image_url, @description, @nominal, @price, @stock, @active)
  `);

  for (const product of productCatalog) {
    insertProduct.run({
      ...product,
      stock: 999,
      active: 1,
    });
  }
}

function seedDefaultPromos() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM promos').get().total;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO promos (code, type, value, usage_limit, used_count, active, expires_at, description)
    VALUES (@code, @type, @value, @usage_limit, @used_count, @active, @expires_at, @description)
  `);

  insert.run({
    code: 'TOPUPGG10',
    type: 'percent',
    value: 10,
    usage_limit: 100,
    used_count: 0,
    active: 1,
    expires_at: '2035-12-31 23:59:59',
    description: 'Diskon 10% untuk semua order baru.'
  });

  insert.run({
    code: 'VIP5',
    type: 'percent',
    value: 5,
    usage_limit: 50,
    used_count: 0,
    active: 1,
    expires_at: '2035-12-31 23:59:59',
    description: 'Kode member khusus untuk pembelian premium.'
  });
}

function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@topupgg.test';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminTopupGG123!';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existing) return;

  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `).run('Admin TopupGG', adminEmail, passwordHash);
}

seedProducts();
seedDefaultPromos();
seedAdminUser();

function getProductsByGame(game) {
  return db.prepare(`
    SELECT * FROM products
    WHERE game = ? AND active = 1
    ORDER BY price ASC
  `).all(game);
}

function getAllProducts() {
  return db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY game, price ASC').all();
}

function getProductById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function getProductBySlug(slug) {
  return db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').get(slug);
}

function getGameList() {
  const rows = db.prepare('SELECT DISTINCT game FROM products WHERE active = 1 ORDER BY game ASC').all();
  return rows.map((row) => row.game);
}

function createUser({ name, email, password, role = 'user' }) {
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run(name, email.toLowerCase(), passwordHash, role);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function createOrder(orderPayload) {
  const orderNumber = `TG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO orders (
      order_number,
      user_id,
      user_name,
      user_email,
      game,
      product_id,
      product_title,
      nominal,
      item_price,
      discount_amount,
      total_amount,
      payment_method,
      payment_status,
      order_status,
      user_id_game,
      zone_id,
      notes,
      provider,
      provider_response,
      created_at,
      updated_at
    ) VALUES (
      @order_number,
      @user_id,
      @user_name,
      @user_email,
      @game,
      @product_id,
      @product_title,
      @nominal,
      @item_price,
      @discount_amount,
      @total_amount,
      @payment_method,
      @payment_status,
      @order_status,
      @user_id_game,
      @zone_id,
      @notes,
      @provider,
      @provider_response,
      @created_at,
      @updated_at
    )
  `);

  const result = insert.run({
    ...orderPayload,
    order_number: orderNumber,
    payment_status: orderPayload.payment_status || 'pending_payment',
    order_status: orderPayload.order_status || 'pending_payment',
    created_at: now,
    updated_at: now,
  });

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
}

function getOrderByNumber(orderNumber) {
  return db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
}

function getOrdersForUser(userId) {
  return db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function listAllOrders(limit = 25) {
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').all(limit);
}

function updateOrderStatus(orderId, fields) {
  const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!current) return null;

  const updates = { ...current, ...fields, updated_at: new Date().toISOString() };

  db.prepare(`
    UPDATE orders SET
      payment_status = @payment_status,
      order_status = @order_status,
      provider_response = @provider_response,
      updated_at = @updated_at
    WHERE id = @id
  `).run(updates);

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
}

function getActivePromoByCode(code) {
  const normalized = code ? code.trim().toUpperCase() : '';
  if (!normalized) return null;
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT * FROM promos
    WHERE code = ?
      AND active = 1
      AND (expires_at IS NULL OR expires_at > ?)
  `).get(normalized, now);
}

function applyPromoToAmount(code, amount) {
  const promo = getActivePromoByCode(code);
  if (!promo) return { valid: false, discount_amount: 0, message: 'Kode promo tidak valid atau sudah kedaluwarsa.' };

  let discountAmount = 0;
  if (promo.type === 'percent') {
    discountAmount = amount * (promo.value / 100);
  } else {
    discountAmount = promo.value;
  }

  if (promo.usage_limit > 0 && promo.used_count >= promo.usage_limit) {
    return { valid: false, discount_amount: 0, message: 'Batas penggunaan kode promo sudah tercapai.' };
  }

  return {
    valid: true,
    discount_amount: Number(discountAmount.toFixed(2)),
    promo,
    message: 'Promo berhasil diterapkan.'
  };
}

function incrementPromoUsage(code) {
  db.prepare(`
    UPDATE promos
    SET used_count = used_count + 1
    WHERE code = ?
  `).run(code.trim().toUpperCase());
}

function logActivity(userId, action, details) {
  db.prepare(`
    INSERT INTO admin_activity (user_id, action, details)
    VALUES (?, ?, ?)
  `).run(userId, action, details || '');
}

function getAdminActivity(limit = 20) {
  return db.prepare(`
    SELECT a.*, u.name AS user_name, u.email AS user_email
    FROM admin_activity a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit);
}

function getStats() {
  return {
    totalOrders: db.prepare('SELECT COUNT(*) AS total FROM orders').get().total,
    totalUsers: db.prepare('SELECT COUNT(*) AS total FROM users').get().total,
    totalProducts: db.prepare('SELECT COUNT(*) AS total FROM products').get().total,
    pendingOrders: db.prepare("SELECT COUNT(*) AS total FROM orders WHERE order_status = 'pending_payment'").get().total,
    successfulOrders: db.prepare("SELECT COUNT(*) AS total FROM orders WHERE order_status = 'successful'").get().total,
    revenue: db.prepare('SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = ?').get('paid').total,
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  db,
  getAllProducts,
  getProductsByGame,
  getProductById,
  getProductBySlug,
  getGameList,
  findUserByEmail,
  findUserById,
  verifyPassword,
  createUser,
  createOrder,
  getOrderByNumber,
  getOrdersForUser,
  listAllOrders,
  updateOrderStatus,
  applyPromoToAmount,
  incrementPromoUsage,
  getActivePromoByCode,
  logActivity,
  getAdminActivity,
  getStats,
  sanitizeUser,
  crypto,
};
