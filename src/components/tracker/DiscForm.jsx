import React, { useState } from 'react';

const DISC_TYPES = ['Driver', 'Fairway', 'Midrange', 'Putter'];
const STABILITIES = ['VOS', 'OS', 'ST', 'US', 'VUS'];

function DiscForm({ disc, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: disc?.name || '',
    disc_type: disc?.disc_type || 'Driver',
    stability: disc?.stability || 'ST',
    brand: disc?.brand || '',
    speed: disc?.speed || '',
    glide: disc?.glide || '',
    turn: disc?.turn || '',
    fade: disc?.fade || '',
    in_bag: disc?.in_bag !== undefined ? disc.in_bag : true,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.disc_type) errs.disc_type = 'Type is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const data = {
      name: form.name.trim(),
      disc_type: form.disc_type,
      stability: form.stability,
      brand: form.brand.trim() || null,
      speed: form.speed !== '' ? parseFloat(form.speed) : null,
      glide: form.glide !== '' ? parseFloat(form.glide) : null,
      turn: form.turn !== '' ? parseFloat(form.turn) : null,
      fade: form.fade !== '' ? parseFloat(form.fade) : null,
      in_bag: form.in_bag,
    };

    onSubmit(data);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form className="tracker-form" onSubmit={handleSubmit}>
      <div className="tracker-form-group">
        <label>Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Disc name"
        />
        {errors.name && <span className="tracker-form-error">{errors.name}</span>}
      </div>

      <div className="tracker-form-row">
        <div className="tracker-form-group">
          <label>Type *</label>
          <select
            value={form.disc_type}
            onChange={(e) => handleChange('disc_type', e.target.value)}
          >
            {DISC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.disc_type && <span className="tracker-form-error">{errors.disc_type}</span>}
        </div>

        <div className="tracker-form-group">
          <label>Stability</label>
          <select
            value={form.stability}
            onChange={(e) => handleChange('stability', e.target.value)}
          >
            {STABILITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tracker-form-group">
        <label>Brand</label>
        <input
          type="text"
          value={form.brand}
          onChange={(e) => handleChange('brand', e.target.value)}
          placeholder="Brand (optional)"
        />
      </div>

      <div className="tracker-form-row">
        <div className="tracker-form-group">
          <label>Speed</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.speed}
            onChange={(e) => handleChange('speed', e.target.value)}
            placeholder="—"
          />
        </div>
        <div className="tracker-form-group">
          <label>Glide</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.glide}
            onChange={(e) => handleChange('glide', e.target.value)}
            placeholder="—"
          />
        </div>
      </div>

      <div className="tracker-form-row">
        <div className="tracker-form-group">
          <label>Turn</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.turn}
            onChange={(e) => handleChange('turn', e.target.value)}
            placeholder="—"
          />
        </div>
        <div className="tracker-form-group">
          <label>Fade</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.fade}
            onChange={(e) => handleChange('fade', e.target.value)}
            placeholder="—"
          />
        </div>
      </div>

      <label className="tracker-toggle">
        <input
          type="checkbox"
          checked={form.in_bag}
          onChange={(e) => handleChange('in_bag', e.target.checked)}
        />
        <span>In Bag</span>
      </label>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button type="submit" className="tracker-btn tracker-btn-primary" style={{ flex: 1 }}>
          {disc ? 'Update' : 'Add Disc'}
        </button>
        {onCancel && (
          <button type="button" className="tracker-btn tracker-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default DiscForm;
