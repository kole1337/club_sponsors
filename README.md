# ClubSpot

A directory where Bulgarian clubs (student teams, university societies, sports clubs) build a
profile and get discovered by companies for **sponsorship**.

## Features

**Club profiles**
- Club name, profile picture, short bio (max 250 chars)
- Contacts card under the name: email, phone, website, and any number of social links
- Long **formatted description** (Markdown, live preview in the editor)
- Photo **gallery** with per-image captions and a lightbox
- **Fields & activities** labels (technical, engineering, programming, debating, many sports, …)

**Accounts & permissions**
- Register with email + password; any user can log in
- A user can create multiple clubs and be invited as a co-admin on others
- Each club has **page admins** who can edit every part of the page (owner + added admins)

**Built for sponsorship discovery**
- "Open to sponsorship" badge + toggle
- Structured "what we're looking for" tags (funding, equipment, travel, mentorship, recruiting access, …)
- Sponsorship pitch, achievements, past/current sponsors, dedicated sponsorship contact
- Member count, founding year, city and affiliation for quick fit assessment
- Public **directory with filters** by field, city and sponsorship openness + text search
- **Inquiry form** on every club page — submissions land in the club's dashboard with status
  tracking (new / read / in progress / closed)
- `/for-companies` explainer page

## Stack

- **Client** — React + Vite + React Router (`client/`)
- **Server** — Express + Node's built-in `node:sqlite` (no native build step) (`server/`)
- **Auth** — JWT (localStorage), bcrypt password hashing
- **Uploads** — local `server/uploads/` folder via multer

## Running locally

```bash
npm run install:all      # installs root, server and client deps
npm --prefix server run seed   # optional: 3 demo clubs
npm run dev               # server on :4000, client on :5173 (proxied)
```

Open http://localhost:5173

Demo logins after seeding (password `password123`):
`robotics@tu-sofia.bg`, `hello@sofiadebate.bg`, `team@akademik-vb.bg`

### Production build

```bash
npm run build            # builds client into client/dist
npm start                # server serves the API + the built client on :4000
```

## Environment (`server/.env`, optional)

| var          | default                        |
|--------------|--------------------------------|
| `PORT`       | `4000`                         |
| `JWT_SECRET` | dev fallback — **set in prod** |
| `DB_PATH`    | `server/data.db`               |

## Notes / possible next steps

- Email verification and password reset (currently password-only, no SMTP)
- Move uploads to S3/Cloudinary and add image resizing
- Sponsor accounts with saved/shortlisted clubs and outbound messaging
- Public "sponsorship opportunities" feed aggregating all clubs' current needs
- Analytics for clubs (profile views, inquiry conversion)
