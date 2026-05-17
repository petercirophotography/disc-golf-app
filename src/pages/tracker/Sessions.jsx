import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessions, useCreateSession, useDeleteSession } from '../../hooks/useTrackerApi.js';
import SessionForm from '../../components/tracker/SessionForm.jsx';

function Sessions() {
  const { data: sessions, loading, refetch } = useSessions();
  const { mutate: createSession } = useCreateSession();
  const { mutate: deleteSession } = useDeleteSession();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data) => {
    await createSession(data);
    setShowForm(false);
    refetch();
  };

  const handleDelete = async (e, session) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete session from ${new Date(session.session_date).toLocaleDateString()}?`)) {
      await deleteSession(session.id);
      refetch();
    }
  };

  if (loading) return <div className="tracker-loading">Loading sessions...</div>;

  const sorted = (sessions || [])
    .sort((a, b) => new Date(b.session_date) - new Date(a.session_date));

  return (
    <div>
      <div className="tracker-page-header">
        <h1>Throwing Sessions</h1>
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
            <h2>New Session</h2>
            <SessionForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="tracker-empty">
          <p>No sessions yet</p>
          <p>Create your first throwing session</p>
        </div>
      ) : (
        sorted.map((session) => (
          <Link
            key={session.id}
            to={`/tracker/sessions/${session.id}`}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={(e) => handleDelete(e, session)}
                className="tracker-btn tracker-btn-danger"
                style={{ padding: '4px 8px', fontSize: '11px', minWidth: '32px', minHeight: '32px' }}
              >
                🗑️
              </button>
              <span className="session-list-arrow">›</span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

export default Sessions;
