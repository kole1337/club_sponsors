import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { api } from './api';
import { useAuth } from './auth';

marked.setOptions({ breaks: true, gfm: true });

export function Markdown({ source }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(source || '')),
    [source]
  );
  if (!source) return null;
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Avatar({ src, name, size = 96 }) {
  const initials = (name || '?')
    .split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return src ? (
    <img className="avatar" src={src} alt={name} style={{ width: size, height: size }} />
  ) : (
    <div className="avatar avatar--fallback" style={{ width: size, height: size, fontSize: size / 2.6 }}>
      {initials}
    </div>
  );
}

export function FieldChips({ fields = [], onClick }) {
  if (!fields.length) return null;
  return (
    <div className="chips">
      {fields.map((f) =>
        onClick ? (
          <button key={f} type="button" className="chip chip--btn" onClick={() => onClick(f)}>{f}</button>
        ) : (
          <span key={f} className="chip">{f}</span>
        )
      )}
    </div>
  );
}

export function useMeta() {
  const [meta, setMeta] = useState(null);
  useEffect(() => { api.get('/meta').then(setMeta).catch(() => {}); }, []);
  return meta;
}

export function Navbar() {
  const { user, myClubs, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="brand">Club<span>Spot</span></Link>
        <nav className="nav__links">
          <Link to="/clubs">Browse clubs</Link>
          <Link to="/for-companies">For companies</Link>
          {user ? (
            <>
              <Link to="/dashboard">My clubs{myClubs.length ? ` (${myClubs.length})` : ''}</Link>
              <button className="btn btn--ghost" onClick={() => { logout(); nav('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn--primary btn--sm">Register a club</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}{hint && <em> — {hint}</em>}</span>
      {children}
    </label>
  );
}

export function Banner({ kind = 'info', children }) {
  if (!children) return null;
  return <div className={`banner banner--${kind}`}>{children}</div>;
}
