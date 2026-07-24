import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

// Alphabetical order, as requested
const BRANCHES = ['AIDS', 'AIML', 'CIVIL', 'CSBS', 'CSE', 'ECE', 'EEE', 'EIE', 'ICE', 'MECH'];
const YEARS = [
  { value: '1', label: '1st' },
  { value: '2', label: '2nd' },
  { value: '3', label: '3rd' },
  { value: '4', label: '4th' }
];
const SECTIONS = ['A', 'B'];
const INTEREST_OPTIONS = [
  'coding', 'robotics', 'music', 'dance', 'drama', 'photography', 'sports',
  'debate', 'design', 'entrepreneurship', 'volunteering', 'gaming',
  'reading', 'public speaking', 'content creation', 'AI/ML'
];

function ProfileSetup() {
  const [fullName, setFullName] = useState('');
  const [form, setForm] = useState({ branch: 'CSE', year: '1', section: 'A', interests: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/profile').then((res) => {
      const s = res.data.student;
      if (s?.full_name) setFullName(s.full_name);
      if (s?.branch) {
        setForm({
          branch: s.branch,
          year: s.year,
          section: s.section,
          interests: s.interests ? (typeof s.interests === 'string' ? JSON.parse(s.interests) : s.interests) : []
        });
      }
    }).catch(() => {});
  }, []);

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put('/auth/profile', form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 640 }}>
        <h2>Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label>Full Name</label>
            <input value={fullName} disabled />
          </div>

          <div className="grid-3">
            <div className="field">
              <label>Branch</label>
              <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Year</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Section</label>
              <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>What are you into?</label>
            <div>
              {INTEREST_OPTIONS.map((interest) => (
                <span
                  key={interest}
                  className={`chip ${form.interests.includes(interest) ? 'selected' : ''}`}
                  style={{ marginRight: 8, marginBottom: 8 }}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" style={{ marginTop: 12, width: '100%', padding: 14 }} disabled={loading}>
            {loading ? 'Saving...' : 'Enter the Portal'}
          </button>
        </form>
      </div>
    </>
  );
}

export default ProfileSetup;
