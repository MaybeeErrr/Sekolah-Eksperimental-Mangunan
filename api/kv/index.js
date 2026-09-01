const { getSql } = require('../../lib/db');
const { getGuruFromReq } = require('../../lib/auth');

// Kunci-kunci berikut hanya boleh DIBACA & DITULIS oleh wali kelas / admin,
// karena berisi data lintas mata pelajaran (rekap, rapor, template, dsb).
// Guru mata pelajaran biasa tidak boleh melihat maupun mengubahnya.
const WALI_ONLY_EXACT_KEYS = [
  'bn-templates',
  'bn-template-aktif-id',
  'bn-template-settings', // format lama (migrasi otomatis dari versi sebelumnya)
  'bn-wali-kelas',
  'bn-rapor-settings',
];

function isWaliOnlyKey(key) {
  if (WALI_ONLY_EXACT_KEYS.indexOf(key) > -1) return true;
  if (key.indexOf('bn-catatan__') === 0) return true; // catatan wali kelas per kelas
  return false;
}

// Kunci nilai per kelas+mapel: bn-nilai__<kelas>__<mapelSlug>
// Hanya guru pengampu mapel tsb (atau admin) yang boleh MENULIS ke key ini.
// Membaca tetap boleh siapa saja yang sudah login (dipakai wali kelas untuk
// menyusun rekap gabungan semua mapel).
function nilaiKeyMapelSlug(key) {
  if (key.indexOf('bn-nilai__') !== 0) return null;
  const parts = key.split('__');
  if (parts.length < 3) return null;
  return parts.slice(2).join('__');
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'Parameter key wajib diisi.' });

      if (isWaliOnlyKey(key)) {
        const guru = await getGuruFromReq(req);
        if (!guru) return res.status(401).json({ error: 'Anda belum masuk.' });
        if (guru.role !== 'admin' && guru.role !== 'wali_kelas') {
          return res.status(403).json({ error: 'Hanya wali kelas atau admin yang boleh membuka data ini.' });
        }
      }

      const rows = await sql`select value from kv_store where key = ${key}`;
      return res.status(200).json({ value: rows[0] ? rows[0].value : null });
    }

    if (req.method === 'POST') {
      // Menyimpan data bersama hanya boleh dilakukan oleh guru yang sudah login.
      const guru = await getGuruFromReq(req);
      if (!guru) return res.status(401).json({ error: 'Anda belum masuk.' });

      const body = req.body || {};
      const key = body.key;
      if (!key) return res.status(400).json({ error: 'Parameter key wajib diisi.' });
      const value = body.value === undefined ? null : body.value;

      if (isWaliOnlyKey(key)) {
        if (guru.role !== 'admin' && guru.role !== 'wali_kelas') {
          return res.status(403).json({ error: 'Hanya wali kelas atau admin yang boleh mengubah data ini.' });
        }
      }

      const mapelSlug = nilaiKeyMapelSlug(key);
      if (mapelSlug && guru.role !== 'admin' && guru.mapelSlug !== mapelSlug) {
        return res.status(403).json({ error: 'Anda hanya boleh mengisi nilai untuk mata pelajaran yang Anda ampu sendiri.' });
      }

      await sql`
        insert into kv_store (key, value, updated_at)
        values (${key}, ${JSON.stringify(value)}::jsonb, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
