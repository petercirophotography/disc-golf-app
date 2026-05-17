import React, { useState } from 'react';

function NumericInput({ value, onChange, placeholder, min = 0, max, label, error: externalError, ...props }) {
  const [internalError, setInternalError] = useState('');

  const handleChange = (e) => {
    const raw = e.target.value;

    // Allow empty input
    if (raw === '') {
      setInternalError('');
      onChange('');
      return;
    }

    // Validate numeric
    const num = parseFloat(raw);
    if (isNaN(num)) {
      setInternalError('Must be a number');
      return;
    }

    if (num < min) {
      setInternalError(`Must be at least ${min}`);
      onChange(raw);
      return;
    }

    if (max !== undefined && num > max) {
      setInternalError(`Must be at most ${max}`);
      onChange(raw);
      return;
    }

    setInternalError('');
    onChange(raw);
  };

  const displayError = externalError || internalError;

  return (
    <div className="tracker-form-group">
      {label && <label>{label}</label>}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ minWidth: '44px', minHeight: '44px' }}
        {...props}
      />
      {displayError && <span className="tracker-form-error">{displayError}</span>}
    </div>
  );
}

export default NumericInput;
