import React from 'react';
import './Logo.css';

function Logo() {
  return (
    <div className="logo">
      <svg className="basket-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* Central pole */}
        <rect x="48" y="15" width="4" height="70" fill="#4b5563" />
        
        {/* Top chain support ring */}
        <ellipse cx="50" cy="25" rx="18" ry="3" fill="#6b7280" />
        <ellipse cx="50" cy="25" rx="15" ry="2.5" fill="#9ca3af" />
        
        {/* Outer chains (14 chains) */}
        <line x1="32" y1="25" x2="34" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="36" y1="24" x2="37" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="40" y1="23" x2="40" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="44" y1="23" x2="43" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="47" y1="23" x2="46" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="53" y1="23" x2="54" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="56" y1="23" x2="57" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="60" y1="23" x2="60" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="64" y1="24" x2="63" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        <line x1="68" y1="25" x2="66" y2="55" stroke="#9ca3af" strokeWidth="0.8" opacity="0.7" />
        
        {/* Inner chains (7 chains) */}
        <line x1="42" y1="25" x2="43" y2="55" stroke="#d1d5db" strokeWidth="0.8" />
        <line x1="46" y1="24" x2="46" y2="55" stroke="#d1d5db" strokeWidth="0.8" />
        <line x1="50" y1="24" x2="50" y2="55" stroke="#d1d5db" strokeWidth="0.8" />
        <line x1="54" y1="24" x2="54" y2="55" stroke="#d1d5db" strokeWidth="0.8" />
        <line x1="58" y1="25" x2="57" y2="55" stroke="#d1d5db" strokeWidth="0.8" />
        
        {/* Basket rim (top) */}
        <ellipse cx="50" cy="55" rx="20" ry="3.5" fill="#2563eb" />
        <ellipse cx="50" cy="55" rx="18" ry="2.5" fill="#3b82f6" />
        
        {/* Basket tray (deep catching tray) */}
        <path d="M 30 55 Q 30 62 32 68 L 68 68 Q 70 62 70 55" 
              fill="#1e40af" 
              stroke="#2563eb" 
              strokeWidth="1.5" />
        
        {/* Basket bottom */}
        <ellipse cx="50" cy="68" rx="18" ry="3" fill="#1e3a8a" />
        
        {/* Base pole continuation */}
        <rect x="48" y="68" width="4" height="17" fill="#4b5563" />
        
        {/* Flying disc approaching */}
        <g className="flying-disc">
          <ellipse cx="78" cy="38" rx="11" ry="2.5" fill="#f59e0b" />
          <ellipse cx="78" cy="38" rx="9" ry="2" fill="#fbbf24" />
          <path d="M 67 38 Q 78 36 89 38" fill="none" stroke="#d97706" strokeWidth="0.8" />
          {/* Motion lines */}
          <line x1="60" y1="37" x2="65" y2="37.5" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
          <line x1="62" y1="39" x2="66" y2="39.5" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
        </g>
      </svg>
      <div className="logo-text">
        <span className="logo-title">Course Walkthroughs</span>
        <span className="logo-subtitle">Georgia Disc Golf</span>
      </div>
    </div>
  );
}

export default Logo;
