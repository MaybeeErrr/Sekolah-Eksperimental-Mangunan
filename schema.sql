-- Jalankan skrip ini sekali di SQL Editor Neon (console.neon.tech)
-- sebelum aplikasi pertama kali dipakai.

create table if not exists guru (
  id            text primary key,        -- slug(nama)__slug(mapel)
  nama          text not null,
  mapel         text not null,
  mapel_slug    text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists kv_store (
  key         text primary key,          -- contoh: 'bn-siswa-master', 'bn-nilai__6a__matematika'
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create index if not exists kv_store_key_prefix_idx on kv_store (key text_pattern_ops);
