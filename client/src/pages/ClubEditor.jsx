import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner, Field, FieldChips, Markdown, useMeta } from '../components';

const TABS = ['Details', 'Description', 'Fields', 'Gallery', 'Admins', 'Inquiries'];

export default function ClubEditor() {
  const { slug } = useParams();
  const { user, refresh } = useAuth();
  const [club, setClub] = useState(null);
  const [tab, setTab] = useState('Details');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { club } = await api.get(`/clubs/${slug}`);
      setClub(club);
    } catch (e) { setError(e.message); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="container section"><Banner kind="error">{error}</Banner></div>;
  if (!club) return <div className="container section"><p>Loading…</p></div>;

  const isOwner = club.admins.some((a) => a.id === user.id && a.role === 'owner');
  const common = { club, reload: load, refresh };

  return (
    <div className="container section">
      <div className="section__head">
        <h1>{club.name}</h1>
        <Link to={`/clubs/${club.slug}`} className="btn btn--ghost btn--sm">View public page →</Link>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Details' && <DetailsTab {...common} />}
      {tab === 'Description' && <DescriptionTab {...common} />}
      {tab === 'Fields' && <FieldsTab {...common} />}
      {tab === 'Gallery' && <GalleryTab {...common} />}
      {tab === 'Admins' && <AdminsTab {...common} isOwner={isOwner} me={user} />}
      {tab === 'Inquiries' && <InquiriesTab club={club} />}
    </div>
  );
}

function useSaver(club, reload, refresh) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const save = async (patch) => {
    setStatus('saving'); setError('');
    try {
      await api.put(`/clubs/${club.id}`, patch);
      await reload();
      if (refresh) await refresh();
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) { setError(e.message); setStatus('idle'); }
  };
  return { save, status, error };
}

function SaveBar({ status, error }) {
  return (
    <div className="savebar">
      <Banner kind="error">{error}</Banner>
      <button className="btn btn--primary" disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
      </button>
    </div>
  );
}

function DetailsTab({ club, reload, refresh }) {
  const { save, status, error } = useSaver(club, reload, refresh);
  const [f, setF] = useState({
    name: club.name, bio: club.bio, city: club.city, affiliation: club.affiliation,
    foundingYear: club.foundingYear || '', memberCount: club.memberCount || '',
    contactEmail: club.contactEmail, phone: club.phone, website: club.website,
    socials: club.socials.length ? club.socials : [],
    openToSponsorship: club.openToSponsorship,
    sponsorshipNeeds: club.sponsorshipNeeds, sponsorshipPitch: club.sponsorshipPitch,
    achievements: club.achievements, pastSponsors: club.pastSponsors, sponsorshipContact: club.sponsorshipContact,
  });
  const meta = useMeta();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setSocial = (i, key, val) => {
    const socials = f.socials.map((s, idx) => (idx === i ? { ...s, [key]: val } : s));
    setF({ ...f, socials });
  };
  const toggleNeed = (need) => {
    const has = f.sponsorshipNeeds.includes(need);
    setF({ ...f, sponsorshipNeeds: has ? f.sponsorshipNeeds.filter((n) => n !== need) : [...f.sponsorshipNeeds, need] });
  };

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save({ ...f, fields: undefined }); }}>
      <h3>Profile picture</h3>
      <ImageUploader
        current={club.profileImage}
        onUpload={async (fd) => { await api.upload(`/clubs/${club.id}/profile-image`, fd); await reload(); await refresh(); }}
      />

      <h3>Basics</h3>
      <Field label="Club name"><input required value={f.name} onChange={set('name')} /></Field>
      <Field label="Short bio" hint={`${f.bio.length}/250 — shown under the name`}>
        <textarea rows={3} maxLength={250} value={f.bio} onChange={set('bio')} />
      </Field>
      <div className="row2">
        <Field label="City"><input value={f.city} onChange={set('city')} /></Field>
        <Field label="University / school / affiliation"><input value={f.affiliation} onChange={set('affiliation')} /></Field>
      </div>
      <div className="row2">
        <Field label="Founding year"><input type="number" value={f.foundingYear} onChange={set('foundingYear')} /></Field>
        <Field label="Number of members"><input type="number" value={f.memberCount} onChange={set('memberCount')} /></Field>
      </div>

      <h3>Contacts</h3>
      <div className="row2">
        <Field label="Contact email"><input type="email" value={f.contactEmail} onChange={set('contactEmail')} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={set('phone')} /></Field>
      </div>
      <Field label="Website" hint="include https://"><input value={f.website} onChange={set('website')} /></Field>

      <h4>Social media & other links</h4>
      {f.socials.map((s, i) => (
        <div className="row2" key={i}>
          <input placeholder="Label (Instagram, LinkedIn…)" value={s.label} onChange={(e) => setSocial(i, 'label', e.target.value)} />
          <div className="inline">
            <input placeholder="https://…" value={s.url} onChange={(e) => setSocial(i, 'url', e.target.value)} />
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setF({ ...f, socials: f.socials.filter((_, idx) => idx !== i) })}>✕</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setF({ ...f, socials: [...f.socials, { label: '', url: '' }] })}>+ Add link</button>

      <h3>Sponsorship</h3>
      <label className="checkbox">
        <input type="checkbox" checked={f.openToSponsorship} onChange={(e) => setF({ ...f, openToSponsorship: e.target.checked })} />
        Show an "Open to sponsorship" badge and the inquiry form
      </label>
      <Field label="What are you looking for?">
        <div className="chips">
          {(meta?.sponsorshipNeeds || []).map((n) => (
            <button type="button" key={n} className={`chip chip--btn ${f.sponsorshipNeeds.includes(n) ? 'chip--on' : ''}`} onClick={() => toggleNeed(n)}>{n}</button>
          ))}
        </div>
      </Field>
      <Field label="Why sponsor us? (pitch)"><textarea rows={3} value={f.sponsorshipPitch} onChange={set('sponsorshipPitch')} /></Field>
      <Field label="Achievements"><textarea rows={2} value={f.achievements} onChange={set('achievements')} /></Field>
      <Field label="Past & current sponsors"><input value={f.pastSponsors} onChange={set('pastSponsors')} /></Field>
      <Field label="Dedicated sponsorship contact" hint="name / email for sponsor enquiries"><input value={f.sponsorshipContact} onChange={set('sponsorshipContact')} /></Field>

      <SaveBar status={status} error={error} />
    </form>
  );
}

function DescriptionTab({ club, reload }) {
  const { save, status, error } = useSaver(club, reload);
  const [md, setMd] = useState(club.descriptionMd);
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save({ ...club, foundingYear: club.foundingYear || '', memberCount: club.memberCount || '', descriptionMd: md, fields: undefined }); }}>
      <p className="muted">Supports Markdown — <code>## heading</code>, <code>**bold**</code>, <code>*italic*</code>, lists, links.</p>
      <div className="editor2">
        <textarea rows={18} value={md} onChange={(e) => setMd(e.target.value)} />
        <div className="preview card"><Markdown source={md} /></div>
      </div>
      <SaveBar status={status} error={error} />
    </form>
  );
}

function FieldsTab({ club, reload }) {
  const { save, status, error } = useSaver(club, reload);
  const meta = useMeta();
  const [selected, setSelected] = useState(club.fields);
  const toggle = (f) => setSelected(selected.includes(f) ? selected.filter((x) => x !== f) : [...selected, f]);
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save({ ...club, foundingYear: club.foundingYear || '', memberCount: club.memberCount || '', fields: selected }); }}>
      <p className="muted">{selected.length} selected — these power the company-facing filters.</p>
      {meta && Object.entries(meta.fieldGroups).map(([group, list]) => (
        <div key={group}>
          <h4>{group}</h4>
          <div className="chips">
            {list.map((f) => (
              <button type="button" key={f} className={`chip chip--btn ${selected.includes(f) ? 'chip--on' : ''}`} onClick={() => toggle(f)}>{f}</button>
            ))}
          </div>
        </div>
      ))}
      <SaveBar status={status} error={error} />
    </form>
  );
}

function ImageUploader({ current, onUpload, multiple }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onChange = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setBusy(true); setError('');
    const fd = new FormData();
    if (multiple) files.forEach((f) => fd.append('images', f));
    else fd.append('image', files[0]);
    try { await onUpload(fd); } catch (err) { setError(err.message); }
    setBusy(false);
    e.target.value = '';
  };
  return (
    <div className="uploader">
      {current && !multiple && <img className="uploader__preview" src={current} alt="" />}
      <input type="file" accept="image/*" multiple={multiple} onChange={onChange} disabled={busy} />
      {busy && <span className="muted">Uploading…</span>}
      <Banner kind="error">{error}</Banner>
    </div>
  );
}

function GalleryTab({ club, reload }) {
  const [error, setError] = useState('');
  const removeImg = async (id) => {
    try { await api.del(`/clubs/${club.id}/gallery/${id}`); await reload(); }
    catch (e) { setError(e.message); }
  };
  const saveCaption = async (id, caption) => {
    try { await api.patch(`/clubs/${club.id}/gallery/${id}`, { caption }); }
    catch (e) { setError(e.message); }
  };
  return (
    <div className="stack">
      <Banner kind="error">{error}</Banner>
      <ImageUploader
        multiple
        onUpload={async (fd) => { await api.upload(`/clubs/${club.id}/gallery`, fd); await reload(); }}
      />
      <div className="gallery gallery--edit">
        {club.gallery.map((g) => (
          <figure key={g.id}>
            <img src={g.url} alt={g.caption} />
            <input
              defaultValue={g.caption} placeholder="Caption"
              onBlur={(e) => saveCaption(g.id, e.target.value)}
            />
            <button className="btn btn--ghost btn--sm" onClick={() => removeImg(g.id)}>Delete</button>
          </figure>
        ))}
      </div>
      {!club.gallery.length && <p className="muted">No photos yet.</p>}
    </div>
  );
}

function AdminsTab({ club, reload, isOwner, me }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await api.post(`/clubs/${club.id}/admins`, { email }); setEmail(''); await reload(); }
    catch (err) { setError(err.message); }
    setBusy(false);
  };
  const remove = async (userId) => {
    setError('');
    try { await api.del(`/clubs/${club.id}/admins/${userId}`); await reload(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="stack">
      <p className="muted">Page admins can edit every part of this club page. The person must already have a ClubSpot account.</p>
      <Banner kind="error">{error}</Banner>
      <ul className="admins">
        {club.admins.map((a) => (
          <li key={a.id}>
            <span>{a.name || a.email} <em className="muted">{a.email} · {a.role}</em></span>
            {a.role !== 'owner' && (isOwner || a.id === me.id) && (
              <button className="btn btn--ghost btn--sm" onClick={() => remove(a.id)}>Remove</button>
            )}
          </li>
        ))}
      </ul>
      <form className="inline" onSubmit={add}>
        <input type="email" placeholder="teammate@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn--primary" disabled={busy}>Add admin</button>
      </form>
    </div>
  );
}

const STATUSES = ['new', 'read', 'in_progress', 'closed'];

function InquiriesTab({ club }) {
  const [inquiries, setInquiries] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get(`/clubs/${club.id}/inquiries`).then((d) => setInquiries(d.inquiries)).catch((e) => setError(e.message));
  }, [club.id]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try { await api.patch(`/clubs/${club.id}/inquiries/${id}`, { status }); load(); }
    catch (e) { setError(e.message); }
  };

  if (!inquiries) return <p>Loading…</p>;
  return (
    <div className="stack">
      <Banner kind="error">{error}</Banner>
      {!inquiries.length && <p className="muted">No sponsorship inquiries yet. They'll appear here when a company contacts you.</p>}
      {inquiries.map((q) => (
        <div key={q.id} className={`card inquiry-card status-${q.status}`}>
          <div className="inquiry-card__head">
            <strong>{q.company}</strong>
            <select value={q.status} onChange={(e) => setStatus(q.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <p className="muted">
            {[q.contact_name, q.email, q.phone].filter(Boolean).join(' · ')}
            {q.budget && ` · budget: ${q.budget}`}
          </p>
          {q.message && <p>{q.message}</p>}
          <p className="muted small">{new Date(q.created_at + 'Z').toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
