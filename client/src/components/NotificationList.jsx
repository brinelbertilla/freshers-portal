import { useEffect, useState } from 'react';
import api from '../api/axios';

function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then((res) => setNotifications(res.data.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const dismiss = async (id) => {
    try {
      await api.put(`/notifications/${id}/dismiss`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      // ignore
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading notifications...</p>;
  if (!notifications.length) return <p style={{ color: 'var(--text-muted)' }}>No notifications right now.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {notifications.map((n) => {
        const isPast = n.fire_at && new Date(n.fire_at) < new Date();
        return (
          <div key={n.id} className="card notification-card">
            {isPast && (
              <button
                className="notification-dismiss-x"
                onClick={() => dismiss(n.id)}
                aria-label="Dismiss past notification"
                title="Dismiss"
              >
                ✕
              </button>
            )}
            <span className={`badge badge-${n.source_type === 'club' ? 'cultural' : 'technical'}`}>{n.source_type}</span>
            <h4 style={{ marginTop: 8, marginBottom: 4 }}>{n.title}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{n.message}</p>
          </div>
        );
      })}
    </div>
  );
}

export default NotificationList;
