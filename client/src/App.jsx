import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components';
import { useAuth } from './auth';
import Home from './pages/Home';
import Directory from './pages/Directory';
import ClubProfile from './pages/ClubProfile';
import ForCompanies from './pages/ForCompanies';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateClub from './pages/CreateClub';
import ClubEditor from './pages/ClubEditor';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clubs" element={<Directory />} />
          <Route path="/clubs/:slug" element={<ClubProfile />} />
          <Route path="/for-companies" element={<ForCompanies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/dashboard/new" element={<Protected><CreateClub /></Protected>} />
          <Route path="/dashboard/clubs/:slug" element={<Protected><ClubEditor /></Protected>} />
          <Route path="*" element={<div className="container"><h1>404</h1><p>Page not found.</p></div>} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <p>ClubSpot — a place for Bulgarian clubs to be found by sponsors. Built as a demo.</p>
        </div>
      </footer>
    </>
  );
}
