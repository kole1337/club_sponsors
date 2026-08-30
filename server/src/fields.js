// Canonical list of fields/interests a club can engage in.
// Grouped for the UI; the API exposes a flat list too.
const FIELD_GROUPS = {
  'Academic & Technical': [
    'Technical', 'Engineering', 'Programming', 'Robotics', 'Electronics',
    'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Mathematics',
    'Physics', 'Chemistry', 'Biology', 'Science', 'Research', 'Space & Aerospace',
    'Renewable Energy', 'Architecture', '3D Printing',
  ],
  'Business & Society': [
    'Entrepreneurship', 'Business', 'Finance', 'Marketing', 'Economics',
    'Law', 'Debating', 'Model UN', 'Public Speaking', 'Journalism',
    'Volunteering', 'Sustainability', 'Politics', 'Human Rights',
  ],
  'Arts & Culture': [
    'Music', 'Theatre', 'Dance', 'Film', 'Photography', 'Design',
    'Visual Arts', 'Literature', 'Creative Writing', 'Gaming', 'Esports',
  ],
  'Sports': [
    'Football', 'Basketball', 'Volleyball', 'Handball', 'Tennis',
    'Table Tennis', 'Athletics', 'Swimming', 'Cycling', 'Climbing',
    'Martial Arts', 'Chess', 'Rowing', 'Skiing & Snowboarding',
    'Hiking & Mountaineering', 'Fitness', 'Rugby', 'Badminton',
  ],
};

const ALL_FIELDS = Object.values(FIELD_GROUPS).flat();

module.exports = { FIELD_GROUPS, ALL_FIELDS };
