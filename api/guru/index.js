const { getSql } = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }
  try {
    const sql = getSql();
    const rows = await sql`
      select id, nama, mapel, mapel_slug as "mapelSlug"
      from guru
      order by nama asc
    `;
    return res.status(200).json({ guruList: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
