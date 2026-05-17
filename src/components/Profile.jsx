import React from 'react';
import { Link } from 'react-router-dom';
import { courses } from '../data/courses';
import './Profile.css';

function Profile({ user, purchasedCourses }) {
  const purchasedCoursesList = courses.filter(course => 
    purchasedCourses.has(course.id)
  );

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>My Profile</h1>
            <p className="profile-email">{user}</p>
          </div>
        </div>

        <div className="profile-section">
          <h2>My Purchases ({purchasedCoursesList.length})</h2>
          
          {purchasedCoursesList.length === 0 ? (
            <div className="empty-state">
              <p>You haven't purchased any courses yet.</p>
              <Link to="/" className="browse-btn">Browse Courses</Link>
            </div>
          ) : (
            <div className="purchases-grid">
              {purchasedCoursesList.map(course => (
                <div key={course.id} className="purchase-card">
                  <div className="purchase-thumbnail">
                    <img src={course.thumbnail} alt={course.name} />
                  </div>
                  <div className="purchase-info">
                    <h3>{course.name}</h3>
                    <p className="purchase-location">📍 {course.location}</p>
                    <div className="purchase-details">
                      <span className="purchase-difficulty">{course.difficulty}</span>
                      <span className="purchase-holes">{course.holes} holes</span>
                    </div>
                    <Link to={`/course/${course.id}`} className="watch-btn">
                      Watch Full Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
