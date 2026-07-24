import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ChatbotWidget from '../components/ChatbotWidget';
import api from '../api/axios';

function MyRegistrations() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/events/my/registrations')
      .then((res) => setEvents(res.data.events || []))
      .catch(() => setError('Could not load your registered events.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>My Registered Events</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Here's everything you've signed up for so far.
        </p>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
        {!loading && error && <p className="error-text">{error}</p>}

        {!loading && !error && events.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            You haven't registered for any events yet. Head over to the Events page to find something to join!
          </p>
        ) : (
          <div className="grid-2">
            {events.map((ev) => (
              <div key={ev.id} className="card">
                <span className={`badge badge-${ev.category}`}>{ev.category}</span>
                {ev.team_name ? <span className="badge badge-team">Team: {ev.team_name}</span> : null}
                <h3 style={{ marginTop: 10 }}>{ev.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{ev.purpose}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  📅 {new Date(ev.event_date).toLocaleDateString()} at {ev.event_time?.slice(0, 5)}<br />
                  📍 {ev.place}<br />
                  👤 In-charge: {ev.incharge_name}<br />
                  {ev.company && ev.company !== 'None' && <>🏢 {ev.company}<br /></>}
                  🗂️ Organized by: {ev.organizer}
                </p>
                {ev.members && ev.members.length > 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                    👥 Registered as: {ev.members.map((m) => m.name).join(', ')}
                  </p>
                )}
                <p className="success-text" style={{ marginTop: 10 }}>Registered ✓</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <ChatbotWidget />
    </>
  );
}

export default MyRegistrations;
