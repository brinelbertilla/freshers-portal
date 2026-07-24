import { useState } from 'react';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCH_OPTIONS = ['AIDS', 'AIML', 'CIVIL', 'CSBS', 'CSE', 'ECE', 'EEE', 'EIE', 'ICE', 'MECH'];

const emptyMember = () => ({ name: '', branch: '', section: '', year: '' });

/**
 * A small "Google Form"-style modal collected inline in the portal itself.
 * Shown for EVERY event/club registration — not just team ones — so admins
 * always know exactly who registered, which branch/course they're in, their
 * year, and their section. Team events additionally ask for a team name and
 * one row per member; solo events just ask for the one registrant's details.
 */
function TeamRegistrationModal({ title, teamSize, requiresTeam, onCancel, onSubmit, submitting, error }) {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(Array.from({ length: teamSize || 1 }, emptyMember));

  const updateMember = (idx, field, value) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ team_name: requiresTeam ? teamName : null, members });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 4 }}>{requiresTeam ? 'Team Registration' : 'Registration Details'}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {requiresTeam
            ? `"${title}" requires a team of ${teamSize}. Please fill in your team details below.`
            : `Please fill in your details to register for "${title}".`}
        </p>

        <form onSubmit={handleSubmit}>
          {requiresTeam && (
            <div className="field">
              <label>Team / Group Name</label>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required placeholder="e.g. Code Crusaders" />
            </div>
          )}

          {members.map((m, idx) => (
            <div key={idx} className="team-member-row">
              {requiresTeam && <h4 style={{ fontSize: 14, marginBottom: 10 }}>Member {idx + 1}</h4>}
              <div className="grid-3">
                <div className="field">
                  <label>Full Name</label>
                  <input value={m.name} onChange={(e) => updateMember(idx, 'name', e.target.value)} required />
                </div>
                <div className="field">
                  <label>Branch / Course</label>
                  <select value={m.branch} onChange={(e) => updateMember(idx, 'branch', e.target.value)} required>
                    <option value="" disabled>Select branch</option>
                    {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Year</label>
                  <select value={m.year} onChange={(e) => updateMember(idx, 'year', e.target.value)} required>
                    <option value="" disabled>Select year</option>
                    {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Section</label>
                  <input value={m.section} onChange={(e) => updateMember(idx, 'section', e.target.value)} required placeholder="e.g. A" />
                </div>
              </div>
            </div>
          ))}

          {error && <p className="error-text" style={{ marginBottom: 8 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Registration'}</button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeamRegistrationModal;
