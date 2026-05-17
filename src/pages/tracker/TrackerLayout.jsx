import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import OfflineIndicator from '../../components/tracker/OfflineIndicator.jsx';
import './tracker.css';

function TrackerLayout() {
  return (
    <div className="tracker-layout">
      <div className="tracker-content">
        <OfflineIndicator />
        <Outlet />
      </div>
      <nav className="tracker-bottom-nav">
        <NavLink
          to="/tracker"
          end
          className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/tracker/sessions"
          className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>Throws</span>
        </NavLink>
        <NavLink
          to="/tracker/putting"
          className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="11" />
          </svg>
          <span>Putting</span>
        </NavLink>
        <NavLink
          to="/tracker/discs"
          className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <path d="M12 8c5.5 0 10 1.8 10 4" />
          </svg>
          <span>Discs</span>
        </NavLink>
        <NavLink
          to="/tracker/analytics"
          className={({ isActive }) => `tracker-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Stats</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default TrackerLayout;
