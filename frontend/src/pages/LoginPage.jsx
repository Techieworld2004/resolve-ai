import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fillDemo = (email, password) => {
    setFormData({ email, password });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await userAPI.login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (response && response.data) {
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        setMessage(`✅ Welcome back, ${response.data.fullName || response.data.email}!`);
        setTimeout(() => {
          navigate('/tickets');
        }, 1000);
      } else {
        setError('❌ Invalid email or password.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('❌ Invalid credentials. Please check your email and password.');
      } else {
        setError('❌ Could not connect to backend server. Make sure Spring Boot is running on port 8081.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h2>Welcome Back</h2>
          <p>Sign in to access your ResolveAI support portal</p>
        </div>

        {/* Quick Fill Demo Pills */}
        <div className="quick-fill-box">
          <span className="quick-label">Fill Demo User:</span>
          <div className="quick-buttons">
            <button
              type="button"
              className="quick-btn customer"
              onClick={() => fillDemo('customer@resolveai.com', 'customer123')}
            >
              👤 Customer
            </button>
            <button
              type="button"
              className="quick-btn agent"
              onClick={() => fillDemo('agent@resolveai.com', 'agent123')}
            >
              🛡️ Agent
            </button>
            <button
              type="button"
              className="quick-btn admin"
              onClick={() => fillDemo('admin@resolveai.com', 'admin123')}
            >
              ⚡ Admin
            </button>
          </div>
        </div>

        {message && <div className="alert-box success-alert">{message}</div>}
        {error && <div className="alert-box error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="e.g. alex@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit-glow"
          >
            {loading ? (
              <span className="spinner-text">Authenticating...</span>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
          <Link to="/" className="back-link">
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
