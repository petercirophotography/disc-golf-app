import React from 'react';
import { Link } from 'react-router-dom';
import { useSessions, useDiscs, usePuttingSessions } from '../../hooks/useTrackerApi.js';

function Dashboard() {
  const { data: sessions, loading: sessionsLoading } = useSessions();
  const { data: discs, loading: discsLoading } = useDiscs();
  const { data: puttingSessions, loading: puttingLoading } = usePuttingSessions();

  const loading = sessionsLoading || discsLoading || puttingLoading;

  const recentSessions = (sessions || [])
    .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
    .slice(0, 3);

  const recentPutting = (puttingSessions || [])
    .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
    .slice(0, 3);

  const totalSessions = (sessions || []).length + (puttingSessions || []).length;
  const inBagCount = (discs || []).filter((d) => d.in_bag).length;

  return (
    <div>
      <div className="tracker-page-header">
        <h1>Throw Tracker</h1>
      </div>

      {loading ? (
        <div className="tracker-loading">Loading...</div>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">{totalSessions}</div>
              <div className="dashboard-stat-label">Sessions</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">{inBagCount}</div>
              <div className="dashboard-stat-label">Discs in Bag</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">{(discs || []).length}</div>
              <div className="dashboard-stat-label">Total Discs</div>
            </div>
          </div>

          {recentSessions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>Recent Throwing Sessions</h3>
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  to={`/tracker/sessions/${s.id}`}
                  className="session-list-item"
                >
                  <div>
                    <div className="session-list-date">{new Date(s.session_date).toLocaleDateString()}</div>
                    <div className="session-list-location">{s.location}</div>
                  </div>
                  <span className="session-list-arrow">›</span>
                </Link>
              ))}
            </div>
          )}

          {recentPutting.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>Recent Putting Sessions</h3>
              {recentPutting.map((s) => (
                <Link
                  key={s.id}
                  to={`/tracker/putting/${s.id}`}
                  className="session-list-item"
                >
                  <div>
                    <div className="session-list-date">{new Date(s.session_date).toLocaleDateString()}</div>
                    <div className="session-list-location">{s.location}</div>
                  </div>
                  <span className="session-list-arrow">›</span>
                </Link>
              ))}
            </div>
          )}

          <div className="dashboard-nav-cards">
            <Link to="/tracker/sessions" className="dashboard-nav-card">
              <span>🎯 Throwing</span>
            </Link>
            <Link to="/tracker/putting" className="dashboard-nav-card">
              <span>🥏 Putting</span>
            </Link>
            <Link to="/tracker/discs" className="dashboard-nav-card">
              <span>💿 Discs</span>
            </Link>
            <Link to="/tracker/analytics" className="dashboard-nav-card">
              <span>📊 Analytics</span>
            </Link>
            <Link to="/tracker/import" className="dashboard-nav-card">
              <span>📥 Import</span>
            </Link>
            <Link to="/tracker/export" className="dashboard-nav-card">
              <span>📤 Export</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
