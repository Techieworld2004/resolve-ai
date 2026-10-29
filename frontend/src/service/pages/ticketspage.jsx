import { useState, useEffect } from 'react';
import { ticketAPI } from '../service/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({
    title: '', description: '', priority: 'MEDIUM'
  });

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const data = await ticketAPI.getAll();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
    setLoading(false);
  };

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      await ticketAPI.create(newTicket);
      setNewTicket({ title: '', description: '', priority: 'MEDIUM' });
      loadTickets();
      alert('✅ Ticket Created!');
    } catch (err) {
      alert('❌ Failed to create ticket');
    }
  };

  const updateStatus = async (id, status) => {
    await ticketAPI.updateStatus(id, status);
    loadTickets();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🎫 Support Tickets</h1>

      {/* Create Ticket Form */}
      <div style={cardStyle}>
        <h3>➕ Create New Ticket</h3>
        <form onSubmit={createTicket}>
          <input
            style={inputStyle}
            placeholder="Title"
            value={newTicket.title}
            onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
            required
          />
          <textarea
            style={{ ...inputStyle, height: '80px' }}
            placeholder="Description"
            value={newTicket.description}
            onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
            required
          />
          <select
            style={inputStyle}
            value={newTicket.priority}
            onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
          >
            <option value="LOW">🟢 Low</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="HIGH">🔴 High</option>
          </select>
          <button style={btnStyle} type="submit">
            Create Ticket ✅
          </button>
        </form>
      </div>

      {/* Tickets List */}
      <h3>📋 All Tickets ({tickets.length})</h3>
      {loading ? (
        <p>Loading tickets...</p>
      ) : (
        tickets.map(ticket => (
          <div key={ticket.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h4>#{ticket.id} — {ticket.title}</h4>
              <span style={getBadgeStyle(ticket.status)}>
                {ticket.status}
              </span>
            </div>
            <p style={{ color: '#666', margin: '8px 0' }}>
              {ticket.description}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {['OPEN', 'IN_PROGRESS', 'CLOSED'].map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(ticket.id, s)}
                  style={{
                    ...smallBtnStyle,
                    background: ticket.status === s ? '#667eea' : '#eee',
                    color: ticket.status === s ? 'white' : '#333',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Styles
const cardStyle = {
  background: 'white', borderRadius: '12px',
  padding: '20px', marginBottom: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
};
const inputStyle = {
  width: '100%', padding: '10px 14px',
  margin: '6px 0', border: '1px solid #ddd',
  borderRadius: '8px', fontSize: '14px'
};
const btnStyle = {
  background: 'linear-gradient(135deg,#667eea,#764ba2)',
  color: 'white', border: 'none', padding: '10px 20px',
  borderRadius: '8px', cursor: 'pointer', marginTop: '8px'
};
const smallBtnStyle = {
  border: 'none', padding: '4px 10px',
  borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
};
const getBadgeStyle = (status) => ({
  padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
  background: status === 'OPEN' ? '#fef3c7' :
    status === 'IN_PROGRESS' ? '#dbeafe' : '#d1fae5',
  color: status === 'OPEN' ? '#92400e' :
    status === 'IN_PROGRESS' ? '#1e40af' : '#065f46'
});