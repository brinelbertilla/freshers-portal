import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StudyIllustration from '../components/StudyIllustration';

function StudentLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/student/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'student');
      localStorage.setItem('studentName', res.data.student.name);
      navigate(res.data.student.profile_completed ? '/dashboard' : '/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-split">
        <div className="auth-illustration-panel">
          <StudyIllustration />
        </div>
        <div className="auth-form-panel">
          <h2>Student Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 8 }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p style={{ marginTop: 8, fontSize: 14, textAlign: 'center' }}>
            New here? <Link to="/student/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
