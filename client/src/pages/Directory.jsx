import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar, FieldChips, useMeta } from '../components';

export default function Directory() {
  const meta = useMeta();
  const [params, setParams] = useSearchParams();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') || '';
  const field = params.get('field') || '';
  const city = params.get('city') || '';
  const sponsorOnly = params.get('sponsorOnly') === '1';

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (field) qs.set('field', field);
    if (city) qs.set('city', city);
    if (sponsorOnly) qs.set('sponsorOnly', '1');
    api.get(`/clubs?${qs}`).then((d) => setClubs(d.clubs)).finally(() => setLoading(false));
  }, [q, field, city, sponsorOnly]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="container section">
      <h1>Browse clubs</h1>
      <div className="filters">
        <input
          type="search" placeholder="Search by name, bio, school…" defaultValue={q}
          onChange={(e) => update('q', e.target.value)}
        />
        <select value={field} onChange={(e) => update('field', e.target.value)}>
          <option value="">All fields</option>
          {meta && Object.entries(meta.fieldGroups).map(([group, list]) => (
            <optgroup key={group} label={group}>
              {list.map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
          ))}
        </select>
        <select value={city} onChange={(e) => update('city', e.target.value)}>
          <option value="">All cities</option>
          {meta?.cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="checkbox">
          <input type="checkbox" checked={sponsorOnly} onChange={(e) => update('sponsorOnly', e.target.checked ? '1' : '')} />
          Open to sponsorship
        </label>
      </div>

      {loading ? <p>Loading…</p> : (
        <>
          <p className="muted">{clubs.length} club{clubs.length !== 1 ? 's' : ''}</p>
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
                <FieldChips fields={c.fields.slice(0, 5)} />
                <div className="club-card__meta">
                  {c.memberCount ? <span>{c.memberCount} members</span> : null}
                  {c.openToSponsorship && <span className="badge badge--open">Open to sponsorship</span>}
                </div>
              </Link>
            ))}
          </div>
          {!clubs.length && <p>No clubs match these filters yet.</p>}
        </>
      )}
    </div>
  );
}
