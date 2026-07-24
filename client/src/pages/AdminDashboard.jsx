import { Fragment, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const TABS = ['stats', 'students', 'events', 'clubs', 'questions'];

const emptyEvent = { title: '', incharge_name: '', event_date: '', event_time: '', place: '', purpose: '', category: 'all', agenda: '', company: '', organizer: '', requires_team: false, team_size: 1 };
const emptyClub = { name: '', incharge_name: '', time_slot: '', location: '', theme: '', category: 'all', description: '', requires_team: false, team_size: 1 };
const emptyQuestion = { category: 'aptitude', difficulty: 'easy', question: '', answer: '' };

// Lets the admin type a time freely (e.g. "10 am", "10:30 PM", "14:00") instead
// of using the browser's native time-picker dropdown/spinner. Accepts 12-hour
// (with am/pm) or 24-hour input and normalizes it to "HH:MM" for storage.
// Returns null if the text doesn't look like a time at all.
function parseFlexibleTime(input) {
  if (!input) return null;
  const match = input.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3] ? match[3].toLowerCase() : null;

  if (minute < 0 || minute > 59) return null;

  if (period) {
    if (hour < 1 || hour > 12) return null;
    if (period === 'am') hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour < 0 || hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// Reverse of the above — turns a stored 24-hour time ("14:30" or "14:30:00")
// into a friendly 12-hour string ("2:30 PM") to pre-fill the text field when
// editing an existing event, so the admin sees something typeable/editable
// rather than raw 24-hour digits.
function formatTimeForDisplay(value) {
  if (!value) return '';
  const [h, m] = value.split(':');
  let hour = parseInt(h, 10);
  const minute = m || '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

function AdminDashboard() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionCategory, setQuestionCategory] = useState('aptitude');
  const [message, setMessage] = useState('');

  const [eventForm, setEventForm] = useState(emptyEvent);
  const [editingEventId, setEditingEventId] = useState(null);

  const [clubForm, setClubForm] = useState(emptyClub);
  const [editingClubId, setEditingClubId] = useState(null);

  const [questionForm, setQuestionForm] = useState(emptyQuestion);

  const [expandedEventId, setExpandedEventId] = useState(null);
  const [eventRegistrants, setEventRegistrants] = useState({});
  const [expandedClubId, setExpandedClubId] = useState(null);
  const [clubMembers, setClubMembers] = useState({});

  const toggleEventRegistrants = async (id) => {
    if (expandedEventId === id) { setExpandedEventId(null); return; }
    setExpandedEventId(id);
    if (!eventRegistrants[id]) {
      try {
        const res = await api.get(`/admin/events/${id}/registrations`);
        setEventRegistrants((prev) => ({ ...prev, [id]: res.data.students || [] }));
      } catch (err) {
        setEventRegistrants((prev) => ({ ...prev, [id]: [] }));
      }
    }
  };

  const toggleClubMembers = async (id) => {
    if (expandedClubId === id) { setExpandedClubId(null); return; }
    setExpandedClubId(id);
    if (!clubMembers[id]) {
      try {
        const res = await api.get(`/admin/clubs/${id}/members`);
        setClubMembers((prev) => ({ ...prev, [id]: res.data.students || [] }));
      } catch (err) {
        setClubMembers((prev) => ({ ...prev, [id]: [] }));
      }
    }
  };

  const loadAll = () => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(() => {});
    api.get('/admin/students').then((res) => setStudents(res.data.students || [])).catch(() => {});
    api.get('/events').then((res) => setEvents(res.data.events || [])).catch(() => {});
    api.get('/clubs').then((res) => setClubs(res.data.clubs || [])).catch(() => {});
  };

  const loadQuestions = (category) => {
    api.get(`/placement/questions/${category}`).then((res) => setQuestions(res.data.questions || [])).catch(() => {});
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (tab === 'questions') loadQuestions(questionCategory); }, [tab, questionCategory]);

  // ---------- EVENTS ----------
  const submitEvent = async (e) => {
    e.preventDefault();
    setMessage('');

    const normalizedTime = parseFlexibleTime(eventForm.event_time);
    if (!normalizedTime) {
      setMessage('Please enter a valid time, e.g. "10 am" or "2:30 PM".');
      return;
    }

    try {
      const payload = { ...eventForm, event_time: normalizedTime };
      if (editingEventId) {
        await api.put(`/events/${editingEventId}`, payload);
        setMessage('Event updated!');
      } else {
        await api.post('/events', payload);
        setMessage('Event created!');
      }
      setEventForm(emptyEvent);
      setEditingEventId(null);
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save event');
    }
  };

  const editEvent = (ev) => {
    setEditingEventId(ev.id);
    setEventForm({
      title: ev.title || '', incharge_name: ev.incharge_name || '',
      event_date: ev.event_date ? new Date(ev.event_date).toISOString().slice(0, 10) : '',
      event_time: ev.event_time ? formatTimeForDisplay(ev.event_time.slice(0, 5)) : '',
      place: ev.place || '', purpose: ev.purpose || '', category: ev.category || 'all',
      agenda: ev.agenda || '', company: ev.company || '', organizer: ev.organizer || '',
      requires_team: !!ev.requires_team, team_size: ev.team_size || 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditEvent = () => { setEditingEventId(null); setEventForm(emptyEvent); };

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/events/${id}`);
      loadAll();
    } catch (err) {
      setMessage('Failed to delete event');
    }
  };

  // ---------- CLUBS ----------
  const submitClub = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingClubId) {
        await api.put(`/clubs/${editingClubId}`, clubForm);
        setMessage('Club updated!');
      } else {
        await api.post('/clubs', clubForm);
        setMessage('Club created!');
      }
      setClubForm(emptyClub);
      setEditingClubId(null);
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save club');
    }
  };

  const editClub = (club) => {
    setEditingClubId(club.id);
    setClubForm({
      name: club.name || '', incharge_name: club.incharge_name || '', time_slot: club.time_slot || '',
      location: club.location || '', theme: club.theme || '', category: club.category || 'all',
      description: club.description || '', requires_team: !!club.requires_team, team_size: club.team_size || 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditClub = () => { setEditingClubId(null); setClubForm(emptyClub); };

  const deleteClub = async (id) => {
    try {
      await api.delete(`/clubs/${id}`);
      loadAll();
    } catch (err) {
      setMessage('Failed to delete club');
    }
  };

  // ---------- QUESTIONS ----------
  const submitQuestion = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/placement/questions', questionForm);
      setMessage('Question added!');
      setQuestionForm({ ...emptyQuestion, category: questionForm.category });
      loadQuestions(questionCategory);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to add question');
    }
  };

  const deleteQuestion = async (id) => {
    try {
      await api.delete(`/placement/questions/${id}`);
      loadQuestions(questionCategory);
    } catch (err) {
      setMessage('Failed to delete question');
    }
  };

  const renderRegistrantPanel = (list) => {
    if (!list) return <p style={{ padding: 12, color: 'var(--text-muted)' }}>Loading...</p>;
    if (list.length === 0) return <p style={{ padding: 12, color: 'var(--text-muted)' }}>No registrations yet.</p>;

    return (
      <div style={{ padding: '4px 12px 16px' }}>
        {list.map((r, idx) => (
          <div key={idx} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)', padding: '10px 0' }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>
              {r.full_name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({r.email})</span>
              {r.team_name && <span style={{ marginLeft: 8, color: 'var(--accent-dark)' }}>Team: {r.team_name}</span>}
            </p>
            {Array.isArray(r.members) && r.members.length > 0 ? (
              <table className="table" style={{ marginTop: 6 }}>
                <thead><tr><th>Name</th><th>Branch</th><th>Year</th><th>Section</th></tr></thead>
                <tbody>
                  {r.members.map((m, mi) => (
                    <tr key={mi}>
                      <td>{m.name}</td>
                      <td>{m.branch || '—'}</td>
                      <td>{m.year}</td>
                      <td>{m.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {r.branch} • {r.year} • Section {r.section}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Admin Dashboard</h2>

        <div className="tab-bar">
          {TABS.map((t) => (
            <span key={t} className={`chip ${tab === t ? 'selected' : ''}`} onClick={() => setTab(t)}>
              {t}
            </span>
          ))}
        </div>

        {message && <p className="success-text" style={{ marginBottom: 16 }}>{message}</p>}

        {tab === 'stats' && stats && (
          <div className="grid-3">
            <div className="card"><h3>{stats.students}</h3><p>Students</p></div>
            <div className="card"><h3>{stats.events}</h3><p>Events</p></div>
            <div className="card"><h3>{stats.clubs}</h3><p>Clubs</p></div>
          </div>
        )}

        {tab === 'students' && (
          <div>
            <div className="field" style={{ maxWidth: 320, marginBottom: 16 }}>
              <input
                placeholder="Search by name, email, or branch..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div className="students-table-wrap card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: 8 }}>Name</th>
                    <th style={{ padding: 8 }}>Email</th>
                    <th style={{ padding: 8 }}>Branch</th>
                    <th style={{ padding: 8 }}>Year</th>
                    <th style={{ padding: 8 }}>Section</th>
                    <th style={{ padding: 8 }}>Events Registered</th>
                    <th style={{ padding: 8 }}>Clubs Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter((s) => {
                      const q = studentSearch.toLowerCase();
                      if (!q) return true;
                      return (
                        s.full_name?.toLowerCase().includes(q) ||
                        s.email?.toLowerCase().includes(q) ||
                        s.branch?.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 8 }}>{s.full_name || '—'}</td>
                        <td style={{ padding: 8 }}>{s.email}</td>
                        <td style={{ padding: 8 }}>{s.branch || '—'}</td>
                        <td style={{ padding: 8 }}>{s.year || '—'}</td>
                        <td style={{ padding: 8 }}>{s.section || '—'}</td>
                        <td style={{ padding: 8 }}>{s.events.length ? s.events.join(', ') : '—'}</td>
                        <td style={{ padding: 8 }}>{s.clubs.length ? s.clubs.join(', ') : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!students.length && <p style={{ color: 'var(--text-muted)', padding: 8 }}>No students have signed up yet.</p>}
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div>
            <form onSubmit={submitEvent} className="card" style={{ marginBottom: 24 }}>
              <h4>{editingEventId ? 'Edit Event' : 'Add New Event'}</h4>
              <div className="grid-2">
                <div className="field"><label>Title</label><input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required /></div>
                <div className="field"><label>In-charge</label><input value={eventForm.incharge_name} onChange={(e) => setEventForm({ ...eventForm, incharge_name: e.target.value })} /></div>
                <div className="field"><label>Date</label><input type="date" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} required /></div>
                <div className="field"><label>Time</label><input type="text" placeholder="e.g. 10 am or 2:30 PM" value={eventForm.event_time} onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })} required /></div>
                <div className="field"><label>Place</label><input value={eventForm.place} onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })} /></div>
                <div className="field">
                  <label>Category</label>
                  <select value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>
                    <option value="all">all</option><option value="technical">technical</option><option value="cultural">cultural</option>
                  </select>
                </div>
                <div className="field"><label>Company (optional)</label><input value={eventForm.company} onChange={(e) => setEventForm({ ...eventForm, company: e.target.value })} /></div>
                <div className="field"><label>Organizer</label><input value={eventForm.organizer} onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })} /></div>
                <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
                  <input
                    type="checkbox"
                    id="event-requires-team"
                    style={{ width: 'auto' }}
                    checked={eventForm.requires_team}
                    onChange={(e) => setEventForm({ ...eventForm, requires_team: e.target.checked })}
                  />
                  <label htmlFor="event-requires-team" style={{ margin: 0 }}>Requires team/group registration</label>
                </div>
                {eventForm.requires_team && (
                  <div className="field">
                    <label>Team size (number of members)</label>
                    <input
                      type="number"
                      min="1"
                      value={eventForm.team_size}
                      onChange={(e) => setEventForm({ ...eventForm, team_size: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                )}
              </div>
              <div className="field"><label>Purpose</label><textarea rows={2} value={eventForm.purpose} onChange={(e) => setEventForm({ ...eventForm, purpose: e.target.value })} /></div>
              <div className="field"><label>Agenda</label><textarea rows={2} value={eventForm.agenda} onChange={(e) => setEventForm({ ...eventForm, agenda: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary">{editingEventId ? 'Save Changes' : 'Create Event'}</button>
                {editingEventId && <button type="button" className="btn-secondary" onClick={cancelEditEvent}>Cancel</button>}
              </div>
            </form>

            <h4>All Events ({events.length})</h4>
            <table className="table">
              <thead><tr><th>Title</th><th>Date</th><th>Category</th><th>Place</th><th>Team</th><th></th></tr></thead>
              <tbody>
                {events.map((ev) => (
                  <Fragment key={ev.id}>
                    <tr>
                      <td>{ev.title}</td>
                      <td>{new Date(ev.event_date).toLocaleDateString()}</td>
                      <td><span className={`badge badge-${ev.category}`}>{ev.category}</span></td>
                      <td>{ev.place}</td>
                      <td>{ev.requires_team ? `Team of ${ev.team_size}` : '—'}</td>
                      <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => toggleEventRegistrants(ev.id)}>
                          {expandedEventId === ev.id ? 'Hide' : 'View'} Registrants
                        </button>
                        <button className="btn-secondary" onClick={() => editEvent(ev)}>Edit</button>
                        <button className="btn-danger" onClick={() => deleteEvent(ev.id)}>Delete</button>
                      </td>
                    </tr>
                    {expandedEventId === ev.id && (
                      <tr>
                        <td colSpan={6} style={{ background: 'var(--surface-alt)', padding: 0 }}>
                          {renderRegistrantPanel(eventRegistrants[ev.id])}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'clubs' && (
          <div>
            <form onSubmit={submitClub} className="card" style={{ marginBottom: 24 }}>
              <h4>{editingClubId ? 'Edit Club' : 'Add New Club'}</h4>
              <div className="grid-2">
                <div className="field"><label>Name</label><input value={clubForm.name} onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })} required /></div>
                <div className="field"><label>In-charge</label><input value={clubForm.incharge_name} onChange={(e) => setClubForm({ ...clubForm, incharge_name: e.target.value })} /></div>
                <div className="field"><label>Time Slot</label><input value={clubForm.time_slot} onChange={(e) => setClubForm({ ...clubForm, time_slot: e.target.value })} /></div>
                <div className="field"><label>Location</label><input value={clubForm.location} onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })} /></div>
                <div className="field"><label>Theme</label><input value={clubForm.theme} onChange={(e) => setClubForm({ ...clubForm, theme: e.target.value })} /></div>
                <div className="field">
                  <label>Category</label>
                  <select value={clubForm.category} onChange={(e) => setClubForm({ ...clubForm, category: e.target.value })}>
                    <option value="all">all</option><option value="technical">technical</option><option value="cultural">cultural</option>
                  </select>
                </div>
                <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
                  <input
                    type="checkbox"
                    id="club-requires-team"
                    style={{ width: 'auto' }}
                    checked={clubForm.requires_team}
                    onChange={(e) => setClubForm({ ...clubForm, requires_team: e.target.checked })}
                  />
                  <label htmlFor="club-requires-team" style={{ margin: 0 }}>Requires team/group registration</label>
                </div>
                {clubForm.requires_team && (
                  <div className="field">
                    <label>Team size (number of members)</label>
                    <input
                      type="number"
                      min="1"
                      value={clubForm.team_size}
                      onChange={(e) => setClubForm({ ...clubForm, team_size: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                )}
              </div>
              <div className="field"><label>Description</label><textarea rows={2} value={clubForm.description} onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary">{editingClubId ? 'Save Changes' : 'Create Club'}</button>
                {editingClubId && <button type="button" className="btn-secondary" onClick={cancelEditClub}>Cancel</button>}
              </div>
            </form>

            <h4>All Clubs ({clubs.length})</h4>
            <table className="table">
              <thead><tr><th>Name</th><th>Category</th><th>Location</th><th>Time Slot</th><th>Team</th><th></th></tr></thead>
              <tbody>
                {clubs.map((c) => (
                  <Fragment key={c.id}>
                    <tr>
                      <td>{c.name}</td>
                      <td><span className={`badge badge-${c.category}`}>{c.category}</span></td>
                      <td>{c.location}</td>
                      <td>{c.time_slot}</td>
                      <td>{c.requires_team ? `Team of ${c.team_size}` : '—'}</td>
                      <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => toggleClubMembers(c.id)}>
                          {expandedClubId === c.id ? 'Hide' : 'View'} Members
                        </button>
                        <button className="btn-secondary" onClick={() => editClub(c)}>Edit</button>
                        <button className="btn-danger" onClick={() => deleteClub(c.id)}>Delete</button>
                      </td>
                    </tr>
                    {expandedClubId === c.id && (
                      <tr>
                        <td colSpan={6} style={{ background: 'var(--surface-alt)', padding: 0 }}>
                          {renderRegistrantPanel(clubMembers[c.id])}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'questions' && (
          <div>
            <form onSubmit={submitQuestion} className="card" style={{ marginBottom: 24 }}>
              <h4>Add Practice Question</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Students see only the question first, then click "Show Answer" to reveal it — no multiple choice.
              </p>
              <div className="grid-2">
                <div className="field">
                  <label>Category</label>
                  <select value={questionForm.category} onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}>
                    <option value="aptitude">aptitude</option>
                    <option value="verbal">verbal</option>
                    <option value="coding">coding</option>
                  </select>
                </div>
                <div className="field">
                  <label>Difficulty</label>
                  <select value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}>
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                  </select>
                </div>
              </div>
              <div className="field"><label>Question</label><textarea rows={2} value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} required /></div>
              <div className="field"><label>Answer</label><textarea rows={3} value={questionForm.answer} onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })} required /></div>
              <button className="btn-primary">Add Question</button>
            </form>

            <div className="tab-bar">
              {['aptitude', 'verbal', 'coding'].map((c) => (
                <span key={c} className={`chip ${questionCategory === c ? 'selected' : ''}`} onClick={() => setQuestionCategory(c)}>
                  {c}
                </span>
              ))}
            </div>

            <h4>{questionCategory} questions ({questions.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map((q) => (
                <div key={q.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <span className="badge badge-technical">{q.difficulty}</span>
                    <p style={{ marginTop: 8, fontWeight: 600 }}>{q.question}</p>
                    <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>{q.answer}</p>
                  </div>
                  <button className="btn-danger" style={{ height: 'fit-content' }} onClick={() => deleteQuestion(q.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default AdminDashboard;
