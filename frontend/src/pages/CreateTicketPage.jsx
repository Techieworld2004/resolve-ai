import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ticketAPI, userAPI } from '../api';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'Technical'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    let userId = currentUser?.userId;

    // If user is not logged in, try to find an existing customer or create ticket with fallback user ID
    if (!userId) {
      try {
        const usersRes = await userAPI.getAll();
        if (usersRes.data && usersRes.data.length > 0) {
          userId = usersRes.data[0].userId;
        }
      } catch {
        userId = 1;
      }
    }

    const payload = {
      user: {
        userId: userId || 1,
        email: currentUser?.email,
        fullName: currentUser?.fullName
      },
      subject: formData.subject.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      category: formData.category
    };

    try {
      const response = await ticketAPI.create(payload);
      setMessage(`🎉 Ticket #${response.data.ticketId} created successfully! Redirecting...`);
      setFormData({ subject: '', description: '', priority: 'MEDIUM', category: 'Technical' });
      setTimeout(() => navigate('/tickets'), 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError('❌ Failed to create ticket: ' + (typeof msg === 'string' ? msg : 'Please check your inputs and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-card-wrapper">
        <div className="card-header-row">
          <div>
            <h2>Create New Support Ticket</h2>
            <p className="card-subtitle">Submit your issue to our engineering and support specialists</p>
          </div>
          <Link to="/tickets" className="btn-secondary-sm">
            ← Back to Tickets
          </Link>
        </div>

        {!currentUser && (
          <div className="alert-box info-alert">
            ℹ️ You are not logged in. This ticket will be registered under the demo customer.
            For full tracking, <Link to="/login" style={{ textDecoration: 'underline', color: 'inherit' }}>sign in here</Link>.
          </div>
        )}

        {message && <div className="alert-box success-alert">{message}</div>}
        {error && <div className="alert-box error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              id="subject"
              type="text"
              name="subject"
              placeholder="e.g. Inability to access cloud storage dashboard"
              value={formData.subject}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field select-field"
              >
                <option value="Technical">Technical Issue</option>
                <option value="Billing">Billing & Payments</option>
                <option value="Account Issues">Account & Security</option>
                <option value="Performance">System Performance</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General">General Inquiry</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field select-field"
              >
                <option value="LOW">🟢 Low (Minor question or suggestion)</option>
                <option value="MEDIUM">🟡 Medium (Normal operational impact)</option>
                <option value="HIGH">🟠 High (Significant disruption)</option>
                <option value="URGENT">🔴 Urgent (Critical blocker/outage)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              placeholder="Please provide complete context: steps to reproduce, expected vs actual behavior, error messages..."
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              className="input-field textarea-field"
            />
          </div>

          <div className="form-actions-right">
            <Link to="/tickets" className="btn-cancel">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-submit-glow"
            >
              {loading ? 'Submitting Ticket...' : '🚀 Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
