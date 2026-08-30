const db = require('./db');
const { nanoid } = require('nanoid');

function slugify(name) {
  const base = String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9Ѐ-ӿ]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'club';
  let slug = base;
  while (db.prepare('SELECT 1 FROM clubs WHERE slug = ?').get(slug)) {
    slug = `${base}-${nanoid(5).toLowerCase()}`;
  }
  return slug;
}

const parse = (s, fallback) => {
  try { return JSON.parse(s); } catch { return fallback; }
};

// Full public representation of a club.
function serializeClub(club) {
  if (!club) return null;
  const fields = db
    .prepare('SELECT field FROM club_fields WHERE club_id = ? ORDER BY field')
    .all(club.id)
    .map((r) => r.field);
  const gallery = db
    .prepare('SELECT id, url, caption, sort FROM gallery_images WHERE club_id = ? ORDER BY sort, id')
    .all(club.id);
  const admins = db
    .prepare(
      `SELECT u.id, u.email, u.name, ca.role
       FROM club_admins ca JOIN users u ON u.id = ca.user_id
       WHERE ca.club_id = ? ORDER BY ca.role DESC, u.email`
    )
    .all(club.id);
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    profileImage: club.profile_image,
    bio: club.bio,
    descriptionMd: club.description_md,
    city: club.city,
    affiliation: club.affiliation,
    foundingYear: club.founding_year,
    memberCount: club.member_count,
    contactEmail: club.contact_email,
    phone: club.phone,
    website: club.website,
    socials: parse(club.socials, []),
    openToSponsorship: !!club.open_to_sponsorship,
    sponsorshipNeeds: parse(club.sponsorship_needs, []),
    sponsorshipPitch: club.sponsorship_pitch,
    achievements: club.achievements,
    pastSponsors: club.past_sponsors,
    sponsorshipContact: club.sponsorship_contact,
    fields,
    gallery,
    admins,
    createdAt: club.created_at,
    updatedAt: club.updated_at,
  };
}

module.exports = { slugify, serializeClub };
