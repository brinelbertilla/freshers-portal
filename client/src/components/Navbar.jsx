import { Link, useLocation, useNavigate } from 'react-router-dom';
import StudyIllustration from './StudyIllustration';

const STUDENT_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/events', label: 'Events', icon: '📅' },
  { to: '/my-registrations', label: 'My Registrations', icon: '📝' },
  { to: '/clubs', label: 'Clubs', icon: '👥' },
  { to: '/practice-hub', label: 'Practice Hub', icon: '📘' },
  { to: '/profile', label: 'Profile', icon: '⚙️' }
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const studentName = localStorage.getItem('studentName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('studentName');
    navigate('/');
  };

  return (
    <nav className="sidebar">
      <Link to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="sidebar-title">
        🎓 Freshers Portal
      </Link>

      {role === 'student' && (
        <div className="sidebar-links">
          {STUDENT_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={location.pathname === link.to ? 'active' : ''}
            >
              <span>{link.icon}</span> {link.label}
            </Link>
          ))}

          <div className="sidebar-illustration">
            <StudyIllustration />
          </div>
        </div>
      )}

      {role === 'admin' && (
        <div className="sidebar-links">
          <Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
            <span>🛠️</span> Admin Dashboard
          </Link>
        </div>
      )}

      <div className="sidebar-footer">
        {role === 'student' && studentName && <p className="sidebar-user">Hi, {studentName}</p>}
        <button className="btn-secondary sidebar-logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
