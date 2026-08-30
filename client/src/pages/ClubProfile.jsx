import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Avatar, FieldChips, Markdown, Banner } from '../components';

function ContactRow({ club }) {
  const items = [];
  if (club.contactEmail) items.push(['Email', <a href={`mailto:${club.contactEmail}`}>{club.contactEmail}</a>]);
  if (club.phone) items.push(['Phone', <a href={`tel:${club.phone}`}>{club.phone}</a>]);
  if (club.website) items.push(['Website', <a href={club.website} target="_blank" rel="noreferrer">{club.website.replace(/^https?:\/\//, '')}</a>]);
  club.socials.forEach((s) => items.push([s.label, <a href={s.url} target="_blank" rel="noreferrer">{s.url.replace(/^https?:\/\//, '')}</a>]));
  if (!items.length) return null;
  return (
    <ul className="contacts">
      {items.map(([label, node], i) => (
        <li key={i}><span className="contacts__k">{label}</span>{node}</li>
      ))}
    </ul>
  );
}

function InquiryForm({ slug }) {
  const [form, setForm] = useState({ company: '', contactName: '', email: '', phone: '', budget: '', message: '' });
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState('sending'); setError('');
    try {
      await api.post(`/clubs/${slug}/inquiries`, form);
      setState('done');
    } catch (err) {
      setError(err.message); setState('idle');
    }
  };

  if (state === 'done') return <Banner kind="success">Thanks — your inquiry was sent to the club's admins. They'll be in touch.</Banner>;

  return (
    <form className="inquiry" onSubmit={submit}>
      <h3>Reach out about sponsorship</h3>
      <Banner kind="error">{error}</Banner>
      <div className="row2">
        <input required placeholder="Company / organisation *" value={form.company} onChange={set('company')} />
        <input placeholder="Your name" value={form.contactName} onChange={set('contactName')} />
      </div>
      <div className="row2">
        <input required type="email" placeholder="Contact email *" value={form.email} onChange={set('email')} />
        <input placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} />
      </div>
      <input placeholder="Indicative budget / what you can offer" value={form.budget} onChange={set('budget')} />
      <textarea rows={4} placeholder="Message" value={form.message} onChange={set('message')} />
      <button className="btn btn--primary" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  );
}

export default function ClubProfile() {
  const { slug } = useParams();
  const { myClubs } = useAuth();
  const [club, setClub] = useState(null);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setClub(null);
    api.get(`/clubs/${slug}`).then((d) => setClub(d.club)).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="container section"><h1>Not found</h1><p>{error}</p></div>;
  if (!club) return <div className="container section"><p>Loading…</p></div>;

  const canEdit = myClubs.some((c) => c.slug === club.slug);

  return (
    <div className="container section club">
      {canEdit && (
        <Banner kind="info">
          You're an admin of this club. <Link to={`/dashboard/clubs/${club.slug}`}>Edit this page →</Link>
        </Banner>
      )}

      <div className="club__layout">
        <aside className="club__card card">
          <Avatar src={club.profileImage} name={club.name} size={140} />
          <h1>{club.name}</h1>
          <p className="muted">{[club.affiliation, club.city].filter(Boolean).join(' · ')}</p>
          {club.bio && <p className="club__bio">{club.bio}</p>}
          <div className="club__facts">
            {club.foundingYear ? <span>Est. {club.foundingYear}</span> : null}
            {club.memberCount ? <span>{club.memberCount} members</span> : null}
          </div>
          {club.openToSponsorship && <span className="badge badge--open">Open to sponsorship</span>}
          <h4>Contacts</h4>
          <ContactRow club={club} />
        </aside>

        <div className="club__body">
          <section>
            <h2>About</h2>
            {club.descriptionMd ? <Markdown source={club.descriptionMd} /> : <p className="muted">No description yet.</p>}
          </section>

          {club.fields.length > 0 && (
            <section>
              <h2>Fields &amp; activities</h2>
              <FieldChips fields={club.fields} />
            </section>
          )}

          {club.gallery.length > 0 && (
            <section>
              <h2>Gallery</h2>
              <div className="gallery">
                {club.gallery.map((g) => (
                  <figure key={g.id} onClick={() => setLightbox(g)}>
                    <img src={g.url} alt={g.caption || club.name} loading="lazy" />
                    {g.caption && <figcaption>{g.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {(club.openToSponsorship || club.sponsorshipPitch || club.sponsorshipNeeds.length > 0) && (
            <section className="sponsor-box">
              <h2>Sponsorship</h2>
              {club.sponsorshipNeeds.length > 0 && (
                <>
                  <h4>What we're looking for</h4>
                  <FieldChips fields={club.sponsorshipNeeds} />
                </>
              )}
              {club.sponsorshipPitch && (<><h4>Why sponsor us</h4><p>{club.sponsorshipPitch}</p></>)}
              {club.achievements && (<><h4>Achievements</h4><p>{club.achievements}</p></>)}
              {club.pastSponsors && (<><h4>Past &amp; current sponsors</h4><p>{club.pastSponsors}</p></>)}
              {club.sponsorshipContact && (<p className="muted">Sponsorship contact: {club.sponsorshipContact}</p>)}
              <InquiryForm slug={club.slug} />
            </section>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.url} alt={lightbox.caption || ''} />
        </div>
      )}
    </div>
  );
}
