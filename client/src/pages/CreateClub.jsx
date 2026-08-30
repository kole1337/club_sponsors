import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner, Field } from '../components';

export default function CreateClub() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { club } = await api.post('/clubs', { name, bio });
      await refresh();
      nav(`/dashboard/clubs/${club.slug}`);
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  };

  return (
    <div className="container narrow section">
      <h1>Create a club</h1>
      <p className="muted">You'll be able to add everything else — description, gallery, contacts, fields — on the next screen.</p>
      <form className="stack" onSubmit={submit}>
        <Banner kind="error">{error}</Banner>
        <Field label="Club name"><input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Short bio" hint={`${bio.length}/250`}>
          <textarea rows={3} maxLength={250} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Creating…' : 'Create club'}</button>
      </form>
    </div>
  );
}
