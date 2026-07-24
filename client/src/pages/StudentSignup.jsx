import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StudyIllustration from '../components/StudyIllustration';

function StudentSignup() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/student/signup', form);
      navigate('/student/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
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
          <h2>Create your account</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
            Already have an account? <Link to="/student/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentSignup;
