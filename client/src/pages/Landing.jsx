import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>🎓 Freshers Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Your one-stop hub for events, clubs, placements, timetables and more.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/student/login" className="btn-primary" style={{ padding: '14px', textDecoration: 'none', textAlign: 'center' }}>
            Student Login
          </Link>
          <Link to="/student/signup" className="btn-secondary" style={{ padding: '12px', textDecoration: 'none', textAlign: 'center' }}>
            Create a Student Account
          </Link>
          <Link to="/admin/login" style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;
