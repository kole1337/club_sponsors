const express = require('express');
const db = require('../db');
const { FIELD_GROUPS, ALL_FIELDS } = require('../fields');

const router = express.Router();

const SPONSORSHIP_NEEDS = [
  'Financial sponsorship',
  'Equipment / hardware',
  'Software licenses',
  'Travel & competition costs',
  'Event venue / space',
  'Mentorship & expertise',
  'Internships & recruiting access',
  'Prizes & swag',
  'Media & marketing support',
];

router.get('/', (_req, res) => {
  const usedFields = db
    .prepare('SELECT field, COUNT(*) AS count FROM club_fields GROUP BY field ORDER BY count DESC')
    .all();
  const cities = db
    .prepare("SELECT DISTINCT city FROM clubs WHERE city <> '' ORDER BY city")
    .all()
    .map((r) => r.city);
  res.json({ fieldGroups: FIELD_GROUPS, allFields: ALL_FIELDS, sponsorshipNeeds: SPONSORSHIP_NEEDS, usedFields, cities });
});

module.exports = router;
