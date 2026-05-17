import React from 'react';

function DiscCard({ disc, onEdit, onToggleBag, onDelete }) {
  const flightNumbers = [disc.speed, disc.glide, disc.turn, disc.fade]
    .filter((n) => n !== null && n !== undefined)
    .join(' / ');

  return (
    <div className="disc-card">
      <div className="disc-card-info">
        <div className="disc-card-name">
          {disc.name}
          {!disc.in_bag && <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>(not in bag)</span>}
        </div>
        <div className="disc-card-meta">
          {disc.disc_type}
          {disc.brand && ` · ${disc.brand}`}
          <span className={`stability-badge stability-badge-${disc.stability}`} style={{ marginLeft: '8px' }}>
            {disc.stability}
          </span>
        </div>
        {flightNumbers && <div className="disc-card-flight">{flightNumbers}</div>}
      </div>
      <div className="disc-card-actions">
        {onToggleBag && (
          <button
            className="tracker-btn tracker-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            onClick={() => onToggleBag(disc)}
            title={disc.in_bag ? 'Remove from bag' : 'Add to bag'}
          >
            {disc.in_bag ? '🎒' : '➕'}
          </button>
        )}
        {onEdit && (
          <button
            className="tracker-btn tracker-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            onClick={() => onEdit(disc)}
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            className="tracker-btn tracker-btn-danger"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            onClick={() => onDelete(disc)}
            title="Delete disc"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

export default DiscCard;
