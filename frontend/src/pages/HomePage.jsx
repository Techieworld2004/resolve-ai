import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="pulse-indicator"></span>
          Intelligent Customer Support Engine v2.0
        </div>

        <h1 className="hero-title">
          Resolve Customer Inquiries <span className="gradient-text">10x Faster</span> with ResolveAI
        </h1>

        <p className="hero-subtitle">
          Streamline tickets, accelerate agent response times, and collaborate seamlessly in real-time.
          Enterprise-ready architecture with Spring Boot & React.
        </p>

        <div className="hero-actions">
          <Link to="/tickets" className="btn-primary-glow">
            🚀 Open Ticket Dashboard
          </Link>
          <Link to="/create-ticket" className="btn-secondary-glass">
            🎫 Submit New Ticket
          </Link>
          {!currentUser && (
            <Link to="/login" className="btn-ghost">
              Sign In →
            </Link>
          )}
        </div>

        {/* Quick Demo Credentials Banner */}
        <div className="demo-credentials-card">
          <div className="demo-header">
            <span className="demo-tag">DEMO READY</span>
            <h4>Quick Test Credentials</h4>
          </div>
          <div className="demo-grid">
            <div className="demo-item">
              <span className="demo-role admin">Admin</span>
              <code>admin@resolveai.com</code>
              <small>Pass: <strong>admin123</strong></small>
            </div>
            <div className="demo-item">
              <span className="demo-role agent">Agent</span>
              <code>agent@resolveai.com</code>
              <small>Pass: <strong>agent123</strong></small>
            </div>
            <div className="demo-item">
              <span className="demo-role customer">Customer</span>
              <code>customer@resolveai.com</code>
              <small>Pass: <strong>customer123</strong></small>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>Core Capabilities Built for Scale</h2>
          <p>Everything your support engineering team needs in one synchronized interface.</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon icon-ai">⚡</div>
            <h3>Real-Time Ticket Management</h3>
            <p>Track status transitions from Open → In Progress → Resolved → Closed with instant updates.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-chat">💬</div>
            <h3>Synchronized Message Threads</h3>
            <p>Direct communication between customers and support agents within dedicated ticket conversations.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-roles">🛡️</div>
            <h3>Role-Based Access Control</h3>
            <p>Distinct experiences and administrative controls tailored for Customers, Agents, and Administrators.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-priority">🎯</div>
            <h3>Smart Priority & Categorization</h3>
            <p>Organize issues effortlessly by urgency (Urgent, High, Medium, Low) and problem domain.</p>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="tech-badge-section">
        <div className="tech-pills">
          <span className="tech-pill">Spring Boot 4.x REST API</span>
          <span className="tech-pill">Spring Security & BCrypt</span>
          <span className="tech-pill">Spring Data JPA + H2</span>
          <span className="tech-pill">React 19 + Vite</span>
          <span className="tech-pill">Axios Interceptors</span>
        </div>
      </section>
    </div>
  );
}
