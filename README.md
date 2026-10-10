# TopupGG Website

TopupGG adalah proyek website top-up game modern yang dibuat dengan Node.js + Express + SQLite. Proyek ini fokus pada pengalaman pengguna premium, sistem order yang valid, login, admin dashboard, serta integrasi payment/supplier yang siap dikonfigurasi dalam mode sandbox.

Fitur aktif saat ini:
- Landing page premium dark neon
- Halaman game per kategori
- Order form dengan validasi dasar
- Cek pesanan berdasarkan nomor order
- Auth register/login untuk pengguna dan admin
- Dashboard admin untuk melihat order dan aktivitas
- Promo code validation
- SQLite database nyata
- Konfigurasi environment untuk payment/supplier API

Fitur yang masih memerlukan konfigurasi vendor:
- Payment gateway production (Midtrans)
- Supplier top-up live
- Webhook callback real
- HTTPS production dan domain valid

## Struktur proyek

- `server.js` — entry point server Express
- `src/db.js` — schema database, seed data, dan operasi query
- `src/payment.js` — helper payment dan webhook verification
- `public/` — file CSS dan JavaScript frontend
- `views/` — template halaman EJS
- `data/` — database SQLite
- `.env.example` — contoh environment

## Persyaratan

- Node.js 18+
- npm

## Instalasi

1. Clone repo.
2. Buat file `.env` dari `.env.example`.
3. Jalankan:

```bash
npm install
```

## Menjalankan aplikasi

```bash
npm start
```

Akses aplikasi di:

```bash
http://localhost:3000
```

## Login admin default

Email: `admin@topupgg.test`
Password: `AdminTopupGG123!`

Catatan: silakan diubah di environment production.

## Konfigurasi pembayaran

Isi variabel berikut di `.env`:

```bash
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
TOPUP_PROVIDER_API_KEY=
TOPUP_PROVIDER_BASE_URL=
BASE_URL=http://localhost:3000

PORT=3000
SESSION_SECRET=change_this_secret_in_production
NODE_ENV=development
```

Mode saat ini adalah sandbox. Website tidak akan memproses pembayaran live sebelum konfigurasi vendor dan webhook aktif.

## Pengujian transaksi

1. Jalankan aplikasi lokal.
2. Buat order di halaman game.
3. Gunakan payment method QRIS / Virtual Account / E-Wallet sesuai sandbox yang disediakan.
4. Cek status order di `/cek-pesanan`.
5. Setelah Midtrans dan supplier siap, aktifkan callback/webhook real di server.

## Catatan keamanan

- API key tidak disimpan di file frontend.
- Semua variabel sensitif menggunakan `.env` dan environment server.
- Tidak ada penyimpanan PIN, password, atau kredensial pembayaran user.
- Halaman admin tidak hanya disembunyikan by UI; akses juga dicek di server dengan `requireAdmin`.

## Status fitur

Status umum proyek:
- UI premium: aktif
- Order dibuat dan disimpan: aktif
- Cek pesanan: aktif
- Login register: aktif
- Admin dashboard: aktif
- Midtrans live: memerlukan konfigurasi vendor
- Supplier top-up live: memerlukan integrasi API nyata
- Webhook verification: tersedia untuk struktur, butuh kunci vendor aktif
