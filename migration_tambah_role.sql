-- Migrasi: menambahkan kolom "role" ke tabel guru
-- Jalankan ini SEKALI di Neon (Dashboard project > SQL Editor / Query),
-- lalu deploy ulang kode backend & frontend yang baru.

-- 1) Tambah kolom role, default 'guru' untuk semua akun yang sudah ada.
alter table guru add column if not exists role text not null default 'guru';

-- 2) (Opsional tapi disarankan) batasi nilainya hanya 'guru' atau 'admin'.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guru_role_check'
  ) then
    alter table guru add constraint guru_role_check check (role in ('guru', 'admin'));
  end if;
end $$;

-- 3) Jadikan satu akun sebagai admin pertama.
--    Ganti 'ID_GURU_ANDA' dengan id akun guru yang mau dijadikan admin.
--    Cara cek id: select id, nama, mapel from guru order by nama;
-- update guru set role = 'admin' where id = 'ID_GURU_ANDA';
