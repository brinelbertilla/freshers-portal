import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm your Freshers Portal assistant. Ask me anything about campus life, events, or placements." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { from: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/chat', { message: userMessage });
      setMessages((prev) => [...prev, { from: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: err.response?.data?.message || 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-avatar">🤖</span>
              <div>
                <div className="chat-title">Portal Assistant</div>
                <div className="chat-subtitle">Ask me anything</div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from}`}>{m.text}</div>
            ))}
            {loading && (
              <div className="chat-bubble bot chat-typing">
                <span></span><span></span><span></span>
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button className="chat-send-btn" onClick={send} disabled={!input.trim() || loading} aria-label="Send message">
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        className={`chat-toggle-btn ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}

export default ChatbotWidget;
