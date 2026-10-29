import { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../../api';
import './homepage.css';

export default function HomePage() {
  const [messages, setMessages] = useState([
    { id: 1, text: '👋 Hello! I am ResolveAI Assistant powered by Groq LLM. How can I help you today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('checking...');
  const bottomRef = useRef(null);

  // ✅ Health Check on load
  useEffect(() => {
    checkHealth();
  }, []);

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkHealth = async () => {
    try {
      const res = await aiAPI.getConfig();
      if (res.data?.status === 'ACTIVE') {
        setStatus(`⚡ Groq AI Online (${res.data.defaultModel || 'Llama/GPT'})`);
      } else {
        setStatus('✅ Online (Port 8081)');
      }
    } catch {
      setStatus('❌ Backend Offline');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg = {
      id: Date.now(),
      text: userText,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat({ message: userText });
      const botMsg = {
        id: Date.now() + 1,
        text: res.data?.reply || 'Received your response.',
        sender: 'bot'
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '❌ Error: Unable to reach AI backend on port 8081. Please ensure backend is running.',
        sender: 'bot'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <h2>🤖 ResolveAI Assistant</h2>
        <span className="status-badge">{status}</span>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message ${msg.sender}`}
          >
            <div className="bubble">{msg.text}</div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="message bot">
            <div className="bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? '...' : 'Send ➤'}
        </button>
      </div>
    </div>
  );
}