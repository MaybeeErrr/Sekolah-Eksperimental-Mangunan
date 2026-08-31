const { getSql } = require('../../lib/db');
const { bcrypt, requireAdmin, getGuruIdFromReq } = require('../../lib/auth');

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = await sql`
        select id, nama, mapel, mapel_slug as "mapelSlug", role
        from guru
        order by nama asc
      `;
      return res.status(200).json({ guruList: rows });
    }

    if (req.method === 'POST') {
      // Hanya admin yang boleh membuat akun baru lewat menu Kelola Akun
      // (pendaftaran mandiri tetap lewat /api/auth/register dan selalu jadi guru biasa).
      const denied = await requireAdmin(req);
      if (denied) return res.status(denied.status).json({ error: denied.error });

      const body = req.body || {};
      const nama = (body.nama || '').trim();
      const mapel = (body.mapel || '').trim();
      const password = body.password || '';
      const role = body.role === 'admin' ? 'admin' : 'guru';

      if (!nama || !mapel) {
        return res.status(400).json({ error: 'Nama dan mata pelajaran wajib diisi.' });
      }
      if (password.length < 4) {
        return res.status(400).json({ error: 'Kata sandi minimal 4 karakter.' });
      }

      const id = slugify(nama) + '__' + slugify(mapel);
      const existing = await sql`select id from guru where id = ${id}`;
      if (existing.length) {
        return res.status(409).json({ error: 'Guru dengan nama & mata pelajaran ini sudah terdaftar.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const mapelSlug = slugify(mapel);

      await sql`
        insert into guru (id, nama, mapel, mapel_slug, password_hash, role)
        values (${id}, ${nama}, ${mapel}, ${mapelSlug}, ${passwordHash}, ${role})
      `;

      return res.status(200).json({ guru: { id, nama, mapel, mapelSlug, role } });
    }

    if (req.method === 'DELETE') {
      // Hanya admin yang boleh menghapus akun.
      const denied = await requireAdmin(req);
      if (denied) return res.status(denied.status).json({ error: denied.error });

      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Parameter id wajib diisi.' });

      const selfId = getGuruIdFromReq(req);
      if (id === selfId) {
        return res.status(400).json({ error: 'Tidak bisa menghapus akun yang sedang Anda pakai sendiri. Minta admin lain untuk menghapusnya.' });
      }

      const target = await sql`select id, role from guru where id = ${id}`;
      if (!target.length) {
        return res.status(404).json({ error: 'Akun guru tidak ditemukan.' });
      }

      if (target[0].role === 'admin') {
        const adminCount = await sql`select count(*)::int as n from guru where role = 'admin'`;
        if (adminCount[0].n <= 1) {
          return res.status(400).json({ error: 'Tidak bisa menghapus admin terakhir yang tersisa.' });
        }
      }

      await sql`delete from guru where id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
