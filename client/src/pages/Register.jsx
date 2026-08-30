import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Banner, Field } from '../components';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await register(form);
      nav('/dashboard/new');
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  };

  return (
    <div className="container narrow section">
      <h1>Create an account</h1>
      <p className="muted">One account can manage several club pages and be a co-admin on others.</p>
      <form className="stack" onSubmit={submit}>
        <Banner kind="error">{error}</Banner>
        <Field label="Your name"><input required value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input type="email" required value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" hint="at least 8 characters"><input type="password" required minLength={8} value={form.password} onChange={set('password')} /></Field>
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </div>
  );
}
