-- Migrasi: menambahkan role "wali_kelas" (Wali Kelas)
-- Jalankan ini SEKALI di Neon (Dashboard project > SQL Editor / Query).
-- Boleh dijalankan meskipun migration_tambah_role.sql sudah pernah
-- dijalankan sebelumnya (skrip ini akan menyesuaikan constraint yang lama).

-- 1) Lepas batasan lama yang hanya mengizinkan 'guru' / 'admin'.
alter table guru drop constraint if exists guru_role_check;

-- 2) Pasang batasan baru yang menambahkan 'wali_kelas'.
alter table guru add constraint guru_role_check check (role in ('guru', 'wali_kelas', 'admin'));

-- 3) (Opsional) Jadikan salah satu akun guru yang sudah ada sebagai wali kelas.
--    Cara cek id: select id, nama, mapel, role from guru order by nama;
-- update guru set role = 'wali_kelas' where id = 'ID_GURU_ANDA';

-- Catatan:
--   * role 'guru'       = guru mata pelajaran biasa: hanya bisa melihat & mengisi
--                          nilai untuk mata pelajaran yang ia ampu sendiri.
--   * role 'wali_kelas'  = boleh mengisi nilai mata pelajaran sendiri SEKALIGUS
--                          boleh membuka menu Rekap & Rapor, Peringkat, dan
--                          Template Dokumen (menggabungkan nilai semua mapel).
--   * role 'admin'       = seperti wali_kelas, ditambah bisa mengelola akun
--                          (menu Kelola Akun).
