import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import StudentLogin from './pages/StudentLogin';
import StudentSignup from './pages/StudentSignup';
import AdminLogin from './pages/AdminLogin';
import StudentDashboard from './pages/StudentDashboard';
import ProfileSetup from './pages/ProfileSetup';
import Events from './pages/Events';
import MyRegistrations from './pages/MyRegistrations';
import Clubs from './pages/Clubs';
import PracticeHub from './pages/PracticeHub';
import AdminDashboard from './pages/AdminDashboard';

function RequireAuth({ role, children }) {
  const isLoggedIn = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!isLoggedIn || userRole !== role) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/student/login'} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/signup" element={<StudentSignup />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/dashboard" element={<RequireAuth role="student"><StudentDashboard /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth role="student"><ProfileSetup /></RequireAuth>} />
        <Route path="/events" element={<RequireAuth role="student"><Events /></RequireAuth>} />
        <Route path="/my-registrations" element={<RequireAuth role="student"><MyRegistrations /></RequireAuth>} />
        <Route path="/clubs" element={<RequireAuth role="student"><Clubs /></RequireAuth>} />
        <Route path="/practice-hub" element={<RequireAuth role="student"><PracticeHub /></RequireAuth>} />

        <Route path="/admin/dashboard" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
