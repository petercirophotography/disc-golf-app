import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePuttingSessions, useCreatePuttingSession } from '../../hooks/useTrackerApi.js';
import SessionForm from '../../components/tracker/SessionForm.jsx';

function PuttingSessions() {
  const { data: sessions, loading, refetch } = usePuttingSessions();
  const { mutate: createSession } = useCreatePuttingSession();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data) => {
    await createSession(data);
    setShowForm(false);
    refetch();
  };

  if (loading) return <div className="tracker-loading">Loading putting sessions...</div>;

  const sorted = (sessions || [])
    .sort((a, b) => new Date(b.session_date) - new Date(a.session_date));

  return (
    <div>
      <div className="tracker-page-header">
        <h1>Putting Sessions</h1>
        <button
          className="tracker-btn tracker-btn-primary"
          onClick={() => setShowForm(true)}
        >
          + New
        </button>
      </div>

      {showForm && (
        <div className="tracker-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="tracker-modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Putting Session</h2>
            <SessionForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="tracker-empty">
          <p>No putting sessions yet</p>
          <p>Create your first putting session</p>
        </div>
      ) : (
        sorted.map((session) => (
          <Link
            key={session.id}
            to={`/tracker/putting/${session.id}`}
            className="session-list-item"
          >
            <div>
              <div className="session-list-date">
                {new Date(session.session_date).toLocaleDateString()}
              </div>
              <div className="session-list-location">{session.location}</div>
              {session.conditions && (
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                  {session.conditions}
                </div>
              )}
            </div>
            <span className="session-list-arrow">›</span>
          </Link>
        ))
      )}
    </div>
  );
}

export default PuttingSessions;
