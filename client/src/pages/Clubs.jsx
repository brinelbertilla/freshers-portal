import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ChatbotWidget from '../components/ChatbotWidget';
import TeamRegistrationModal from '../components/TeamRegistrationModal';
import api from '../api/axios';

const CATEGORIES = ['all', 'technical', 'cultural'];

function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [joined, setJoined] = useState({});
  const [message, setMessage] = useState('');
  const [teamModalClub, setTeamModalClub] = useState(null);
  const [teamError, setTeamError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/clubs').then((res) => setClubs(res.data.clubs || [])).catch(() => {});
  }, []);

  const join = async (id, payload) => {
    setMessage('');
    try {
      await api.post(`/clubs/${id}/join`, payload || {});
      setJoined((prev) => ({ ...prev, [id]: true }));
      setMessage('Joined club successfully!');
      setTeamModalClub(null);
      setTeamError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join club';
      if (teamModalClub) {
        setTeamError(msg);
      } else {
        setMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinClick = (club) => {
    setTeamError('');
    setTeamModalClub(club);
  };

  const handleTeamSubmit = (payload) => {
    setSubmitting(true);
    join(teamModalClub.id, payload);
  };

  const filtered = filter === 'all' ? clubs : clubs.filter((c) => c.category === filter);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Clubs</h2>

        <div className="tab-bar">
          {CATEGORIES.map((c) => (
            <span key={c} className={`chip ${filter === c ? 'selected' : ''}`} onClick={() => setFilter(c)}>
              {c}
            </span>
          ))}
        </div>

        {message && <p className="success-text" style={{ marginBottom: 16 }}>{message}</p>}

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No clubs found.</p>
        ) : (
          <div className="grid-3">
            {filtered.map((club) => (
              <div key={club.id} className="card">
                <span className={`badge badge-${club.category}`}>{club.category}</span>
                {club.requires_team ? <span className="badge badge-team">Team of {club.team_size}</span> : null}
                <h3 style={{ marginTop: 10 }}>{club.name}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{club.description}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  👤 {club.incharge_name}<br />
                  🕒 {club.time_slot}<br />
                  📍 {club.location}
                </p>
                <button
                  className="btn-primary"
                  style={{ marginTop: 12 }}
                  disabled={joined[club.id]}
                  onClick={() => handleJoinClick(club)}
                >
                  {joined[club.id] ? 'Joined ✓' : 'Join Club'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {teamModalClub && (
        <TeamRegistrationModal
          title={teamModalClub.name}
          teamSize={teamModalClub.team_size || 1}
          requiresTeam={!!teamModalClub.requires_team}
          submitting={submitting}
          error={teamError}
          onCancel={() => setTeamModalClub(null)}
          onSubmit={handleTeamSubmit}
        />
      )}

      <ChatbotWidget />
    </>
  );
}

export default Clubs;
