import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import NotificationList from '../components/NotificationList';
import Timetable from '../components/Timetable';
import PickedForYou from '../components/PickedForYou';
import ChatbotWidget from '../components/ChatbotWidget';
import api from '../api/axios';

function WelcomePoster() {
  const [visible, setVisible] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  if (!visible || imageFailed) return null;

  return (
    <div className="poster-banner">
      <button
        className="poster-close-btn"
        onClick={() => setVisible(false)}
        aria-label="Close poster"
      >
        ✕
      </button>
      <img
        src="/images/welcome-poster.jpg"
        alt="Welcome Poster"
        className="poster-image"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function StudentDashboard() {
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    setStudentName(localStorage.getItem('studentName') || '');
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <WelcomePoster />

        <div className="dashboard-section">
          <h2 style={{ marginBottom: 6 }}>Welcome back{studentName ? `, ${studentName}` : ''} 👋</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Use the menu on the left to browse Events, Clubs and the Practice Hub.
          </p>
        </div>

        <div className="dashboard-section">
          <h3>Today's Schedule</h3>
          <div className="card">
            <Timetable />
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Picked for you</h3>
          <PickedForYou />
        </div>

        <div className="dashboard-section">
          <h3>Notifications</h3>
          <NotificationList />
        </div>
      </div>
      <ChatbotWidget />
    </>
  );
}

export default StudentDashboard;
