import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function PickedForYou() {
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/auth/profile'),
      api.get('/events'),
      api.get('/clubs')
    ]).then(([profileRes, eventsRes, clubsRes]) => {
      const myInterests = parseTags(profileRes.data.student?.interests);
      const events = (eventsRes.data.events || []).map((e) => ({ ...e, _kind: 'event' }));
      const clubs = (clubsRes.data.clubs || []).map((c) => ({ ...c, _kind: 'club' }));
      const all = [...events, ...clubs];

      let matched = all.filter((item) => {
        const tags = parseTags(item.interest_tags);
        return tags.some((t) => myInterests.includes(t));
      });

      // Fallback: if the student hasn't set interests yet, or nothing tagged
      // matches, just surface a few upcoming items so the section isn't empty.
      if (!matched.length) {
        matched = all.slice(0, 4);
      }

      setPicks(matched.slice(0, 4));
    }).catch(() => setPicks([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Finding things you'll like...</p>;
  if (!picks.length) return <p style={{ color: 'var(--text-muted)' }}>Nothing to recommend yet — check back soon.</p>;

  return (
    <div className="grid-2">
      {picks.map((item) => (
        <Link
          key={`${item._kind}-${item.id}`}
          to={item._kind === 'event' ? '/events' : '/clubs'}
          className="card"
          style={{ textDecoration: 'none' }}
        >
          <span className={`badge badge-${item.category}`}>{item._kind === 'event' ? 'Event' : 'Club'} • {item.category}</span>
          <h4 style={{ marginTop: 8 }}>{item._kind === 'event' ? item.title : item.name}</h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {item._kind === 'event'
              ? `${new Date(item.event_date).toLocaleDateString()} • ${item.place || ''}`
              : `${item.time_slot || ''} • ${item.location || ''}`}
          </p>
        </Link>
      ))}
    </div>
  );
}

export default PickedForYou;
