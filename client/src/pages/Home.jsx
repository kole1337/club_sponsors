import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Avatar, FieldChips } from '../components';

export default function Home() {
  const [clubs, setClubs] = useState([]);
  useEffect(() => { api.get('/clubs').then((d) => setClubs(d.clubs.slice(0, 6))).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Where Bulgarian clubs meet sponsors</h1>
          <p className="hero__sub">
            Student teams, university societies and sports clubs build a profile once — companies
            browse by field, city and what each club needs, then reach out directly.
          </p>
          <div className="hero__cta">
            <Link to="/register" className="btn btn--primary">Create your club profile</Link>
            <Link to="/clubs" className="btn btn--ghost">Browse clubs</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Recently updated clubs</h2>
          <Link to="/clubs">See all →</Link>
        </div>
        <div className="grid">
          {clubs.map((c) => (
            <Link key={c.id} to={`/clubs/${c.slug}`} className="card club-card">
              <div className="club-card__top">
                <Avatar src={c.profileImage} name={c.name} size={56} />
                <div>
                  <h3>{c.name}</h3>
                  <p className="muted">{[c.affiliation, c.city].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <p className="club-card__bio">{c.bio}</p>
              <FieldChips fields={c.fields.slice(0, 4)} />
              {c.openToSponsorship && <span className="badge badge--open">Open to sponsorship</span>}
            </Link>
          ))}
        </div>
      </section>

      <section className="container section steps">
        <div>
          <h2>For clubs</h2>
          <ol>
            <li>Register with your email and create a club profile.</li>
            <li>Add your bio, a formatted description, photo gallery and the fields you work in.</li>
            <li>List what you're looking for — funding, gear, mentorship, recruiting access.</li>
            <li>Invite co-admins and manage sponsorship inquiries from one dashboard.</li>
          </ol>
        </div>
        <div>
          <h2>For companies</h2>
          <ol>
            <li>Filter clubs by field, city and sponsorship openness.</li>
            <li>See member counts, achievements, past sponsors and a media-ready description.</li>
            <li>Send a sponsorship inquiry straight from the club's page.</li>
          </ol>
          <Link to="/for-companies" className="btn btn--ghost">Learn more</Link>
        </div>
      </section>
    </>
  );
}
