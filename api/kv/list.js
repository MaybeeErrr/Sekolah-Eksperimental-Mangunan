const { getSql } = require('../../lib/db');
const { getGuruFromReq } = require('../../lib/auth');

// Prefix ini dianggap sensitif (bisa membocorkan struktur data lintas mapel
// yang seharusnya cuma untuk wali kelas/admin), jadi butuh peran khusus.
const WALI_ONLY_PREFIXES = ['bn-catatan__', 'bn-templates', 'bn-wali-kelas', 'bn-rapor-settings'];

function isWaliOnlyPrefix(prefix) {
  return WALI_ONLY_PREFIXES.some(function (p) {
    return prefix.indexOf(p) === 0 || p.indexOf(prefix) === 0;
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }
  try {
    const guru = await getGuruFromReq(req);
    if (!guru) return res.status(401).json({ error: 'Anda belum masuk.' });

    const prefix = req.query.prefix || '';
    if (isWaliOnlyPrefix(prefix) && guru.role !== 'admin' && guru.role !== 'wali_kelas') {
      return res.status(403).json({ error: 'Hanya wali kelas atau admin yang boleh membuka data ini.' });
    }

    const sql = getSql();
    const rows = await sql`select key from kv_store where key like ${prefix + '%'} order by key`;
    return res.status(200).json({ keys: rows.map((r) => r.key) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Terjadi kesalahan server.' });
  }
};
