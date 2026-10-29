import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'CUSTOMER'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await userAPI.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      });

      setMessage(`🎉 Account created for ${response.data.fullName || response.data.email}! Redirecting to login...`);
      setFormData({ fullName: '', email: '', password: '', role: 'CUSTOMER' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data;
      setError('❌ ' + (typeof backendMsg === 'string' ? backendMsg : 'Registration failed. Please check inputs or try a different email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🚀</div>
          <h2>Join ResolveAI</h2>
          <p>Create your account to start managing support tickets</p>
        </div>

        {message && <div className="alert-box success-alert">{message}</div>}
        {error && <div className="alert-box error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="e.g. Jordan Lee"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="jordan@company.com"
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
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Platform Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field select-field"
            >
              <option value="CUSTOMER">Customer (Raise tickets & track inquiries)</option>
              <option value="AGENT">Support Agent (Triage & resolve tickets)</option>
              <option value="ADMIN">System Admin (Full oversight & configuration)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit-glow"
          >
            {loading ? (
              <span className="spinner-text">Creating Account...</span>
            ) : (
              'Create My Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
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
