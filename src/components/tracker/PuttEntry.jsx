import React, { useState } from 'react';
import NumericInput from './NumericInput.jsx';

function PuttEntry({ onSave, putters }) {
  const [distance, setDistance] = useState('');
  const [selectedDiscId, setSelectedDiscId] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [makes, setMakes] = useState(0);
  const [error, setError] = useState('');

  const distanceNum = parseFloat(distance);
  const circle = !isNaN(distanceNum) && distanceNum > 0
    ? (distanceNum < 33 ? 'C1' : 'C2')
    : null;

  const handleMake = () => {
    setAttempts((a) => a + 1);
    setMakes((m) => m + 1);
  };

  const handleMiss = () => {
    setAttempts((a) => a + 1);
  };

  const handleSave = () => {
    setError('');

    if (!distance || isNaN(distanceNum) || distanceNum <= 0) {
      setError('Enter a valid distance');
      return;
    }

    if (distanceNum > 66) {
      setError('Distance must be 66 feet or less');
      return;
    }

    if (attempts === 0) {
      setError('Record at least one attempt');
      return;
    }

    if (makes > attempts) {
      setError('Makes cannot exceed attempts');
      return;
    }

    onSave({
      distance_feet: distanceNum,
      attempts,
      makes,
      disc_id: selectedDiscId || null,
    });

    // Reset for next entry
    setDistance('');
    setAttempts(0);
    setMakes(0);
  };

  const handleReset = () => {
    setAttempts(0);
    setMakes(0);
    setError('');
  };

  const percentage = attempts > 0 ? Math.round((makes / attempts) * 100) : 0;

  return (
    <div className="putt-entry">
      {putters && putters.length > 0 && (
        <div className="tracker-form-group" style={{ marginBottom: '12px' }}>
          <label>Putter</label>
          <select
            value={selectedDiscId}
            onChange={(e) => setSelectedDiscId(e.target.value)}
            style={{ minHeight: '44px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }}
          >
            <option value="">Any putter</option>
            {putters.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <NumericInput
            value={distance}
            onChange={setDistance}
            placeholder="Distance (ft)"
            label="Distance"
            min={1}
            max={66}
          />
        </div>
        {circle && (
          <span className={`putt-circle-badge putt-circle-badge-${circle}`}>
            {circle}
          </span>
        )}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>
          {makes} / {attempts}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {percentage}%
        </div>
      </div>

      <div className="putt-entry-buttons">
        <button
          type="button"
          className="tracker-btn tracker-btn-success tracker-btn-large"
          style={{ flex: 1 }}
          onClick={handleMake}
        >
          ✓ Make
        </button>
        <button
          type="button"
          className="tracker-btn tracker-btn-danger tracker-btn-large"
          style={{ flex: 1 }}
          onClick={handleMiss}
        >
          ✗ Miss
        </button>
      </div>

      {error && <div className="tracker-form-error" style={{ marginTop: '8px', textAlign: 'center' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          className="tracker-btn tracker-btn-primary"
          style={{ flex: 1 }}
          onClick={handleSave}
        >
          Save Putt
        </button>
        <button
          type="button"
          className="tracker-btn tracker-btn-secondary"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default PuttEntry;
