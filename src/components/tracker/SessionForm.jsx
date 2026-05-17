import React, { useState } from 'react';

function SessionForm({ session, onSubmit, onCancel }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    session_date: session?.session_date || today,
    location: session?.location || '',
    conditions: session?.conditions || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.location.trim()) errs.location = 'Location is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSubmit({
      session_date: form.session_date,
      location: form.location.trim(),
      conditions: form.conditions.trim() || null,
    });
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
        <label>Date</label>
        <input
          type="date"
          value={form.session_date}
          onChange={(e) => handleChange('session_date', e.target.value)}
        />
      </div>

      <div className="tracker-form-group">
        <label>Location *</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="e.g., Football field, Park"
        />
        {errors.location && <span className="tracker-form-error">{errors.location}</span>}
      </div>

      <div className="tracker-form-group">
        <label>Conditions</label>
        <textarea
          value={form.conditions}
          onChange={(e) => handleChange('conditions', e.target.value)}
          placeholder="e.g., Sunny, 70°F, light wind"
          rows={2}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button type="submit" className="tracker-btn tracker-btn-primary" style={{ flex: 1 }}>
          {session ? 'Update Session' : 'Create Session'}
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

export default SessionForm;
