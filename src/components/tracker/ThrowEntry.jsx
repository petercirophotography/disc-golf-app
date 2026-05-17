import React, { useState } from 'react';
import NumericInput from './NumericInput.jsx';

const FLAGS = ['roller', 'skip', 'outlier'];

function ThrowEntry({ disc, onSave, existingThrows }) {
  const [throws, setThrows] = useState([
    existingThrows?.[0]?.distance_yards?.toString() || '',
    existingThrows?.[1]?.distance_yards?.toString() || '',
    existingThrows?.[2]?.distance_yards?.toString() || '',
  ]);
  const [flags, setFlags] = useState([
    existingThrows?.[0]?.flag || null,
    existingThrows?.[1]?.flag || null,
    existingThrows?.[2]?.flag || null,
  ]);

  const handleThrowChange = (index, value) => {
    setThrows((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const toggleFlag = (index, flag) => {
    setFlags((prev) => {
      const next = [...prev];
      next[index] = next[index] === flag ? null : flag;
      return next;
    });
  };

  const handleSave = () => {
    const throwsData = throws.map((val, i) => {
      const yards = parseFloat(val);
      if (isNaN(yards) || yards < 0) return null;
      return {
        disc_id: disc.id,
        distance_yards: yards,
        throw_number: i + 1,
        flag: flags[i],
      };
    }).filter(Boolean);

    if (throwsData.length > 0) {
      onSave(throwsData);
    }
  };

  // Compute stats from valid throws
  const validYards = throws
    .map((v) => parseFloat(v))
    .filter((n) => !isNaN(n) && n >= 0);

  const avgFeet = validYards.length === 3
    ? Math.round((validYards.reduce((a, b) => a + b, 0) / 3) * 3)
    : null;

  const maxFeet = validYards.length > 0
    ? Math.round(Math.max(...validYards) * 3)
    : null;

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

      <div className="throw-entry-inputs">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <NumericInput
              value={throws[i]}
              onChange={(val) => handleThrowChange(i, val)}
              placeholder={`T${i + 1} yds`}
              min={0}
            />
            <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap' }}>
              {FLAGS.map((flag) => (
                <button
                  key={flag}
                  type="button"
                  className={`throw-flag-btn ${flags[i] === flag ? 'active' : ''}`}
                  onClick={() => toggleFlag(i, flag)}
                  style={{ minWidth: '36px', minHeight: '28px', fontSize: '10px', padding: '2px 4px' }}
                >
                  {flag.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="throw-entry-stats">
        {avgFeet !== null && <span>Avg: <strong>{avgFeet} ft</strong></span>}
        {maxFeet !== null && <span>Max: <strong>{maxFeet} ft</strong></span>}
        {validYards.length > 0 && validYards.length < 3 && (
          <span style={{ color: '#f59e0b' }}>{3 - validYards.length} more needed</span>
        )}
      </div>

      <button
        type="button"
        className="tracker-btn tracker-btn-primary"
        style={{ width: '100%', marginTop: '12px' }}
        onClick={handleSave}
        disabled={validYards.length === 0}
      >
        Save Throws
      </button>
    </div>
  );
}

export default ThrowEntry;
