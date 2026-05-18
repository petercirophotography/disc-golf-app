import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useSessionThrows,
  useCreateThrows,
  useUpdateThrow,
  useDeleteThrow,
  useDiscs,
} from '../../hooks/useTrackerApi.js';
import ThrowEntry from '../../components/tracker/ThrowEntry.jsx';

function SessionDetail() {
  const { id } = useParams();
  const { data: throws, loading: throwsLoading, refetch } = useSessionThrows(id);
  const { data: discs, loading: discsLoading } = useDiscs();
  const { mutate: createThrows } = useCreateThrows();
  const { mutate: updateThrow } = useUpdateThrow();
  const { mutate: deleteThrow } = useDeleteThrow();
  const [selectedDiscId, setSelectedDiscId] = useState('');
  const [showAddThrows, setShowAddThrows] = useState(false);
  const [editingThrow, setEditingThrow] = useState(null);

  const loading = throwsLoading || discsLoading;
  if (loading) return <div className="tracker-loading">Loading session...</div>;

  const inBagDiscs = (discs || []).filter((d) => d.in_bag);

  const throwsByDisc = {};
  (throws || []).forEach((t) => {
    if (!throwsByDisc[t.disc_id]) throwsByDisc[t.disc_id] = [];
    throwsByDisc[t.disc_id].push(t);
  });

  const handleSaveThrows = async (throwsData) => {
    await createThrows(id, throwsData);
    setSelectedDiscId('');
    refetch();
  };

  const handleToggleFlag = async (throwItem, flag) => {
    const newFlag = throwItem.flag === flag ? null : flag;
    await updateThrow(throwItem.id, { flag: newFlag });
    refetch();
  };

  const handleDeleteThrow = async (throwItem) => {
    if (confirm(`Delete this throw (${throwItem.distance_yards} yds)?`)) {
      await deleteThrow(throwItem.id);
      refetch();
    }
  };

  const handleEditThrow = async (throwItem, newYards) => {
    const yards = parseFloat(newYards);
    if (isNaN(yards) || yards < 0) return;
    await updateThrow(throwItem.id, { distance_yards: yards });
    setEditingThrow(null);
    refetch();
  };

  const selectedDisc = inBagDiscs.find((d) => d.id === selectedDiscId);
  const existingThrowsForDisc = selectedDiscId
    ? (throws || []).filter((t) => t.disc_id === selectedDiscId).sort((a, b) => a.throw_number - b.throw_number)
    : [];

  return (
    <div>
      <Link to="/tracker/sessions" className="tracker-back-link">← Sessions</Link>

      <div className="tracker-page-header">
        <h1>Session Detail</h1>
        {!showAddThrows && (
          <button type="button" className="tracker-btn tracker-btn-primary" onClick={() => setShowAddThrows(true)}>
            + Add
          </button>
        )}
      </div>

      {/* Add throws - at top */}
      {showAddThrows && (
        <div style={{ marginBottom: '16px', background: '#f0f7ff', padding: '12px', borderRadius: '12px' }}>
          <div className="tracker-form-group" style={{ marginBottom: '8px' }}>
            <label>Select Disc</label>
            <select
              value={selectedDiscId}
              onChange={(e) => setSelectedDiscId(e.target.value)}
              style={{ minHeight: '44px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', width: '100%' }}
            >
              <option value="">Choose a disc...</option>
              {['VOS', 'OS', 'ST', 'US', 'VUS'].map((stab) => {
                const group = inBagDiscs
                  .filter((d) => d.stability === stab && d.disc_type !== 'Putter')
                  .sort((a, b) => (b.speed || 0) - (a.speed || 0));
                if (group.length === 0) return null;
                return (
                  <optgroup key={stab} label={stab}>
                    {group.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.disc_type} · {d.speed || '?'})</option>
                    ))}
                  </optgroup>
                );
              })}
              {inBagDiscs.filter((d) => d.disc_type === 'Putter').length > 0 && (
                <optgroup label="Putters">
                  {inBagDiscs
                    .filter((d) => d.disc_type === 'Putter')
                    .sort((a, b) => (b.speed || 0) - (a.speed || 0))
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.speed || '?'})</option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {selectedDisc && (
            <ThrowEntry
              disc={selectedDisc}
              existingThrows={existingThrowsForDisc}
              onSave={handleSaveThrows}
            />
          )}

          <button
            type="button"
            className="tracker-btn tracker-btn-secondary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => { setShowAddThrows(false); setSelectedDiscId(''); }}
          >
            Done Adding
          </button>
        </div>
      )}

      {/* Recorded throws grouped by disc - sorted by highest average */}
      {Object.keys(throwsByDisc).length === 0 ? (
        <div className="tracker-empty">
          <p>No throws recorded yet</p>
        </div>
      ) : (
        Object.entries(throwsByDisc)
          .sort(([, aThrows], [, bThrows]) => {
            const aUnflagged = aThrows.filter((t) => !t.flag);
            const bUnflagged = bThrows.filter((t) => !t.flag);
            const aAvg = aUnflagged.length > 0 ? aUnflagged.reduce((sum, t) => sum + (parseFloat(t.distance_yards) * 3), 0) / aUnflagged.length : 0;
            const bAvg = bUnflagged.length > 0 ? bUnflagged.reduce((sum, t) => sum + (parseFloat(t.distance_yards) * 3), 0) / bUnflagged.length : 0;
            return bAvg - aAvg;
          })
          .map(([discId, discThrows]) => {
            const disc = (discs || []).find((d) => d.id === discId);
            const sorted = discThrows.sort((a, b) => a.throw_number - b.throw_number);
            const unflagged = sorted.filter((t) => !t.flag);
            const avgFeet = unflagged.length > 0
              ? Math.round(unflagged.reduce((sum, t) => sum + (parseFloat(t.distance_yards) * 3), 0) / unflagged.length)
              : 0;
            const maxFeet = unflagged.length > 0
              ? Math.round(Math.max(...unflagged.map((t) => parseFloat(t.distance_yards) * 3)))
              : 0;

            return (
              <div key={discId} className="tracker-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0 }}>
                    {disc?.name || 'Unknown'}
                    {disc?.stability && (
                      <span className={`stability-badge stability-badge-${disc.stability}`} style={{ marginLeft: '8px' }}>
                        {disc.stability}
                      </span>
                    )}
                  </h3>
                  <div style={{ textAlign: 'right', fontSize: '13px' }}>
                    <div><strong>{avgFeet}</strong> ft avg</div>
                    <div style={{ color: '#888' }}>{maxFeet} ft max</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {sorted.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '6px 10px',
                        background: t.flag ? '#fef3c7' : '#f3f4f6',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    >
                      {editingThrow === t.id ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          defaultValue={t.distance_yards}
                          autoFocus
                          style={{ width: '50px', minHeight: '28px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleEditThrow(t, e.target.value); if (e.key === 'Escape') setEditingThrow(null); }}
                          onBlur={(e) => handleEditThrow(t, e.target.value)}
                        />
                      ) : (
                        <span onClick={() => setEditingThrow(t.id)} style={{ cursor: 'pointer' }}>
                          <strong>{t.distance_yards}</strong>
                          <span style={{ color: '#888', marginLeft: '4px' }}>{Math.round(parseFloat(t.distance_yards) * 3)}ft</span>
                          {t.flag && <span style={{ color: '#92400e', marginLeft: '4px', fontSize: '10px' }}>{t.flag[0].toUpperCase()}</span>}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteThrow(t)}
                        style={{ marginLeft: '6px', fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
      )}
    </div>
  );
}

export default SessionDetail;
