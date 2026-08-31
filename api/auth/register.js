const { getSql } = require('../../lib/db');
const { bcrypt, setSessionCookie } = require('../../lib/auth');

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }
  try {
    const body = req.body || {};
    const nama = (body.nama || '').trim();
    const mapel = (body.mapel || '').trim();
    const password = body.password || '';

    if (!nama || !mapel) {
      return res.status(400).json({ error: 'Nama dan mata pelajaran wajib diisi.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Kata sandi minimal 4 karakter.' });
    }

    const sql = getSql();
    const id = slugify(nama) + '__' + slugify(mapel);

    const existing = await sql`select id from guru where id = ${id}`;
    if (existing.length) {
      return res.status(409).json({ error: 'Guru dengan nama & mata pelajaran ini sudah terdaftar.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const mapelSlug = slugify(mapel);

    await sql`
      insert into guru (id, nama, mapel, mapel_slug, password_hash)
      values (${id}, ${nama}, ${mapel}, ${mapelSlug}, ${passwordHash})
    `;

    setSessionCookie(res, id);
    return res.status(200).json({ guru: { id, nama, mapel, mapelSlug } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
