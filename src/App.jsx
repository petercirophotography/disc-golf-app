import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import Profile from './components/Profile';
import CourseDetailsModal from './components/CourseDetailsModal';
import Logo from './components/Logo';
import Auth from './components/Auth';
import TrackerLayout from './pages/tracker/TrackerLayout.jsx';
import Dashboard from './pages/tracker/Dashboard.jsx';
import Sessions from './pages/tracker/Sessions.jsx';
import SessionDetail from './pages/tracker/SessionDetail.jsx';
import PuttingSessions from './pages/tracker/PuttingSessions.jsx';
import PuttingDetail from './pages/tracker/PuttingDetail.jsx';
import Discs from './pages/tracker/Discs.jsx';
import Analytics from './pages/tracker/Analytics.jsx';
import Import from './pages/tracker/Import.jsx';
import Export from './pages/tracker/Export.jsx';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [purchasedCourses, setPurchasedCourses] = useState(new Set());
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const userData = users[currentUser];
      if (userData) {
        setUser(currentUser);
        setPurchasedCourses(new Set(userData.purchases || []));
      }
    }
  }, []);

  const handleLogin = useCallback((email, purchases) => {
    setUser(email);
    setPurchasedCourses(new Set(purchases));
    localStorage.setItem('currentUser', email);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setPurchasedCourses(new Set());
    localStorage.removeItem('currentUser');
  }, []);

  const handlePurchase = useCallback((courseId) => {
    setPurchasedCourses(prev => {
      const newPurchases = new Set([...prev, courseId]);
      
      // Save to localStorage
      if (user) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[user]) {
          users[user].purchases = Array.from(newPurchases);
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
      
      return newPurchases;
    });
  }, [user]);

  const handleShowDetails = useCallback((course) => {
    setSelectedCourse(course);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedCourse(null);
  }, []);

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/tracker" element={<TrackerLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="putting" element={<PuttingSessions />} />
            <Route path="putting/:id" element={<PuttingDetail />} />
            <Route path="discs" element={<Discs />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="import" element={<Import />} />
            <Route path="export" element={<Export />} />
          </Route>
          <Route path="*" element={<Auth onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <Logo />
            <nav className="nav-menu">
              <Link to="/" className="nav-link">Courses</Link>
              <Link to="/tracker" className="nav-link">Tracker</Link>
              <Link to="/profile" className="nav-link">My Profile</Link>
            </nav>
            <div className="user-menu">
              <span className="user-email">{user}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<CourseList onShowDetails={handleShowDetails} />} />
          <Route 
            path="/course/:id" 
            element={
              <CourseDetail 
                purchasedCourses={purchasedCourses}
                onPurchase={handlePurchase}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <Profile 
                user={user}
                purchasedCourses={purchasedCourses}
              />
            } 
          />
          <Route path="/tracker" element={<TrackerLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="putting" element={<PuttingSessions />} />
            <Route path="putting/:id" element={<PuttingDetail />} />
            <Route path="discs" element={<Discs />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="import" element={<Import />} />
            <Route path="export" element={<Export />} />
          </Route>
        </Routes>
        {selectedCourse && (
          <CourseDetailsModal 
            course={selectedCourse} 
            onClose={handleCloseDetails} 
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
