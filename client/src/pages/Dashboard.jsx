import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { Avatar } from '../components';

export default function Dashboard() {
  const { user, myClubs } = useAuth();
  return (
    <div className="container section">
      <div className="section__head">
        <h1>My clubs</h1>
        <Link to="/dashboard/new" className="btn btn--primary">+ New club</Link>
      </div>
      <p className="muted">Signed in as {user.email}</p>
      {!myClubs.length && <p>You don't manage any club pages yet. Create one to get started.</p>}
      <div className="grid">
        {myClubs.map((c) => (
          <Link key={c.id} to={`/dashboard/clubs/${c.slug}`} className="card club-card">
            <div className="club-card__top">
              <Avatar src={c.profileImage} name={c.name} size={48} />
              <div>
                <h3>{c.name}</h3>
                <p className="muted">{c.role === 'owner' ? 'Owner' : 'Admin'}</p>
              </div>
            </div>
            <span className="btn btn--ghost btn--sm">Manage page →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
