// Populates the database with a few demo clubs. Run: npm run seed
const bcrypt = require('bcryptjs');
const db = require('./db');
const { slugify } = require('./clubs-repo');

const pw = bcrypt.hashSync('password123', 10);

function user(email, name) {
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) return existing;
  const info = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, pw, name);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

const demos = [
  {
    name: 'TU Sofia Robotics Team',
    owner: ['robotics@tu-sofia.bg', 'Ivan Petrov'],
    bio: 'Student robotics team building autonomous robots and competing in Eurobot and RoboCup.',
    city: 'Sofia',
    affiliation: 'Technical University of Sofia',
    foundingYear: 2014,
    memberCount: 42,
    website: 'https://example.com',
    fields: ['Robotics', 'Engineering', 'Programming', 'Electronics', 'Artificial Intelligence'],
    openToSponsorship: 1,
    sponsorshipNeeds: ['Financial sponsorship', 'Equipment / hardware', 'Travel & competition costs'],
    sponsorshipPitch: 'We reach 5,000+ engineering students and represent Bulgaria at international competitions. Sponsor logos appear on our robots, jerseys, and livestreams.',
    achievements: '2nd place Eurobot Bulgaria 2023; Finalists RoboCup Junior 2022.',
    pastSponsors: 'Festo, SoftUni',
    descriptionMd: '## About us\n\nWe are a team of **40+ students** from mechanical, electrical and software engineering.\n\n- Weekly workshops open to all students\n- Two competition robots per year\n- Outreach in high schools across Bulgaria',
  },
  {
    name: 'Sofia Debate Society',
    owner: ['hello@sofiadebate.bg', 'Maria Dimitrova'],
    bio: 'Competitive debating in British Parliamentary format. We train speakers for national and European championships.',
    city: 'Sofia',
    affiliation: 'Sofia University St. Kliment Ohridski',
    foundingYear: 2009,
    memberCount: 65,
    fields: ['Debating', 'Public Speaking', 'Model UN', 'Politics'],
    openToSponsorship: 1,
    sponsorshipNeeds: ['Travel & competition costs', 'Event venue / space', 'Prizes & swag'],
    sponsorshipPitch: 'Our members are top humanities and law students - future lawyers, journalists and policy makers. Great fit for recruiting partnerships.',
    achievements: 'Ranked top 3 nationally for 5 consecutive years.',
    descriptionMd: 'We meet **twice a week** and host the annual Sofia Open, one of the largest debating tournaments in the Balkans.',
  },
  {
    name: 'Plovdiv Volleyball Club Akademik',
    owner: ['team@akademik-vb.bg', 'Georgi Kolev'],
    bio: 'Amateur and semi-pro volleyball club with mens, womens and youth teams playing in regional leagues.',
    city: 'Plovdiv',
    affiliation: 'University of Plovdiv',
    foundingYear: 1998,
    memberCount: 88,
    fields: ['Volleyball', 'Fitness', 'Athletics'],
    openToSponsorship: 1,
    sponsorshipNeeds: ['Financial sponsorship', 'Equipment / hardware', 'Media & marketing support'],
    sponsorshipPitch: 'Home games draw 200-400 spectators. Branding opportunities on jerseys, net posts, and social media match recaps.',
    achievements: 'Regional league champions 2021, 2023.',
    descriptionMd: 'Three squads, six training sessions per week, and a growing youth academy for players aged 10-16.',
  },
];

for (const d of demos) {
  if (db.prepare('SELECT 1 FROM clubs WHERE name = ?').get(d.name)) continue;
  const owner = user(d.owner[0], d.owner[1]);
  const slug = slugify(d.name);
  const info = db.prepare(
    `INSERT INTO clubs (slug, name, bio, description_md, city, affiliation, founding_year, member_count,
        contact_email, website, socials, open_to_sponsorship, sponsorship_needs, sponsorship_pitch,
        achievements, past_sponsors, sponsorship_contact)
     VALUES (@slug,@name,@bio,@description_md,@city,@affiliation,@founding_year,@member_count,
        @contact_email,@website,@socials,@open_to_sponsorship,@sponsorship_needs,@sponsorship_pitch,
        @achievements,@past_sponsors,@sponsorship_contact)`
  ).run({
    slug, name: d.name, bio: d.bio, description_md: d.descriptionMd || '', city: d.city,
    affiliation: d.affiliation, founding_year: d.foundingYear, member_count: d.memberCount,
    contact_email: d.owner[0], website: d.website || '', socials: JSON.stringify(d.socials || []),
    open_to_sponsorship: d.openToSponsorship, sponsorship_needs: JSON.stringify(d.sponsorshipNeeds || []),
    sponsorship_pitch: d.sponsorshipPitch || '', achievements: d.achievements || '',
    past_sponsors: d.pastSponsors || '', sponsorship_contact: d.owner[0],
  });
  db.prepare("INSERT INTO club_admins (club_id, user_id, role) VALUES (?, ?, 'owner')").run(info.lastInsertRowid, owner.id);
  const ins = db.prepare('INSERT INTO club_fields (club_id, field) VALUES (?, ?)');
  for (const f of d.fields) ins.run(info.lastInsertRowid, f);
  console.log(`seeded: ${d.name} (/${slug})`);
}

console.log('\nDemo login: any of the club emails above, password "password123"');
