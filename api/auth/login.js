const { getSql } = require('../../lib/db');
const { bcrypt, setSessionCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }
  try {
    const body = req.body || {};
    const guruId = body.guruId;
    const password = body.password || '';

    if (!guruId) {
      return res.status(400).json({ error: 'Pilih akun guru terlebih dahulu.' });
    }

    const sql = getSql();
    const rows = await sql`
      select id, nama, mapel, mapel_slug as "mapelSlug", role, password_hash
      from guru
      where id = ${guruId}
    `;
    const guru = rows[0];
    if (!guru) {
      return res.status(401).json({ error: 'Akun guru tidak ditemukan.' });
    }

    const match = await bcrypt.compare(password, guru.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Kata sandi salah.' });
    }

    setSessionCookie(res, guru.id);
    delete guru.password_hash;
    return res.status(200).json({ guru: guru });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
