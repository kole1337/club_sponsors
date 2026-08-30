const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

// Populates req.user when a valid token is present; never rejects.
function loadUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(payload.id) || null;
    } catch {
      req.user = null;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

// Requires the current user to be an admin of the club identified by :id or :slug.
function requireClubAdmin(req, res, next) {
  const key = req.params.id || req.params.slug;
  const club = /^\d+$/.test(String(key))
    ? db.prepare('SELECT * FROM clubs WHERE id = ?').get(key)
    : db.prepare('SELECT * FROM clubs WHERE slug = ?').get(key);
  if (!club) return res.status(404).json({ error: 'Club not found' });
  const membership = db
    .prepare('SELECT * FROM club_admins WHERE club_id = ? AND user_id = ?')
    .get(club.id, req.user.id);
  if (!membership) return res.status(403).json({ error: 'You are not an admin of this club' });
  req.club = club;
  req.membership = membership;
  next();
}

module.exports = { JWT_SECRET, signToken, loadUser, requireAuth, requireClubAdmin };
