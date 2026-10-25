# Daily Financial Diary 💰📊

Aplikasi pencatatan keuangan harian pribadi yang modern, bersih, rapi, dan responsif. Dibuat menggunakan HTML5, Vanilla Modern CSS, dan Vanilla JavaScript (ES6+), dilengkapi dengan grafik interaktif Chart.js, penyimpanan data lokal (*LocalStorage*), dan sistem autentikasi pengguna (*Single User Authentication*) menggunakan **Supabase**.

---

## 🔐 Sistem Autentikasi Supabase

Aplikasi ini kini dilengkapi gerbang autentikasi mandiri berbasis Supabase:
- **Halaman Login & Sign Up Tersendiri**: Tampilan yang rapi, modern, dan serasi dengan tema aplikasi (mendukung mode terang & gelap).
- **Proteksi Tampilan**: Dashboard utama disembunyikan secara otomatis saat pengguna belum masuk (*unauthenticated*).
- **Metode Autentikasi**:
  - `supabase.auth.signInWithPassword()` untuk login dengan email dan kata sandi.
  - `supabase.auth.signUp()` untuk pendaftaran akun pertama kali.
  - `supabase.auth.signOut()` melalui tombol **Keluar (Logout)** di sudut kanan atas header dashboard.
- **Listener Sesi Realtime**: Menggunakan `supabase.auth.onAuthStateChange()` dan `supabase.auth.getSession()` untuk mempertahankan status login pengguna secara otomatis.
- **Mode Demo (Bypass Sementara)**: Jika kredensial Supabase belum dimasukkan, pengguna tetap dapat menguji tampilan aplikasi secara langsung melalui tombol *"Coba Mode Demo"*.

---

## ⚙️ Cara Menghubungkan ke Supabase Anda

1. Masuk ke [Supabase Dashboard](https://supabase.com).
2. Buat proyek baru atau buka proyek yang sudah ada.
3. Buka menu **Project Settings** (ikon gerigi) &rarr; pilih tab **API**.
4. Salin:
   - **Project URL**
   - **Project API Keys** (pilih bagian `anon` `public`)
5. Buka berkas [js/supabaseClient.js](file:///d:/project%201/project%201/js/supabaseClient.js), lalu ganti nilai variabel:
   ```javascript
   const SUPABASE_URL = 'https://PROYEK_ANDA.supabase.co';
   const SUPABASE_ANON_KEY = 'KUNCI_ANON_PUBLIC_ANDA';
   ```
6. Buka atau muat ulang aplikasi di browser. Anda kini dapat mendaftar akun baru dan login secara aman!

> [!TIP]
> Jika Anda mengaktifkan **Confirm Email** di pengaturan Supabase (*Authentication &rarr; Providers &rarr; Email*), tautan konfirmasi akan dikirim ke email pendaftar sebelum dapat login. Jika ingin login instan tanpa konfirmasi email untuk pengujian lokal, matikan opsi *"Confirm email"* di dasbor Supabase Anda.

## 🗄️ Menyiapkan Database Cloud Supabase (Step 1)

Data transaksi Anda sekarang tersimpan langsung di database cloud Supabase dengan proteksi **Row Level Security (RLS)**:
1. Masuk ke [Supabase Dashboard](https://supabase.com) dan pilih proyek Anda.
2. Di menu bilah sisi kiri, klik ikon **SQL Editor** (ikon terminal/dokumen).
3. Klik tombol **New query**.
4. Buka berkas [supabase/schema.sql](file:///d:/project%201/project%201/supabase/schema.sql), lalu salin seluruh kodenya dan tempel (*paste*) ke SQL Editor Supabase.
5. Klik tombol hijau **Run** (atau tekan `Ctrl + Enter`).
6. Muncul pesan `Success. No rows returned` — tabel `transactions` dengan RLS otomatis aktif dan siap digunakan!

---

## ✨ Fitur Utama Lainnya

1. **Header Interaktif**:
   - Menampilkan tanggal hari ini secara dinamis dalam format Bahasa Indonesia (contoh: *Rabu, 14 Oktober 2026*).
   - Profil pengguna terautentikasi (alamat email).
   - Tombol cepat **`+ Tambah Catatan`** untuk membuka formulir modal transaksi.
   - Tombol **Mode Gelap / Terang (Dark/Light Mode)** dengan animasi mulus dan preferensi tersimpan di *LocalStorage*.
   - Tombol **Keluar (Logout)**.

2. **3 Kartu Metrik Ringkasan (Dashboard)**:
   - **Total Pemasukan**: Akumulasi seluruh pendapatan dengan jumlah transaksi (+).
   - **Total Pengeluaran**: Akumulasi seluruh pengeluaran dengan jumlah transaksi (-).
   - **Saldo Akhir**: Format Rupiah (IDR) otomatis (`Rp X.XXX.XXX`) dilengkapi status kesehatan kas (*Surplus* / *Defisit*).

3. **Komponen Grafik Interaktif (Chart.js via CDN)**:
   - Grafik Donat (*Doughnut Chart*) yang menampilkan proporsi pengeluaran berdasarkan kategori.
   - Pusat grafik menampilkan ringkasan beban pengeluaran.
   - Daftar legenda kustom dengan persentase dan bar kemajuan berwarna.

4. **Daily Feed (Daftar Transaksi Terkelompok)**:
   - Dikelompokkan rapi berdasarkan tanggal (*Hari Ini*, *Kemarin*, atau tanggal spesifik).
   - Dilengkapi *Net Cashflow* harian per tanggal.
   - Badge warna: Hijau untuk **Pemasukan (+)** dan Merah untuk **Pengeluaran (-)**.
   - Avatar kategori dengan ikon visual dan warna tematik.
   - Tombol hapus catatan langsung per item dengan konfirmasi dan notifikasi toast.
   - Filter tab: **Semua**, **Pemasukan (+)**, dan **Pengeluaran (-)**.
   - Fitur pencarian instan berdasarkan nama catatan atau kategori.

5. **Modal / Popup Transaksi Baru**:
   - Pilihan tipe transaksi: **Pengeluaran (-)** atau **Pemasukan (+)**.
   - Input nominal dengan format Rupiah otomatis (pemisah titik ribuan).
   - Pilihan kategori dinamis (Makanan, Belanja, Transport, Tagihan, Hiburan, Kesehatan, Gaji, Freelance, dll.).
   - Pemilih tanggal (*Date Picker*) yang otomatis diset ke hari ini.
   - Kolom catatan / keterangan transaksi dengan validasi.

6. **Indikator Kesehatan Finansial**:
   - Kalkulasi Rasio Tabungan (*Savings Rate*) otomatis.
   - Rata-rata pengeluaran dan pos pengeluaran terbesar.
   - Opsi *Reset Data Contoh* dan *Hapus Semua* untuk kemudahan pengujian.

---

## 📁 Struktur Direktori

```
project 1/
├── index.html            # Struktur semantik HTML5, meta tag, modal, & auth screen
├── css/
│   └── style.css         # Desain modern, tema gelap/terang, styling kartu & formulir auth
├── js/
│   ├── supabaseClient.js # Inisialisasi koneksi Supabase & konfigurasi kredensial
│   └── app.js            # Logika aplikasi, Supabase Auth listener, Chart.js, & Daily Feed
└── README.md             # Dokumentasi lengkap proyek
```

---

## 🚀 Cara Menjalankan

Aplikasi ini merupakan **aplikasi web statis murni** tanpa perlu kompilasi:

### Cara 1: Buka Langsung di Browser
Klik dua kali file [index.html](file:///d:/project%201/project%201/index.html) di File Explorer untuk membukanya di browser favorit Anda.

### Cara 2: Menjalankan Server Lokal (Opsional)
```bash
# Menjalankan server lokal Python
python -m http.server 3456

# Lalu buka browser di:
http://localhost:3456
```
