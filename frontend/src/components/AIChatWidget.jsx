import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../api';

export default function AIChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // LLM Settings state from localStorage
  const [llmProvider, setLlmProvider] = useState(() => localStorage.getItem('resolveai_llm_provider') || 'groq');
  const [llmApiKey, setLlmApiKey] = useState(() => localStorage.getItem('resolveai_llm_key') || '');
  const [llmModel, setLlmModel] = useState(() => {
    return localStorage.getItem('resolveai_llm_model') || 'llama-3.3-70b-versatile';
  });
  const [showApiKeyText, setShowApiKeyText] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // { success: boolean, msg: string }

  // Connection & status state
  const [backendStatus, setBackendStatus] = useState('online'); // 'online' | 'offline' | 'checking'
  const [_serverLlmInfo, setServerLlmInfo] = useState(null);

  // Chat conversation state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 **Hello! I am ResolveAI Assistant**, your 24/7 autonomous support intelligence partner.\n\nHow can I help you today? You can ask me to track a ticket, troubleshoot billing timeouts (504), configure 2FA, or open a ticket!",
      suggestions: ['🔍 Track Ticket #2', '💳 Billing / 504 Timeout', '🔐 2FA Setup', '📝 Create New Ticket'],
      provider: 'builtin',
      model: 'resolveai-expert',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  })();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkBackendHealth = async () => {
    try {
      const res = await aiAPI.getConfig();
      setBackendStatus('online');
      setServerLlmInfo(res.data);
      return true;
    } catch (err) {
      console.warn('Backend not detected on port 8081:', err?.message);
      setBackendStatus('offline');
      return false;
    }
  };

  // Check backend config on mount & auto-reconnect
  useEffect(() => {
    checkBackendHealth();

    const interval = setInterval(() => {
      checkBackendHealth();
    }, 4000);

    const onFocus = () => checkBackendHealth();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [isOpen, messages, isTyping]);

  // Save settings handler
  const handleSaveSettings = (e) => {
    e?.preventDefault();
    localStorage.setItem('resolveai_llm_provider', llmProvider);
    localStorage.setItem('resolveai_llm_key', llmApiKey.trim());
    localStorage.setItem('resolveai_llm_model', llmModel);
    setShowSettings(false);
    setTestStatus({ success: true, msg: '✅ LLM configuration saved successfully!' });
    setTimeout(() => setTestStatus(null), 3000);
  };

  // Quick connection test
  const handleTestConnection = async () => {
    setTestStatus({ checking: true, msg: 'Testing connection to LLM...' });
    try {
      const res = await aiAPI.chat({
        message: 'Say "ResolveAI Connection Successful!" in 4 words.',
        apiKey: llmApiKey.trim(),
        provider: llmProvider,
        model: llmModel
      });
      setTestStatus({
        success: true,
        msg: `Connected via ${res.data?.provider || llmProvider} (${res.data?.model || llmModel})!`
      });
    } catch (_err) {
      setTestStatus({
        success: false,
        msg: 'Connection test failed. Check your API key or ensure backend is running.'
      });
    }
  };

  // Client-side fallback intelligent agent (ensures chat NEVER completely fails)
  const getClientFallbackReply = (query) => {
    const q = query.toLowerCase();
    if (q.contains?.('ticket') || q.includes('ticket') || q.includes('status')) {
      return {
        reply: "🔍 **Ticket Tracking Assistant**\n\nTo view or update your support tickets, navigate to the **Ticket Center** from the navigation bar. You can view all assigned agents, status tags, and reply directly in the discussion thread.",
        suggestions: ['Show All Tickets', 'Create New Ticket', 'Billing Help'],
        action: 'NAVIGATE_TICKETS'
      };
    }
    if (q.includes('billing') || q.includes('504') || q.includes('payment') || q.includes('card')) {
      return {
        reply: "💳 **Billing & Payment Support (Offline Cache)**\n\n• **504 Gateway Timeouts:** Often indicate the payment processor took too long to confirm. Funds are typically held in authorization and auto-revert within 24-48 business hours.\n• If your subscription has not renewed, you can file a **Billing ticket** for immediate review.",
        suggestions: ['Create Billing Ticket', '2FA Setup', 'Show All Tickets'],
        action: 'NAVIGATE_CREATE_TICKET'
      };
    }
    if (q.includes('2fa') || q.includes('mfa') || q.includes('security')) {
      return {
        reply: "🔐 **Two-Factor Authentication Setup**\n\n1. Go to **Account Settings > Security**.\n2. Click **Enable Two-Factor Authentication**.\n3. Scan the QR code using Google Authenticator or Authy.\n4. Enter the 6-digit confirmation code.",
        suggestions: ['Create Ticket', 'Reset Password', 'Billing Help']
      };
    }
    if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
      return {
        reply: "👋 **Hello there!** I am ResolveAI Assistant.\n\nEven when the backend is offline, I can guide you through billing issues, 2FA setup, and ticket management. Feel free to ask any question!",
        suggestions: ['Billing Help', '2FA Setup', 'Create Ticket']
      };
    }
    return {
      reply: `🤖 **ResolveAI Knowledge Base**\n\nI received your query: *"${query}"*.\n\nIf the backend is booting up, you can retry in a moment, or click **Settings (⚙️)** in the header to connect directly to Google Gemini or OpenAI.`,
      suggestions: ['Retry Connection', 'Create New Ticket', 'Billing Help']
    };
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (query === 'Retry Connection') {
      checkBackendHealth();
      return;
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await aiAPI.chat({
        message: query,
        userId: currentUser?.userId || null,
        apiKey: llmApiKey.trim() || undefined,
        provider: llmProvider || undefined,
        model: llmModel || undefined
      });

      const data = res.data;
      setBackendStatus('online');

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply || "I've processed your request.",
        suggestions: data.suggestions || [],
        action: data.action,
        ticketId: data.ticketId,
        provider: data.provider || llmProvider,
        model: data.model || llmModel,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.warn('Backend chat endpoint unreachable, using client AI fallback:', err);
      setBackendStatus('offline');

      // Use resilient intelligent client-side fallback
      const fallback = getClientFallbackReply(query);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: fallback.reply,
        suggestions: fallback.suggestions,
        action: fallback.action,
        isFallback: true,
        provider: 'local-fallback',
        model: 'resolveai-cached',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const clean = suggestion.replace(/^[^\w\s#]+/, '').trim().toLowerCase();

    if (clean.includes('create new ticket') || clean.includes('create ticket') || clean.includes('open ticket')) {
      navigate('/create-ticket');
      setIsOpen(false);
      return;
    }
    if (clean.includes('track ticket') || clean.includes('view ticket') || clean.includes('show all tickets') || clean.includes('check tickets')) {
      navigate('/tickets');
      setIsOpen(false);
      return;
    }
    if (clean.includes('go to login') || clean.includes('login')) {
      navigate('/login');
      setIsOpen(false);
      return;
    }
    if (clean.includes('retry connection')) {
      checkBackendHealth();
      return;
    }
    handleSend(suggestion);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: "Conversation refreshed! ✨ What would you like help with today?",
        suggestions: ['Show My Tickets', 'Billing Help', '2FA Setup', 'Create Ticket'],
        provider: llmProvider,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to render Markdown (headers, bold, italics, inline code, code blocks, bullet points)
  const renderMessageContent = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Bullet point detection
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().replace(/^([•\-*]\s*)/, '') : line;

      // Split line by bold (**...**) and inline code (`...`)
      const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="chat-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx} className="chat-inline-code">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={pIdx} className="chat-italic">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} className="chat-bullet-row">
            <span className="chat-bullet-dot">▸</span>
            <span className="chat-bullet-text">{renderedParts}</span>
          </div>
        );
      }

      return (
        <span key={lineIdx} className="chat-line">
          {renderedParts}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={`ai-widget-wrapper ${isExpanded ? 'is-expanded-mode' : ''}`}>
      {/* Floating Widget Trigger Button */}
      {!isOpen && (
        <button
          className="ai-widget-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open ResolveAI Support Chatbot"
        >
          <div className="trigger-icon-wrap">
            <span className="bot-emoji">🤖</span>
            <span className={`online-indicator-dot ${backendStatus === 'offline' ? 'dot-warning' : 'dot-active'}`}></span>
          </div>
          <div className="trigger-text-group">
            <span className="trigger-label">ResolveAI Chat</span>
            <span className="trigger-model-pill">
              {llmProvider === 'groq' ? 'Groq AI' : llmProvider === 'gemini' ? 'Gemini AI' : llmProvider === 'openai' ? 'OpenAI' : 'Assistant'}
            </span>
          </div>
          {hasUnread && <span className="unread-badge">1</span>}
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className={`ai-chat-window animate-slide-up ${isExpanded ? 'ai-chat-expanded' : ''}`}>
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-left">
              <div className="ai-avatar-ring">
                <span>🤖</span>
                <span className="ring-pulse"></span>
              </div>
              <div className="ai-header-info">
                <div className="header-title-row">
                  <h3>ResolveAI Assistant</h3>
                  <span className={`llm-badge ${llmProvider}`}>
                    {llmProvider === 'groq' ? '⚡ Groq Cloud' : llmProvider === 'gemini' ? '✨ Gemini' : llmProvider === 'openai' ? '⚡ OpenAI' : '🧠 Built-in'}
                  </span>
                </div>
                <div className="status-indicator-sub">
                  <span className={`connection-dot ${backendStatus === 'offline' ? 'dot-yellow' : 'dot-green'}`}></span>
                  <span className="status-text">
                    {backendStatus === 'online' ? 'Connected (Port 8081)' : 'Local AI Engine Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ai-header-actions">
              {/* Settings button */}
              <button
                className={`btn-icon ${showSettings ? 'active-icon' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
                title="Configure LLM Provider & API Keys"
                aria-label="Chatbot Settings"
              >
                ⚙️
              </button>

              {/* Expand / Minimize desktop size */}
              <button
                className="btn-icon desktop-only"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Contract to widget' : 'Expand full view'}
                aria-label="Toggle Expand"
              >
                {isExpanded ? '❐' : '⤢'}
              </button>

              {/* Restart chat */}
              <button
                className="btn-icon"
                onClick={handleClearChat}
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                🔄
              </button>

              {/* Close / Minimize */}
              <button
                className="btn-icon close-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Close Chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Settings Overlay Drawer */}
          {showSettings && (
            <div className="ai-settings-drawer animate-fade-in">
              <div className="settings-drawer-header">
                <h4>🤖 LLM Provider Settings</h4>
                <button className="btn-close-settings" onClick={() => setShowSettings(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveSettings} className="settings-form">
                <div className="form-group-sm">
                  <label>LLM Intelligence Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => {
                      const p = e.target.value;
                      setLlmProvider(p);
                      if (p === 'groq') setLlmModel('openai/gpt-oss-120b');
                      if (p === 'gemini') setLlmModel('gemini-1.5-flash');
                      if (p === 'openai') setLlmModel('gpt-4o-mini');
                    }}
                    className="select-sm"
                  >
                    <option value="groq">⚡ Groq Cloud (Ultra-Fast GPT OSS 120B / Llama - Recommended)</option>
                    <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                    <option value="openai">OpenAI (ChatGPT / GPT-4o-mini)</option>
                    <option value="builtin">Built-in Autonomous Engine (Zero API Key)</option>
                  </select>
                </div>

                {llmProvider !== 'builtin' && (
                  <>
                    <div className="form-group-sm">
                      <div className="label-with-hint">
                        <label>
                          {llmProvider === 'groq' ? 'Groq Cloud API Key' : llmProvider === 'gemini' ? 'Google Gemini API Key' : 'OpenAI API Key'}
                        </label>
                        <a
                          href={llmProvider === 'groq' ? 'https://console.groq.com/keys' : llmProvider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://platform.openai.com/api-keys'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="api-help-link"
                        >
                          Get Free Key ↗
                        </a>
                      </div>
                      <div className="api-input-wrap">
                        <input
                          type={showApiKeyText ? 'text' : 'password'}
                          placeholder={llmProvider === 'groq' ? 'gsk_...' : llmProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                          value={llmApiKey}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLlmApiKey(val);
                            if (val.trim().startsWith('gsk_')) {
                              setLlmProvider('groq');
                              setLlmModel('openai/gpt-oss-120b');
                            } else if (val.trim().startsWith('AIzaSy')) {
                              setLlmProvider('gemini');
                              setLlmModel('gemini-1.5-flash');
                            }
                          }}
                          className="input-sm"
                        />
                        <button
                          type="button"
                          className="btn-toggle-eye"
                          onClick={() => setShowApiKeyText(!showApiKeyText)}
                          title="Show/Hide API Key"
                        >
                          {showApiKeyText ? '👁️' : '🔒'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group-sm">
                      <label>Model Name</label>
                      <input
                        type="text"
                        value={llmModel}
                        onChange={(e) => setLlmModel(e.target.value)}
                        placeholder={llmProvider === 'groq' ? 'llama-3.3-70b-versatile' : llmProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'}
                        className="input-sm"
                      />
                      {llmProvider === 'groq' && (
                        <div className="model-quick-chips">
                          <button type="button" className="quick-chip-btn" onClick={() => setLlmModel('llama-3.3-70b-versatile')}>Llama 3.3 70B</button>
                          <button type="button" className="quick-chip-btn" onClick={() => setLlmModel('llama-3.1-8b-instant')}>Llama 3.1 8B</button>
                          <button type="button" className="quick-chip-btn" onClick={() => setLlmModel('mixtral-8x7b-32768')}>Mixtral 8x7B</button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {testStatus && (
                  <div className={`settings-status-msg ${testStatus.success ? 'status-ok' : 'status-err'}`}>
                    {testStatus.msg}
                  </div>
                )}

                <div className="settings-btn-row">
                  {llmProvider !== 'builtin' && (
                    <button
                      type="button"
                      className="btn-test-sm"
                      onClick={handleTestConnection}
                    >
                      🧪 Test Key
                    </button>
                  )}
                  <button type="submit" className="btn-save-sm">
                    💾 Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Offline / Fallback Notice Banner */}
          {backendStatus === 'offline' && !showSettings && (
            <div className="backend-offline-banner">
              <span>⚡ Running in local assistant mode (Port 8081 offline).</span>
              <button className="btn-banner-retry" onClick={checkBackendHealth}>Retry</button>
            </div>
          )}

          {/* Messages Container */}
          <div className="ai-chat-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="ai-bubble-avatar">
                    <span>🤖</span>
                  </div>
                )}
                <div className={`ai-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                  {/* Bot source tag */}
                  {msg.sender === 'bot' && (msg.provider || msg.model) && (
                    <div className="bubble-provider-tag">
                      <span>⚡ {msg.provider === 'gemini' ? 'Gemini 1.5 Flash' : msg.provider === 'openai' ? 'OpenAI' : 'ResolveAI Intelligence'}</span>
                    </div>
                  )}

                  <div className="bubble-text">{renderMessageContent(msg.text)}</div>
                  <span className="bubble-timestamp">{msg.time}</span>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="ai-suggestions-container">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          className="suggestion-chip"
                          onClick={() => handleSuggestionClick(sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Action Buttons */}
                  {msg.action === 'NAVIGATE_CREATE_TICKET' && (
                    <div className="ai-action-btn-wrap">
                      <button
                        className="btn-action-primary"
                        onClick={() => {
                          navigate('/create-ticket');
                          setIsOpen(false);
                        }}
                      >
                        📝 Open Ticket Form
                      </button>
                    </div>
                  )}

                  {(msg.ticketId || msg.action === 'NAVIGATE_TICKETS') && (
                    <div className="ai-action-btn-wrap">
                      <button
                        className="btn-action-primary"
                        onClick={() => {
                          navigate('/tickets');
                          setIsOpen(false);
                        }}
                      >
                        🔎 View in Ticket Center
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-message-row bot-row animate-fade-in">
                <div className="ai-bubble-avatar">🤖</div>
                <div className="ai-bubble bot-bubble typing-bubble">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-caption">
                    ResolveAI is thinking with {llmProvider === 'gemini' ? 'Gemini...' : llmProvider === 'openai' ? 'OpenAI...' : 'Assistant...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Carousel on Bottom */}
          <div className="quick-action-ribbon">
            <button className="quick-pill" onClick={() => handleSend('Show My Tickets')}>
              🔍 My Tickets
            </button>
            <button className="quick-pill" onClick={() => handleSend('Billing 504 Timeout Help')}>
              💳 Billing Help
            </button>
            <button className="quick-pill" onClick={() => handleSend('How to enable 2FA')}>
              🔐 2FA Guide
            </button>
            <button className="quick-pill" onClick={() => handleSend('Create a new ticket')}>
              📝 New Ticket
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="ai-chat-footer"
          >
            <input
              type="text"
              placeholder="Ask ResolveAI (e.g., 'Track ticket 1', 'Refund policy', '2FA help')..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="ai-chat-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="ai-send-btn"
              title="Send message"
              aria-label="Send query"
            >
              ➔
            </button>
          </form>

          <div className="ai-chat-subfooter">
            <span>⚡ Powered by <strong>{llmProvider === 'gemini' ? 'Google Gemini' : llmProvider === 'openai' ? 'OpenAI' : 'ResolveAI Intelligence'}</strong></span>
            <button className="subfooter-cfg-btn" onClick={() => setShowSettings(!showSettings)}>
              ⚙️ Switch LLM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
