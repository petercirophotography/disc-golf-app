import React, { useState } from 'react';
import './Auth.css';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isLogin) {
      // Login
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const user = users[email];

      if (!user || user.password !== password) {
        setError('Invalid email or password');
        return;
      }

      onLogin(email, user.purchases || []);
    } else {
      // Sign up
      const users = JSON.parse(localStorage.getItem('users') || '{}');

      if (users[email]) {
        setError('Email already exists');
        return;
      }

      users[email] = { password, purchases: [] };
      localStorage.setItem('users', JSON.stringify(users));
      onLogin(email, []);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="auth-button">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)} className="toggle-link">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
