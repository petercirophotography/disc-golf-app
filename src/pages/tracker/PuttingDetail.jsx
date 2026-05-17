import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePuttingSessionPutts, useCreatePutts, useDiscs, useDeletePutt } from '../../hooks/useTrackerApi.js';
import PuttEntry from '../../components/tracker/PuttEntry.jsx';

function PuttingDetail() {
  const { id } = useParams();
  const { data: putts, loading, refetch } = usePuttingSessionPutts(id);
  const { mutate: createPutts } = useCreatePutts();
  const { mutate: deletePutt } = useDeletePutt();
  const { data: discs } = useDiscs();

  const putters = (discs || []).filter((d) => d.disc_type === 'Putter');

  const handleDeletePutt = async (putt) => {
    if (confirm(`Delete putt at ${putt.distance_feet} ft?`)) {
      await deletePutt(putt.id);
      refetch();
    }
  };

  if (loading) return <div className="tracker-loading">Loading putting session...</div>;

  const handleSavePutt = async (puttData) => {
    await createPutts(id, [puttData]);
    refetch();
  };

  // Compute C1/C2 stats
  const c1Putts = (putts || []).filter((p) => (p.circle === 'C1') || (p.distance_feet < 33));
  const c2Putts = (putts || []).filter((p) => (p.circle === 'C2') || (p.distance_feet >= 33));

  const c1Attempts = c1Putts.reduce((sum, p) => sum + p.attempts, 0);
  const c1Makes = c1Putts.reduce((sum, p) => sum + p.makes, 0);
  const c1Pct = c1Attempts > 0 ? Math.round((c1Makes / c1Attempts) * 100) : 0;

  const c2Attempts = c2Putts.reduce((sum, p) => sum + p.attempts, 0);
  const c2Makes = c2Putts.reduce((sum, p) => sum + p.makes, 0);
  const c2Pct = c2Attempts > 0 ? Math.round((c2Makes / c2Attempts) * 100) : 0;

  return (
    <div>
      <Link to="/tracker/putting" className="tracker-back-link">← Putting Sessions</Link>

      <div className="tracker-page-header">
        <h1>Putting Detail</h1>
      </div>

      {/* C1/C2 Summary */}
      <div className="dashboard-stats" style={{ marginBottom: '16px' }}>
        <div className="dashboard-stat">
          <div className="dashboard-stat-value" style={{ color: '#166534' }}>{c1Pct}%</div>
          <div className="dashboard-stat-label">C1 ({c1Makes}/{c1Attempts})</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-value" style={{ color: '#1e40af' }}>{c2Pct}%</div>
          <div className="dashboard-stat-label">C2 ({c2Makes}/{c2Attempts})</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-value">{(putts || []).length}</div>
          <div className="dashboard-stat-label">Entries</div>
        </div>
      </div>

      {/* Add putt */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>Add Putt</h3>
        <PuttEntry onSave={handleSavePutt} putters={putters} />
      </div>

      {/* Putt list */}
      {(putts || []).length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>Recorded Putts</h3>
          {(putts || [])
            .sort((a, b) => a.distance_feet - b.distance_feet)
            .map((putt) => {
              const circle = putt.circle || (putt.distance_feet < 33 ? 'C1' : 'C2');
              const pct = putt.attempts > 0 ? Math.round((putt.makes / putt.attempts) * 100) : 0;
              return (
                <div key={putt.id} className="tracker-card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`putt-circle-badge putt-circle-badge-${circle}`}>{circle}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                      {putt.distance_feet} ft
                      {putt.disc_id && (() => {
                        const disc = (discs || []).find((d) => d.id === putt.disc_id);
                        return disc ? <span style={{ fontWeight: '400', color: '#888', marginLeft: '8px' }}>({disc.name})</span> : null;
                      })()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {putt.makes}/{putt.attempts} — {pct}%
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePutt(putt)}
                    className="tracker-btn tracker-btn-danger"
                    style={{ padding: '4px 8px', fontSize: '11px', minWidth: '32px', minHeight: '32px' }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default PuttingDetail;
