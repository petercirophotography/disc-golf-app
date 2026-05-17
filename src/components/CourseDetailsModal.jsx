import React, { useState } from 'react';
import './CourseDetailsModal.css';

function CourseDetailsModal({ course, onClose }) {
  const [selectedLayout, setSelectedLayout] = useState(0);

  if (!course) return null;

  const layout = course.layouts[selectedLayout];
  const totalDistance = layout.holes.reduce((sum, hole) => sum + hole.distance, 0);
  const totalPar = layout.holes.reduce((sum, hole) => sum + hole.par, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>{course.name}</h2>
          <p className="modal-location">📍 {course.location}</p>
        </div>

        {course.layouts.length > 1 && (
          <div className="layout-selector">
            <div className="layout-tabs">
              {course.layouts.map((layout, index) => (
                <button
                  key={index}
                  className={`layout-tab ${selectedLayout === index ? 'active' : ''}`}
                  onClick={() => setSelectedLayout(index)}
                >
                  <span className="layout-name">{layout.name}</span>
                  <span className="layout-desc">{layout.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="course-stats">
          <div className="stat-item">
            <span className="stat-label">Holes</span>
            <span className="stat-value">{course.holes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Par</span>
            <span className="stat-value">{totalPar}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Distance</span>
            <span className="stat-value">{totalDistance} ft</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Difficulty</span>
            <span className="stat-value">{layout.difficulty}</span>
          </div>
        </div>

        <div className="holes-table-container">
          <table className="holes-table">
            <thead>
              <tr>
                <th>Hole</th>
                <th>Distance</th>
                <th>Par</th>
              </tr>
            </thead>
            <tbody>
              {layout.holes.map((hole) => (
                <tr key={hole.hole}>
                  <td className="hole-number">{hole.hole}</td>
                  <td className="hole-distance">{hole.distance} ft</td>
                  <td className="hole-par">{hole.par}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td>Total</td>
                <td>{totalDistance} ft</td>
                <td>{totalPar}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailsModal;
