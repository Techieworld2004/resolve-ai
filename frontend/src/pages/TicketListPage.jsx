import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketAPI, messageAPI, userAPI, aiAPI } from '../api';

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Ticket for Modal / Drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  // Load tickets and agents
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketsRes, usersRes] = await Promise.all([
        ticketAPI.getAll(),
        userAPI.getAll().catch(() => ({ data: [] }))
      ]);

      setTickets(ticketsRes.data || []);
      const allUsers = usersRes.data || [];
      setAgents(allUsers.filter(u => u.role === 'AGENT' || u.role === 'ADMIN'));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tickets. Please check if the backend is running on port 8081.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Fetch messages when a ticket is opened
  const openTicketDetail = async (ticket) => {
    setSelectedTicket(ticket);
    setActionFeedback('');
    setLoadingMessages(true);
    try {
      const res = await messageAPI.getByTicket(ticket.ticketId);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e, withAiReply = false) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedTicket) return;

    let senderId = currentUser?.userId;
    if (!senderId) {
      // Fallback to ticket creator or 1
      senderId = selectedTicket.user?.userId || 1;
    }

    const sentText = newMessageText.trim();
    const apiKey = localStorage.getItem('resolveai_llm_key') || undefined;
    const provider = localStorage.getItem('resolveai_llm_provider') || undefined;
    const model = localStorage.getItem('resolveai_llm_model') || undefined;

    try {
      const res = await messageAPI.send({
        ticketId: selectedTicket.ticketId,
        senderId: senderId,
        messageText: sentText
      });

      const updatedMessages = [...messages, res.data];
      setMessages(updatedMessages);
      setNewMessageText('');

      // If user holds shift or auto-reply is requested, summon AI response
      if (withAiReply) {
        setAiLoading(true);
        try {
          const aiRes = await aiAPI.replyTicketWithAi(selectedTicket.ticketId, {
            message: sentText,
            apiKey,
            provider,
            model
          });
          setMessages([...updatedMessages, aiRes.data]);
          setActionFeedback('🤖 ResolveAI replied to your message!');
          setTimeout(() => setActionFeedback(''), 3000);
        } catch (aiErr) {
          console.warn('AI ticket reply error:', aiErr);
        } finally {
          setAiLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setActionFeedback('Failed to send message. Please try again.');
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setAiLoading(true);
    setActionFeedback('');
    const apiKey = localStorage.getItem('resolveai_llm_key') || undefined;
    const provider = localStorage.getItem('resolveai_llm_provider') || undefined;
    const model = localStorage.getItem('resolveai_llm_model') || undefined;

    try {
      const res = await aiAPI.suggestReplyPost(selectedTicket.ticketId, { apiKey, provider, model });
      if (res.data?.suggestedReply) {
        setNewMessageText(res.data.suggestedReply);
        const provName = res.data?.provider === 'gemini' ? 'Gemini' : res.data?.provider === 'openai' ? 'OpenAI' : 'ResolveAI';
        setActionFeedback(`✨ ${provName} drafted a suggested response for you!`);
        setTimeout(() => setActionFeedback(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setActionFeedback('Failed to generate AI suggestion.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiAssistPost = async () => {
    if (!selectedTicket) return;
    setAiLoading(true);
    setActionFeedback('');
    const apiKey = localStorage.getItem('resolveai_llm_key') || undefined;
    const provider = localStorage.getItem('resolveai_llm_provider') || undefined;
    const model = localStorage.getItem('resolveai_llm_model') || undefined;

    try {
      const res = await aiAPI.assistTicket(selectedTicket.ticketId, { apiKey, provider, model });
      setMessages(prev => [...prev, res.data]);
      setActionFeedback('🤖 ResolveAI posted an automated diagnostic reply to the thread!');
      setTimeout(() => setActionFeedback(''), 4000);
    } catch (err) {
      console.error(err);
      setActionFeedback('Failed to summon ResolveAI assistant.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await ticketAPI.updateStatus(ticketId, newStatus);
      const updatedTicket = res.data;

      setTickets(tickets.map(t => (t.ticketId === ticketId ? updatedTicket : t)));
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updatedTicket);
      }
      setActionFeedback(`Status updated to ${newStatus}`);
      setTimeout(() => setActionFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setActionFeedback('Failed to update status.');
    }
  };

  const handleAssignAgent = async (ticketId, agentId) => {
    try {
      const targetAgent = agents.find(a => a.userId === parseInt(agentId));
      const res = await ticketAPI.update(ticketId, {
        ...selectedTicket,
        assignedTo: targetAgent ? { userId: targetAgent.userId } : null
      });

      const updated = res.data;
      setTickets(tickets.map(t => (t.ticketId === ticketId ? updated : t)));
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      setActionFeedback('Assigned agent updated');
      setTimeout(() => setActionFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setActionFeedback('Failed to assign agent.');
    }
  };

  const handleDeleteTicket = async (ticketId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete ticket #${ticketId}?`)) return;

    try {
      await ticketAPI.delete(ticketId);
      setTickets(tickets.filter(t => t.ticketId !== ticketId));
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete ticket.');
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      ticket.subject?.toLowerCase().includes(query) ||
      ticket.description?.toLowerCase().includes(query) ||
      ticket.category?.toLowerCase().includes(query) ||
      String(ticket.ticketId).includes(query) ||
      ticket.user?.fullName?.toLowerCase().includes(query);

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="status-badge badge-open"><span className="pulse-dot"></span> Open</span>;
      case 'IN_PROGRESS':
        return <span className="status-badge badge-progress"><span className="pulse-dot"></span> In Progress</span>;
      case 'RESOLVED':
        return <span className="status-badge badge-resolved">✓ Resolved</span>;
      case 'CLOSED':
        return <span className="status-badge badge-closed">Closed</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="priority-pill pill-urgent">URGENT</span>;
      case 'HIGH':
        return <span className="priority-pill pill-high">HIGH</span>;
      case 'MEDIUM':
        return <span className="priority-pill pill-medium">MEDIUM</span>;
      case 'LOW':
        return <span className="priority-pill pill-low">LOW</span>;
      default:
        return <span className="priority-pill">{priority}</span>;
    }
  };

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Tickets Operations Center</h1>
          <p className="dashboard-subtitle">Monitor, prioritize, and resolve enterprise support inquiries</p>
        </div>
        <div className="header-actions">
          <button onClick={loadData} className="btn-refresh" title="Refresh Tickets">
            🔄 Refresh
          </button>
          <Link to="/create-ticket" className="btn-primary-glow">
            + Create New Ticket
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setStatusFilter('ALL')} style={{ cursor: 'pointer' }}>
          <span className="kpi-label">Total Tickets</span>
          <span className="kpi-val">{tickets.length}</span>
        </div>
        <div className="kpi-card kpi-open" onClick={() => setStatusFilter('OPEN')} style={{ cursor: 'pointer' }}>
          <span className="kpi-label">Open</span>
          <span className="kpi-val">{openCount}</span>
        </div>
        <div className="kpi-card kpi-progress" onClick={() => setStatusFilter('IN_PROGRESS')} style={{ cursor: 'pointer' }}>
          <span className="kpi-label">In Progress</span>
          <span className="kpi-val">{inProgressCount}</span>
        </div>
        <div className="kpi-card kpi-resolved" onClick={() => setStatusFilter('RESOLVED')} style={{ cursor: 'pointer' }}>
          <span className="kpi-label">Resolved</span>
          <span className="kpi-val">{resolvedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="status-tabs">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((tab) => (
            <button
              key={tab}
              className={`status-tab-btn ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="filter-controls">
          <input
            type="text"
            placeholder="🔍 Search tickets, creator, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert-box error-alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>{error}</span>
          <button onClick={loadData} className="btn-secondary-glass" style={{ padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Ticket Cards Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="pulse-spinner"></div>
          <p>Loading tickets from database...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No tickets found</h3>
          <p>No tickets match your active filter criteria.</p>
          <Link to="/create-ticket" className="btn-secondary-glass" style={{ marginTop: '16px', display: 'inline-block' }}>
            Create First Ticket
          </Link>
        </div>
      ) : (
        <div className="ticket-list-grid">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.ticketId}
              className={`ticket-card ${selectedTicket?.ticketId === ticket.ticketId ? 'selected' : ''}`}
              onClick={() => openTicketDetail(ticket)}
            >
              <div className="ticket-card-top">
                <div className="ticket-id-tag">
                  #{ticket.ticketId} <span className="cat-pill">{ticket.category || 'General'}</span>
                </div>
                <div className="badges-group">
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              <h3 className="ticket-card-title">{ticket.subject}</h3>
              <p className="ticket-card-desc">{ticket.description}</p>

              <div className="ticket-card-footer">
                <div className="ticket-meta-info">
                  <span className="creator-text">
                    👤 {ticket.user?.fullName || ticket.user?.email || 'Customer'}
                  </span>
                  {ticket.assignedTo && (
                    <span className="agent-text">
                      🛡️ {ticket.assignedTo.fullName || ticket.assignedTo.email}
                    </span>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="btn-view-thread"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTicketDetail(ticket);
                    }}
                  >
                    💬 Conversation
                  </button>
                  <button
                    className="btn-delete-card"
                    title="Delete Ticket"
                    onClick={(e) => handleDeleteTicket(ticket.ticketId, e)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail & Chat Modal / Drawer */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-id">TICKET #{selectedTicket.ticketId}</span>
                <h2 className="modal-title">{selectedTicket.subject}</h2>
              </div>
              <button className="btn-close" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            {actionFeedback && (
              <div className="alert-box info-alert">{actionFeedback}</div>
            )}

            {/* Ticket Control Ribbon */}
            <div className="control-ribbon">
              <div className="ribbon-item">
                <label>Status:</label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.ticketId, e.target.value)}
                  className="ribbon-select"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="ribbon-item">
                <label>Assigned Agent:</label>
                <select
                  value={selectedTicket.assignedTo?.userId || ''}
                  onChange={(e) => handleAssignAgent(selectedTicket.ticketId, e.target.value)}
                  className="ribbon-select"
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.userId} value={a.userId}>
                      {a.fullName} ({a.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="ribbon-item">
                <label>Category:</label>
                <span className="ribbon-val">{selectedTicket.category || 'General'}</span>
              </div>

              <div className="ribbon-item">
                <label>Priority:</label>
                {getPriorityBadge(selectedTicket.priority)}
              </div>
            </div>

            {/* Ticket Description Box */}
            <div className="ticket-full-description">
              <h4>Description</h4>
              <p>{selectedTicket.description}</p>
            </div>

            {/* Conversation Thread */}
            <div className="chat-section">
              <div className="chat-header">
                <div>
                  <h4>💬 Ticket Discussion Thread ({messages.length})</h4>
                </div>
                <div className="chat-ai-actions">
                  <button
                    type="button"
                    className="btn-ai-pill-suggest"
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    title="Ask ResolveAI to draft a reply based on ticket context"
                  >
                    ✨ {aiLoading ? 'Analyzing...' : 'AI Suggest Reply'}
                  </button>
                  <button
                    type="button"
                    className="btn-ai-pill-assist"
                    onClick={handleAiAssistPost}
                    disabled={aiLoading}
                    title="Summon ResolveAI Bot to auto-diagnose and post to the thread"
                  >
                    🤖 Auto-Assist Bot
                  </button>
                </div>
              </div>

              <div className="messages-stream">
                {loadingMessages ? (
                  <p className="loading-text">Loading conversation...</p>
                ) : messages.length === 0 ? (
                  <div className="empty-messages">
                    <span>💡</span> No messages posted yet. Start the conversation or click <strong>AI Suggest Reply</strong> above.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = currentUser && msg.sender?.userId === currentUser.userId;
                    const isBot = msg.sender?.email === 'bot@resolveai.com' || 
                                  msg.sender?.fullName?.toLowerCase().includes('bot') || 
                                  msg.sender?.fullName?.toLowerCase().includes('assistant');
                    const isAgent = (msg.sender?.role === 'AGENT' || msg.sender?.role === 'ADMIN') && !isBot;

                    return (
                      <div
                        key={msg.messageId}
                        className={`chat-bubble-row ${isCurrentUser ? 'own' : 'other'}`}
                      >
                        <div className={`chat-bubble ${isBot ? 'ai-bot-bubble' : isAgent ? 'agent-bubble' : ''}`}>
                          <div className="bubble-header">
                            <span className="sender-name">
                              {isBot ? '🤖 ResolveAI Assistant' : (msg.sender?.fullName || msg.sender?.email || 'User')}
                            </span>
                            <span className={`sender-role-tag ${isBot ? 'tag-bot' : ''}`}>
                              {isBot ? 'AI BOT' : (msg.sender?.role || 'CUSTOMER')}
                            </span>
                            {msg.createdAt && (
                              <span className="message-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="message-content">
                            {msg.messageText.split('\n').map((line, idx) => (
                              <p key={idx} style={{ margin: '4px 0' }}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  placeholder={
                    currentUser
                      ? `Reply as ${currentUser.fullName || currentUser.email}...`
                      : 'Reply to this ticket...'
                  }
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="chat-input"
                  required
                />
                <div className="chat-btn-group">
                  <button type="submit" className="btn-send">
                    Send ➔
                  </button>
                  <button
                    type="button"
                    className="btn-send-ai"
                    onClick={(e) => handleSendMessage(e, true)}
                    disabled={!newMessageText.trim() || aiLoading}
                    title="Send message and automatically receive an AI reply"
                  >
                    ⚡ Send + AI Reply
                  </button>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                className="btn-danger-sm"
                onClick={() => handleDeleteTicket(selectedTicket.ticketId)}
              >
                Delete Ticket
              </button>
              <button
                className="btn-secondary-sm"
                onClick={() => setSelectedTicket(null)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
