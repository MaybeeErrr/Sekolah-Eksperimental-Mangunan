const { getSql } = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }
  try {
    const sql = getSql();
    const prefix = req.query.prefix || '';
    const rows = await sql`select key from kv_store where key like ${prefix + '%'} order by key`;
    return res.status(200).json({ keys: rows.map((r) => r.key) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
