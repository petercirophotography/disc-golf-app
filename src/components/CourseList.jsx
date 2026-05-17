import React from 'react';
import { Link } from 'react-router-dom';
import { courses } from '../data/courses';
import './CourseList.css';

function CourseList({ onShowDetails }) {
  return (
    <div className="course-list">
      <div className="container">
        <h2>Featured Courses</h2>
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <Link to={`/course/${course.id}`} className="course-card-link">
                <div className="course-thumbnail">
                  <img src={course.thumbnail} alt={course.name} />
                  <div className="course-badge">{course.holes} Holes</div>
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p className="location">📍 {course.location}</p>
                  <p className="course-snippet">{course.description}</p>
                  <div className="course-meta">
                    <div className="meta-details">
                      <span className="difficulty">{course.difficulty}</span>
                      <span className="holes-count">{course.holes} holes</span>
                    </div>
                    <span className="price">${course.price}</span>
                  </div>
                </div>
              </Link>
              <div className="card-actions">
                <button 
                  onClick={() => onShowDetails(course)} 
                  className="details-btn"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CourseList;
