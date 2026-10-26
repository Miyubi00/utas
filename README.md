# Lembar Senja — Lini Masa Utas Reflektif

Website mikro-jurnal dan utas (*threads*) reflektif hening dengan tema coklat-krem hangat (*warm vintage paper*).

- **Pengunjung Publik**: Hanya bisa membaca lini masa utas (Read-Only). Tidak ada formulir komentar, tombol tulis, maupun tautan tombol admin di antarmuka publik.
- **Pengelola (Admin)**: Masuk langsung melalui URL khusus (`/admin/login` atau `/admin`) menggunakan Supabase Auth (email + kata sandi).
- **Fitur Utas**: Postingan pemikiran pendek, balasan berantai (*threaded replies*) dengan garis penghubung vertikal, penyematan (*pin*), dan lampiran gambar.
- **Template personal**: Nama aplikasi, username, dan deskripsi dapat diubah dari Pengaturan admin.
- **Bot Telegram**: Admin dapat membuat utas dan membalas utas melalui pesan pribadi ke bot yang terhubung.

---

## 1. Setup Supabase

### Langkah A: Jalankan Migrasi Database
Jalankan dari folder proyek yang sudah di-link ke Supabase. Migrasi awal membuat tabel utas dan jurnal; migrasi berikutnya menambahkan personalisasi dan backend Telegram.

```bash
supabase migration list --linked
supabase db push --dry-run
supabase db push
```

`supabase/schema.sql` tetap tersedia sebagai skema dasar untuk pemasangan manual lewat SQL Editor.

### Langkah B: Buat Akun Admin Manual
1. Buka menu **Authentication** > **Users** > **Add User** > **Create User**.
2. Masukkan email (misal: `admin@lebarsenja.com`) dan buat kata sandi aman.
3. Centang opsi *Auto Confirm User*.

### Langkah C: Matikan Sign-Up Publik
1. Buka menu **Authentication** > **Providers** > **Email**.
2. Nonaktifkan (uncheck) **Allow new users to sign up** agar publik tidak dapat membuat akun.

### Langkah D: Deploy Edge Functions Telegram
Bot menggunakan Edge Functions agar token bot tidak pernah dikirim kembali ke browser.

1. Pasang Supabase CLI, lalu hubungkan folder ini ke proyek:
   ```bash
   npx supabase link --project-ref <project-ref>
   ```
2. Deploy kedua fungsi:
   ```bash
   npx supabase functions deploy telegram-admin
   npx supabase functions deploy telegram-webhook
   ```
   `telegram-admin` meminta sesi admin Supabase. `telegram-webhook` memverifikasi secret header yang dipasang Telegram saat bot dihubungkan.
3. Di Telegram, buat bot lewat [@BotFather](https://t.me/BotFather). Buka `/admin/pengaturan`, masukkan token bot dan Telegram user ID Anda, lalu pilih **Simpan & hubungkan bot**.
4. Kirim pesan pribadi ke bot. Setiap perintah memulai langkah yang dipandu bot; tekan **Keluar** untuk membatalkan:
   - `/thread` lalu kirim isi utas.
   - `/reply` lalu kirim ID 6 karakter utas dan isi balasan.
   - `/list` lalu kirim nomor halaman; daftar menampilkan ID 6 karakter.
   - `/delete` lalu kirim ID utas dan tekan **Hapus utas** untuk konfirmasi. Balasan ikut terhapus.
   - `/cancel` membatalkan langkah berjalan, `/help` menampilkan panduan.

Setelah memperbarui kode bot, jalankan `npx supabase db push`, deploy ulang kedua Edge Functions. Lalu pilih **Simpan & hubungkan bot** lagi untuk menyegarkan daftar perintah Telegram; kolom token boleh dikosongkan jika bot sudah terhubung.

Token disimpan pada tabel yang tidak dapat dibaca role `anon` atau `authenticated`. Fungsi admin hanya mengirim status bot ke antarmuka; token tidak dibaca kembali oleh browser.

---

## 2. Menjalankan di Komputer Lokal

1. Salin konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   ```
2. Isi nilai kredensial di `.env`:
   ```env
   VITE_SUPABASE_URL=https://proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=anon-key-anda
   ```
   *(Tanpa mengisi .env, aplikasi berjalan dalam mode pratinjau lokal dengan akun demo: `admin@lebarsenja.com` / `senja123`).*

3. Jalankan server pengembangan:
   ```bash
   npm install
   npm run dev
   ```

---

## 3. Rute Halaman

| Rute | Akses | Keterangan |
| --- | --- | --- |
| `/` | Publik (Read-Only) | Lini masa utas utama bergaya Threads dengan garis penghubung vertikal |
| `/admin/login` | Akses URL Langsung | Form login pengelola (tanpa tombol di halaman publik) |
| `/admin` | Terlindungi Admin | Meja kerja siar utas baru, sambungan balasan berantai, toggle pin, dan hapus |
| `/admin/pengaturan` | Terlindungi Admin | Personalisasi nama/username, serta koneksi bot Telegram |


