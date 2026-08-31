const { getSql } = require('../../lib/db');
const { getGuruIdFromReq } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }
  try {
    const guruId = getGuruIdFromReq(req);
    if (!guruId) return res.status(200).json({ guru: null });

    const sql = getSql();
    const rows = await sql`
      select id, nama, mapel, mapel_slug as "mapelSlug", role
      from guru
      where id = ${guruId}
    `;
    return res.status(200).json({ guru: rows[0] || null });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
