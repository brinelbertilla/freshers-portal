import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ChatbotWidget from '../components/ChatbotWidget';
import TeamRegistrationModal from '../components/TeamRegistrationModal';
import api from '../api/axios';

const CATEGORIES = ['all', 'technical', 'cultural'];

function Events() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [registered, setRegistered] = useState({});
  const [message, setMessage] = useState('');
  const [teamModalEvent, setTeamModalEvent] = useState(null);
  const [teamError, setTeamError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = () => {
    api.get('/events').then((res) => setEvents(res.data.events || [])).catch(() => {});
  };

  useEffect(() => { loadEvents(); }, []);

  const register = async (id, payload) => {
    setMessage('');
    try {
      await api.post(`/events/${id}/register`, payload || {});
      setRegistered((prev) => ({ ...prev, [id]: true }));
      setMessage('Registered successfully!');
      setTeamModalEvent(null);
      setTeamError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (teamModalEvent) {
        setTeamError(msg);
      } else {
        setMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterClick = (ev) => {
    setTeamError('');
    setTeamModalEvent(ev);
  };

  const handleTeamSubmit = (payload) => {
    setSubmitting(true);
    register(teamModalEvent.id, payload);
  };

  const filtered = filter === 'all' ? events : events.filter((e) => e.category === filter);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Events</h2>

        <div className="tab-bar">
          {CATEGORIES.map((c) => (
            <span key={c} className={`chip ${filter === c ? 'selected' : ''}`} onClick={() => setFilter(c)}>
              {c}
            </span>
          ))}
        </div>

        {message && <p className="success-text" style={{ marginBottom: 16 }}>{message}</p>}

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No events found.</p>
        ) : (
          <div className="grid-2">
            {filtered.map((ev) => (
              <div key={ev.id} className="card">
                <span className={`badge badge-${ev.category}`}>{ev.category}</span>
                {ev.requires_team ? <span className="badge badge-team">Team of {ev.team_size}</span> : null}
                <h3 style={{ marginTop: 10 }}>{ev.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{ev.purpose}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  📅 {new Date(ev.event_date).toLocaleDateString()} at {ev.event_time?.slice(0, 5)}<br />
                  📍 {ev.place}<br />
                  👤 In-charge: {ev.incharge_name}<br />
                  {ev.company && ev.company !== 'None' && <>🏢 {ev.company}<br /></>}
                  🗂️ Organized by: {ev.organizer}
                </p>
                <button
                  className="btn-primary"
                  style={{ marginTop: 12 }}
                  disabled={registered[ev.id]}
                  onClick={() => handleRegisterClick(ev)}
                >
                  {registered[ev.id] ? 'Registered ✓' : 'Register'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {teamModalEvent && (
        <TeamRegistrationModal
          title={teamModalEvent.title}
          teamSize={teamModalEvent.team_size || 1}
          requiresTeam={!!teamModalEvent.requires_team}
          submitting={submitting}
          error={teamError}
          onCancel={() => setTeamModalEvent(null)}
          onSubmit={handleTeamSubmit}
        />
      )}

      <ChatbotWidget />
    </>
  );
}

export default Events;
