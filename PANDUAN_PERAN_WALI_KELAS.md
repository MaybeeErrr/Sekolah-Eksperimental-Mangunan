# Panduan: Peran "Wali Kelas" di Buku Nilai SD

Dokumen ini menjelaskan apa yang berubah, cara menerapkannya ke Neon +
Vercel, dan langkah-langkah kalau nanti Anda ingin mengubah atau
menambahkan sesuatu lagi.

## 1. Apa yang berubah

Sekarang ada **3 peran akun**:

| Peran | Bisa lihat/isi nilai | Dashboard | Peringkat, Rekap & Rapor, Template |
|---|---|---|---|
| **Guru mata pelajaran** (`guru`) | Hanya mapel miliknya sendiri | Hanya menghitung mapel miliknya sendiri | ❌ Tidak muncul di menu, dan ditolak server kalau dicoba lewat cara lain |
| **Wali kelas** (`wali_kelas`) | Mapel miliknya sendiri (dia tetap guru mapel juga) | Gabungan semua mapel (untuk melihat performa kelas) | ✅ Bisa lihat & edit |
| **Admin** (`admin`) | Semua | Gabungan semua mapel | ✅ Bisa lihat & edit, + Kelola Akun |

Poin penting yang menjawab permintaan Anda:

- **Nilai yang diisi guru mapel tetap otomatis muncul di akun wali kelas** —
  ini sudah bekerja dari desain awal aplikasi (nilai disimpan di database
  bersama per kelas+mapel), tidak perlu sinkronisasi tambahan.
- Pembatasan **bukan cuma menyembunyikan tombol di layar**. Server
  (`api/kv/index.js` dan `api/kv/list.js`) sekarang benar-benar menolak
  permintaan dari guru mapel biasa yang mencoba membuka/mengubah data
  Rekap & Rapor, Peringkat, atau Template — jadi tidak bisa "diakali" lewat
  konsol browser sekalipun.
- Guru mapel biasa juga **tidak bisa lagi menimpa nilai mapel guru lain**
  lewat API, karena server memeriksa `mapelSlug` akun yang login dibanding
  mapel pada data yang mau ditulis.

## 2. Berkas yang berubah

- `migration_tambah_wali_kelas.sql` — migrasi database baru (**wajib dijalankan**).
- `lib/auth.js` — helper otorisasi baru `requireWaliKelasOrAdmin`.
- `api/guru/index.js` — pembuatan akun sekarang menerima peran `wali_kelas`.
- `api/kv/index.js`, `api/kv/list.js` — penambahan aturan otorisasi di server.
- `index.html` — menu navigasi, dashboard, dan halaman Kelola Akun disesuaikan.

## 3. Langkah menerapkan ke server yang sudah jalan

1. **Jalankan migrasi database.**
   Buka Neon Dashboard → project Anda → **SQL Editor**, lalu jalankan isi
   file `migration_tambah_wali_kelas.sql` satu kali. Ini aman dijalankan
   walau `migration_tambah_role.sql` yang lama sudah pernah dijalankan
   sebelumnya.

2. **Deploy ulang kode.**
   Timpa isi folder project Anda (di GitHub / Vercel) dengan berkas-berkas
   dari paket ini, lalu deploy ulang seperti biasa (`git push`, atau upload
   ulang di Vercel).

3. **Jadikan salah satu akun sebagai Wali Kelas.**
   Ada 2 cara:
   - **Lewat aplikasi** (lebih mudah): login sebagai **admin** → menu
     **Kelola Akun** → buat akun baru dengan peran **Wali kelas**, atau
     hapus & buat ulang akun yang sudah ada dengan peran itu (peran akun
     yang sudah ada tidak bisa diubah langsung dari menu ini, hanya bisa
     dibuat baru/dihapus — lihat bagian 4 kalau mau menambah tombol "ubah
     peran").
   - **Lewat SQL langsung** (kalau mau mengubah akun yang sudah ada tanpa
     menghapusnya): di Neon SQL Editor jalankan:
     ```sql
     select id, nama, mapel, role from guru order by nama;
     update guru set role = 'wali_kelas' where id = 'ID_GURU_ANDA';
     ```

4. **Uji coba:**
   - Login sebagai guru mapel biasa → menu Peringkat/Rekap & Rapor/Template
     seharusnya tidak muncul di sidebar, dan Dashboard hanya menghitung
     mapelnya sendiri.
   - Login sebagai wali kelas → keempat menu itu muncul, dan Rekap & Rapor
     menampilkan gabungan nilai semua mapel untuk kelas yang dipilih.
   - Coba isi nilai sebagai guru mapel A, lalu login sebagai wali kelas dan
     buka Rekap & Rapor kelas yang sama → nilai mapel A harus langsung
     terlihat di sana.

## 4. Kalau nanti Anda ingin mengubah atau menambahkan sesuatu

### A. Menambah akun guru / wali kelas / admin baru
1. Login sebagai **admin**.
2. Buka menu **Kelola Akun**.
3. Isi nama, mata pelajaran, kata sandi, dan pilih **Peran**:
   - *Guru mata pelajaran* → akses standar, hanya mapelnya sendiri.
   - *Wali kelas* → tambahan akses ke Peringkat/Rekap & Rapor/Template.
   - *Admin* → semua akses + Kelola Akun.
4. Klik **Buat akun**.

### B. Mengubah peran akun yang sudah ada (mis. guru → wali kelas)
Menu Kelola Akun saat ini hanya bisa **membuat** dan **menghapus** akun,
belum ada tombol "ubah peran". Cara tercepat sekarang: jalankan SQL di
Neon (lihat langkah 3 di atas). Kalau Anda ingin tombol "ubah peran" di
dalam aplikasi, itu perubahan kecil: tambahkan method `PATCH` di
`api/guru/index.js` (mirip pola `DELETE` yang sudah ada, tinggal
`update guru set role = ... where id = ...`) lalu tambahkan tombol di
tabel "Daftar akun" pada `index.html`. Beri tahu saya kalau Anda mau saya
tambahkan sekarang.

### C. Menambah menu/halaman baru yang juga mau dibatasi "khusus wali kelas"
1. Di `index.html`, tambahkan tombol navigasi baru dengan sebuah `id`,
   defaultnya `class="hidden"`.
2. Di fungsi `enterDashboard()`, tambahkan baris:
   ```js
   qs('#id-tombol-baru').classList.toggle('hidden', !waliAtauAdmin);
   ```
3. Di objek `HALAMAN_KHUSUS_WALI` (dekat fungsi `switchPage`), tambahkan
   nama halaman barunya, misalnya:
   ```js
   var HALAMAN_KHUSUS_WALI = {rapot:1, peringkat:1, template:1, halamanBaru:1};
   ```
4. Kalau halaman itu menyimpan/membaca data lewat `sGet`/`sSet`/`sList`
   dengan kunci baru, tambahkan nama kunci itu ke `WALI_ONLY_EXACT_KEYS`
   (atau prefix-nya ke pengecekan `isWaliOnlyKey`) di `api/kv/index.js` dan
   `api/kv/list.js` — supaya perlindungannya juga berlaku di server, bukan
   cuma disembunyikan di layar.

### D. Menambah mata pelajaran baru
Tidak perlu ubah kode. Saat admin membuat akun guru baru, pilih
**Lainnya…** pada daftar mata pelajaran dan ketik nama mapelnya. Sistem
akan otomatis membuatkan "mapelSlug" sendiri.

### E. Kalau ingin wali kelas dibatasi hanya untuk SATU kelas tertentu
Saat ini peran `wali_kelas` memberi akses ke Rekap & Rapor/Peringkat/
Template untuk **semua kelas** (sama seperti admin, hanya beda tidak bisa
Kelola Akun) — supaya satu wali kelas yang merangkap tugas tetap bisa
membantu kelas lain kalau perlu. Kalau Anda ingin setiap wali kelas
dikunci hanya boleh membuka kelasnya sendiri, ini perubahan yang lebih
besar (perlu menambah kolom "kelas_diampu" di tabel `guru`, lalu
memfilter dropdown kelas + endpoint `/api/kv` berdasarkan kolom itu).
Beri tahu saya kalau Anda mau fitur ini ditambahkan.

## 5. Catatan teknis singkat (untuk referensi)

- Nilai disimpan dengan kunci `bn-nilai__<kelas>__<mapelSlug>` di tabel
  `kv_store` (Neon Postgres) — dibaca bersama oleh semua guru yang berhak,
  ditulis hanya oleh guru pengampu mapel itu (atau admin).
- Data yang kini dilindungi khusus wali kelas/admin: `bn-templates`,
  `bn-template-aktif-id`, `bn-wali-kelas` (nama wali kelas per kelas),
  `bn-rapor-settings` (kop/identitas rapor), dan `bn-catatan__<kelas>`
  (catatan wali kelas per siswa).
- Bobot nilai (Harian/UTS/UAS) tetap bisa diatur semua guru lewat kunci
  `bn-bobot-nilai` (dipisah dari kop rapor, yang dulunya digabung jadi satu
  di kunci lama `bn-settings`). Data lama di `bn-settings` tetap dibaca
  sebagai cadangan migrasi otomatis, tidak akan hilang.
