import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ChatbotWidget from '../components/ChatbotWidget';
import api from '../api/axios';

const TABS = ['aptitude', 'verbal', 'coding'];

function PracticeHub() {
  const [tab, setTab] = useState('aptitude');
  const [questions, setQuestions] = useState([]);
  const [revealed, setRevealed] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setRevealed({});
    api.get(`/placement/questions/${tab}`)
      .then((res) => setQuestions(res.data.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const toggleReveal = (id) => setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Practice Hub</h2>

        <div className="tab-bar">
          {TABS.map((t) => (
            <span key={t} className={`chip ${tab === t ? 'selected' : ''}`} onClick={() => setTab(t)}>
              {t}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!loading && questions.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {questions.length} questions • Try to answer each one yourself first, then click "Show Answer" to check.
            </p>
          )}
          {loading && <p style={{ color: 'var(--text-muted)' }}>Loading questions...</p>}
          {!loading && questions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No questions yet in this category.</p>}
          {questions.map((q) => {
            return (
              <div key={q.id} className="card">
                <span className="badge badge-technical">{q.difficulty}</span>
                <h4 style={{ marginTop: 10 }}>{q.question}</h4>

                <div style={{ marginTop: 12 }}>
                  <button className="btn-secondary" onClick={() => toggleReveal(q.id)}>
                    {revealed[q.id] ? 'Hide Answer' : 'Show Answer'}
                  </button>
                  {revealed[q.id] && (
                    <pre style={{
                      marginTop: 10,
                      padding: 12,
                      background: 'var(--surface-alt)',
                      borderRadius: 8,
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {q.answer}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ChatbotWidget />
    </>
  );
}

export default PracticeHub;
