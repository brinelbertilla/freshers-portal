import { useEffect, useState } from 'react';
import api from '../api/axios';

// Mirrors server/utils/timetableGenerator.js PERIOD_TIMES — kept here too so
// the client can render break/lunch columns without an extra API round-trip.
const COLUMNS = [
  { period_no: 1, label: '1st', time: '9:15-10:05' },
  { period_no: 2, label: '2nd', time: '10:05-10:55' },
  { type: 'break', label: 'Break', time: '10:55-11:05' },
  { period_no: 3, label: '3rd', time: '11:05-11:55' },
  { period_no: 4, label: '4th', time: '11:55-12:45' },
  { type: 'lunch', label: 'Lunch', time: '12:45-1:25' },
  { period_no: 5, label: '5th', time: '1:25-2:15' },
  { period_no: 6, label: '6th', time: '2:15-3:05' },
  { type: 'break', label: 'Break', time: '3:05-3:15' },
  { period_no: 7, label: '7th', time: '3:15-4:00' },
  { period_no: 8, label: '8th', time: '4:00-4:45' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function Timetable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayOnly, setTodayOnly] = useState(true);

  useEffect(() => {
    api.get('/timetable')
      .then((res) => setRows(res.data.timetable || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading your timetable...</p>;
  if (!rows.length) {
    return (
      <p style={{ color: 'var(--text-muted)' }}>
        No timetable published for your branch/year/section yet. Check back after your department uploads it.
      </p>
    );
  }

  const byDayPeriod = {};
  rows.forEach((r) => {
    byDayPeriod[`${r.day}-${r.period_no}`] = r;
  });

  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  const todayName = DAYS[jsDay - 1]; // undefined on weekends
  const daysToShow = todayOnly && todayName ? [todayName] : DAYS;

  return (
    <div>
      {todayName && (
        <div style={{ marginBottom: 12 }}>
          <span
            className={`chip ${todayOnly ? 'selected' : ''}`}
            onClick={() => setTodayOnly(true)}
            style={{ marginRight: 8 }}
          >
            Today
          </span>
          <span
            className={`chip ${!todayOnly ? 'selected' : ''}`}
            onClick={() => setTodayOnly(false)}
          >
            Full Week
          </span>
        </div>
      )}

      <div className="timetable-wrap">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              {COLUMNS.map((c, i) => (
                <th key={i}>{c.label}<br /><span style={{ fontWeight: 400, fontSize: 10 }}>{c.time}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysToShow.map((day) => (
              <tr key={day}>
                <td className="day-cell">{day}</td>
                {COLUMNS.map((c, i) => {
                  if (c.type === 'break') return <td key={i} className="break-cell">Break</td>;
                  if (c.type === 'lunch') return <td key={i} className="break-cell">Lunch</td>;
                  const slot = byDayPeriod[`${day}-${c.period_no}`];
                  if (!slot) return <td key={i}>-</td>;
                  return (
                    <td key={i} className={slot.is_lab ? 'lab-cell' : ''}>
                      <div className="timetable-subject-code">{slot.subject_code}</div>
                      <div className="timetable-faculty">{slot.faculty_name}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Timetable;
