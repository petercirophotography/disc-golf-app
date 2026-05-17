import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { courses } from '../data/courses';
import './CourseDetail.css';

function CourseDetail({ purchasedCourses, onPurchase }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const course = courses.find(c => c.id === parseInt(id));
  const [showPaywall, setShowPaywall] = useState(false);
  const videoRef = useRef(null);
  const isPurchased = purchasedCourses.has(course?.id);

  useEffect(() => {
    if (searchParams.get('success') === 'true' && course) {
      onPurchase(course.id);
    }
  }, [searchParams, course, onPurchase]);

  useEffect(() => {
    if (videoRef.current && !isPurchased) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        if (video.currentTime >= 10) {
          video.pause();
          setShowPaywall(true);
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [isPurchased]);

  const handlePurchase = async () => {
    if (!course) {
      alert('Course data not loaded. Please refresh the page.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          courseName: course.name,
          price: course.price,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  if (!course) {
    return <div className="container">Course not found</div>;
  }

  return (
    <div className="course-detail">
      <div className="container">
        <Link to="/" className="back-link">← Back to Courses</Link>
        
        <div className="detail-header">
          <h1>{course.name}</h1>
          <p className="location">📍 {course.location}</p>
        </div>

        <div className="video-container">
          <video
            ref={videoRef}
            controls
            poster={course.thumbnail}
            className="course-video"
          >
            <source src={isPurchased ? course.fullUrl : course.previewUrl} type="video/mp4" />
            Your browser does not support video playback.
          </video>
          
          {showPaywall && (
            <div className="paywall-overlay">
              <div className="paywall-content">
                <h2>🔒 Unlock Full Walkthrough</h2>
                <p>Get complete access to all {course.holes} holes</p>
                <div className="paywall-price">${course.price}</div>
                <button onClick={handlePurchase} className="purchase-btn">
                  Purchase Full Access
                </button>
                <p className="preview-note">Preview limited to 10 seconds</p>
              </div>
            </div>
          )}
        </div>

        <div className="course-details">
          <div className="detail-card">
            <h3>Course Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Holes:</span>
                <span className="value">{course.holes}</span>
              </div>
              <div className="info-item">
                <span className="label">Difficulty:</span>
                <span className="value">{course.difficulty}</span>
              </div>
              <div className="info-item">
                <span className="label">Price:</span>
                <span className="value price-value">${course.price}</span>
              </div>
            </div>
            <p className="description">{course.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
