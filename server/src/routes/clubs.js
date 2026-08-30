const express = require('express');
const db = require('../db');
const { requireAuth, requireClubAdmin } = require('../auth');
const { upload, removeUpload } = require('../upload');
const { slugify, serializeClub } = require('../clubs-repo');
const { ALL_FIELDS } = require('../fields');

const router = express.Router();
const FIELD_SET = new Set(ALL_FIELDS);
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const clampYear = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 1800 && n <= new Date().getFullYear() ? n : null;
};
const clampCount = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? n : null;
};

function sanitizeSocials(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 12)
    .map((s) => ({ label: str(s.label, 40), url: str(s.url, 300) }))
    .filter((s) => s.label && /^https?:\/\//i.test(s.url));
}

// ---- Public: list & search -------------------------------------------------
router.get('/', (req, res) => {
  const q = str(req.query.q, 80);
  const field = str(req.query.field, 60);
  const city = str(req.query.city, 60);
  const sponsorOnly = req.query.sponsorOnly === '1' || req.query.sponsorOnly === 'true';

  const where = [];
  const params = {};
  if (q) { where.push('(c.name LIKE @q OR c.bio LIKE @q OR c.affiliation LIKE @q)'); params.q = `%${q}%`; }
  if (city) { where.push('c.city = @city'); params.city = city; }
  if (sponsorOnly) where.push('c.open_to_sponsorship = 1');
  if (field) {
    where.push('EXISTS (SELECT 1 FROM club_fields cf WHERE cf.club_id = c.id AND cf.field = @field)');
    params.field = field;
  }
  const sql = `SELECT c.* FROM clubs c ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.updated_at DESC LIMIT 200`;
  const clubs = db.prepare(sql).all(params).map(serializeClub).map((c) => ({
    id: c.id, slug: c.slug, name: c.name, profileImage: c.profileImage, bio: c.bio,
    city: c.city, affiliation: c.affiliation, memberCount: c.memberCount,
    openToSponsorship: c.openToSponsorship, sponsorshipNeeds: c.sponsorshipNeeds,
    fields: c.fields, galleryCount: c.gallery.length,
  }));
  res.json({ clubs });
});

// ---- Public: single club -------------------------------------------------
router.get('/:slug', (req, res) => {
  const club = db.prepare('SELECT * FROM clubs WHERE slug = ?').get(req.params.slug);
  if (!club) return res.status(404).json({ error: 'Club not found' });
  res.json({ club: serializeClub(club) });
});

// ---- Create -------------------------------------------------------------
router.post('/', requireAuth, (req, res) => {
  const name = str(req.body.name, 120);
  if (name.length < 2) return res.status(400).json({ error: 'Club name is required' });
  const slug = slugify(name);
  const bio = str(req.body.bio, 250);

  const tx = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO clubs (slug, name, bio, contact_email) VALUES (?, ?, ?, ?)')
      .run(slug, name, bio, req.user.email);
    db.prepare("INSERT INTO club_admins (club_id, user_id, role) VALUES (?, ?, 'owner')")
      .run(info.lastInsertRowid, req.user.id);
    return info.lastInsertRowid;
  });
  const id = tx();
  res.status(201).json({ club: serializeClub(db.prepare('SELECT * FROM clubs WHERE id = ?').get(id)) });
});

// ---- Update core details ---------------------------------------------------
router.put('/:id', requireAuth, requireClubAdmin, (req, res) => {
  const b = req.body;
  const fields = {
    name: str(b.name, 120) || req.club.name,
    bio: str(b.bio, 250),
    description_md: str(b.descriptionMd, 20000),
    city: str(b.city, 80),
    affiliation: str(b.affiliation, 160),
    founding_year: clampYear(b.foundingYear),
    member_count: clampCount(b.memberCount),
    contact_email: str(b.contactEmail, 160),
    phone: str(b.phone, 40),
    website: /^https?:\/\//i.test(str(b.website, 300)) ? str(b.website, 300) : '',
    socials: JSON.stringify(sanitizeSocials(b.socials)),
    open_to_sponsorship: b.openToSponsorship ? 1 : 0,
    sponsorship_needs: JSON.stringify(Array.isArray(b.sponsorshipNeeds) ? b.sponsorshipNeeds.map((s) => str(s, 60)).filter(Boolean).slice(0, 15) : []),
    sponsorship_pitch: str(b.sponsorshipPitch, 4000),
    achievements: str(b.achievements, 4000),
    past_sponsors: str(b.pastSponsors, 2000),
    sponsorship_contact: str(b.sponsorshipContact, 200),
  };
  db.prepare(
    `UPDATE clubs SET name=@name, bio=@bio, description_md=@description_md, city=@city,
       affiliation=@affiliation, founding_year=@founding_year, member_count=@member_count,
       contact_email=@contact_email, phone=@phone, website=@website, socials=@socials,
       open_to_sponsorship=@open_to_sponsorship, sponsorship_needs=@sponsorship_needs,
       sponsorship_pitch=@sponsorship_pitch, achievements=@achievements,
       past_sponsors=@past_sponsors, sponsorship_contact=@sponsorship_contact,
       updated_at=datetime('now')
     WHERE id=@id`
  ).run({ ...fields, id: req.club.id });

  if (Array.isArray(b.fields)) {
    const clean = [...new Set(b.fields.filter((f) => FIELD_SET.has(f)))].slice(0, 20);
    db.prepare('DELETE FROM club_fields WHERE club_id = ?').run(req.club.id);
    const ins = db.prepare('INSERT INTO club_fields (club_id, field) VALUES (?, ?)');
    for (const f of clean) ins.run(req.club.id, f);
  }
  res.json({ club: serializeClub(db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.club.id)) });
});

// ---- Profile image -------------------------------------------------------
router.post('/:id/profile-image', requireAuth, requireClubAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  if (req.club.profile_image) removeUpload(req.club.profile_image);
  const url = `/uploads/${req.file.filename}`;
  db.prepare("UPDATE clubs SET profile_image = ?, updated_at = datetime('now') WHERE id = ?").run(url, req.club.id);
  res.json({ profileImage: url });
});

// ---- Gallery ------------------------------------------------------------
router.post('/:id/gallery', requireAuth, requireClubAdmin, upload.array('images', 12), (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'No images uploaded' });
  const max = db.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM gallery_images WHERE club_id = ?').get(req.club.id).m;
  const ins = db.prepare('INSERT INTO gallery_images (club_id, url, caption, sort) VALUES (?, ?, ?, ?)');
  req.files.forEach((f, i) => ins.run(req.club.id, `/uploads/${f.filename}`, '', max + i + 1));
  db.prepare("UPDATE clubs SET updated_at = datetime('now') WHERE id = ?").run(req.club.id);
  res.status(201).json({ club: serializeClub(db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.club.id)) });
});

router.patch('/:id/gallery/:imageId', requireAuth, requireClubAdmin, (req, res) => {
  const img = db.prepare('SELECT * FROM gallery_images WHERE id = ? AND club_id = ?').get(req.params.imageId, req.club.id);
  if (!img) return res.status(404).json({ error: 'Image not found' });
  db.prepare('UPDATE gallery_images SET caption = ? WHERE id = ?').run(str(req.body.caption, 200), img.id);
  res.json({ ok: true });
});

router.delete('/:id/gallery/:imageId', requireAuth, requireClubAdmin, (req, res) => {
  const img = db.prepare('SELECT * FROM gallery_images WHERE id = ? AND club_id = ?').get(req.params.imageId, req.club.id);
  if (!img) return res.status(404).json({ error: 'Image not found' });
  db.prepare('DELETE FROM gallery_images WHERE id = ?').run(img.id);
  removeUpload(img.url);
  res.json({ ok: true });
});

// ---- Page admins -------------------------------------------------------
router.post('/:id/admins', requireAuth, requireClubAdmin, (req, res) => {
  const email = str(req.body.email, 160).toLowerCase();
  const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'No registered user with that email. Ask them to sign up first.' });
  db.prepare("INSERT OR IGNORE INTO club_admins (club_id, user_id, role) VALUES (?, ?, 'admin')").run(req.club.id, user.id);
  res.status(201).json({ club: serializeClub(db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.club.id)) });
});

router.delete('/:id/admins/:userId', requireAuth, requireClubAdmin, (req, res) => {
  const target = db.prepare('SELECT * FROM club_admins WHERE club_id = ? AND user_id = ?').get(req.club.id, req.params.userId);
  if (!target) return res.status(404).json({ error: 'Not an admin of this club' });
  if (target.role === 'owner') return res.status(400).json({ error: 'The owner cannot be removed' });
  const adminCount = db.prepare('SELECT COUNT(*) AS n FROM club_admins WHERE club_id = ?').get(req.club.id).n;
  if (adminCount <= 1) return res.status(400).json({ error: 'A club must have at least one admin' });
  db.prepare('DELETE FROM club_admins WHERE club_id = ? AND user_id = ?').run(req.club.id, req.params.userId);
  res.json({ club: serializeClub(db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.club.id)) });
});

// ---- Sponsorship inquiries -------------------------------------------------
router.post('/:slug/inquiries', (req, res) => {
  const club = db.prepare('SELECT * FROM clubs WHERE slug = ?').get(req.params.slug);
  if (!club) return res.status(404).json({ error: 'Club not found' });
  const company = str(req.body.company, 160);
  const email = str(req.body.email, 160);
  if (!company) return res.status(400).json({ error: 'Company name is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'A valid contact email is required' });
  db.prepare(
    `INSERT INTO inquiries (club_id, company, contact_name, email, phone, budget, message)
     VALUES (@club_id, @company, @contact_name, @email, @phone, @budget, @message)`
  ).run({
    club_id: club.id,
    company,
    contact_name: str(req.body.contactName, 120),
    email,
    phone: str(req.body.phone, 40),
    budget: str(req.body.budget, 80),
    message: str(req.body.message, 4000),
  });
  res.status(201).json({ ok: true });
});

router.get('/:id/inquiries', requireAuth, requireClubAdmin, (req, res) => {
  const inquiries = db.prepare('SELECT * FROM inquiries WHERE club_id = ? ORDER BY created_at DESC').all(req.club.id);
  res.json({ inquiries });
});

router.patch('/:id/inquiries/:inquiryId', requireAuth, requireClubAdmin, (req, res) => {
  const allowed = ['new', 'read', 'in_progress', 'closed'];
  const status = allowed.includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ error: 'Invalid status' });
  const info = db.prepare('UPDATE inquiries SET status = ? WHERE id = ? AND club_id = ?').run(status, req.params.inquiryId, req.club.id);
  if (!info.changes) return res.status(404).json({ error: 'Inquiry not found' });
  res.json({ ok: true });
});

module.exports = router;
