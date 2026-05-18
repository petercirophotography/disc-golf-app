import React, { useState } from 'react';
import NumericInput from './NumericInput.jsx';

function ThrowEntry({ disc, onSave, existingThrows }) {
  // Figure out the next throw number based on existing throws for this disc
  const existingCount = existingThrows ? existingThrows.length : 0;
  const nextThrowNumber = existingCount + 1;

  const [distance, setDistance] = useState('');

  const handleSave = () => {
    const yards = parseFloat(distance);
    if (isNaN(yards) || yards < 0) return;

    onSave([{
      disc_id: disc.id,
      distance_yards: yards,
      throw_number: nextThrowNumber,
      flag: null,
    }]);

    setDistance('');
  };

  return (
    <div className="throw-entry">
      <div className="throw-entry-header">
        <strong>{disc?.name || 'Select Disc'}</strong>
        {disc?.stability && (
          <span className={`stability-badge stability-badge-${disc.stability}`}>
            {disc.stability}
          </span>
        )}
      </div>

      {/* Show existing throws for this disc */}
      {existingCount > 0 && (
        <div style={{ marginBottom: '8px', fontSize: '13px', color: '#555' }}>
          {existingThrows.map((t, i) => (
            <span key={i} style={{ marginRight: '12px' }}>
              T{t.throw_number}: <strong>{t.distance_yards} yds</strong>
              <span style={{ color: '#888' }}> ({Math.round(t.distance_yards * 3)} ft)</span>
            </span>
          ))}
        </div>
      )}

      {/* Input for next throw */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>T{nextThrowNumber}:</span>
        <div style={{ flex: 1 }}>
          <NumericInput
            value={distance}
            onChange={setDistance}
            placeholder="yards"
            min={0}
          />
        </div>
        {distance && !isNaN(parseFloat(distance)) && (
          <span style={{ fontSize: '12px', color: '#888' }}>
            {Math.round(parseFloat(distance) * 3)} ft
          </span>
        )}
        <button
          type="button"
          className="tracker-btn tracker-btn-primary"
          style={{ padding: '10px 16px' }}
          onClick={handleSave}
          disabled={!distance || isNaN(parseFloat(distance))}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default ThrowEntry;
