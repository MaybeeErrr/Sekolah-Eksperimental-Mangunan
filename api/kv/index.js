const { getSql } = require('../../lib/db');
const { getGuruIdFromReq } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'Parameter key wajib diisi.' });
      const rows = await sql`select value from kv_store where key = ${key}`;
      return res.status(200).json({ value: rows[0] ? rows[0].value : null });
    }

    if (req.method === 'POST') {
      // Menyimpan data bersama hanya boleh dilakukan oleh guru yang sudah login.
      const guruId = getGuruIdFromReq(req);
      if (!guruId) return res.status(401).json({ error: 'Anda belum masuk.' });

      const body = req.body || {};
      const key = body.key;
      if (!key) return res.status(400).json({ error: 'Parameter key wajib diisi.' });
      const value = body.value === undefined ? null : body.value;

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
