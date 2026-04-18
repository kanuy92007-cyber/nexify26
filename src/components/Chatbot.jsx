import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { api } from '../api';

const Chatbot = ({ reportContext, isAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your Mediclear AI assistant powered by Gemini. Ask me anything about your medical report!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Pass full history (excluding initial greeting for context)
      const history = messages.slice(1);
      const { reply } = await api.chat(input, reportContext, history);
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠️ I\'m having trouble connecting right now. Please make sure the backend server is running and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'What is hemoglobin?',
    'Is my cholesterol normal?',
    'What foods increase Vitamin D?'
  ];

  return (
    <>
      {/* Floating button */}
      <motion.button
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
          zIndex: 1000,
          padding: 0
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(v => !v)}
        title="AI Health Assistant"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              bottom: '7.5rem',
              right: '2rem',
              width: '380px',
              height: '520px',
              zIndex: 1000,
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
              background: 'white',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '8px', display: 'flex' }}>
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ color: 'white', margin: 0, fontSize: '15px' }}>Mediclear AI</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.85 }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E' }} />
                  Online · Powered by Gemini
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#F9FAFB' }}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                      : 'white',
                    color: msg.role === 'user' ? 'white' : '#111827',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  {msg.text}
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 14px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#9CA3AF' }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions (only show at start) */}
            {messages.length <= 1 && (
              <div style={{ padding: '0 1.25rem 0.75rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    style={{
                      padding: '5px 10px', border: '1.5px solid #E5E7EB', borderRadius: '20px',
                      fontSize: '12px', cursor: 'pointer', background: 'white', color: 'var(--primary)',
                      fontFamily: 'Inter, sans-serif', fontWeight: 500
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px', background: 'white' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isAuthenticated ? 'Ask anything about your report...' : 'Login to chat with AI...'}
                disabled={!isAuthenticated || loading}
                style={{
                  flex: 1,
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  background: isAuthenticated ? '#F9FAFB' : '#F3F4F6'
                }}
              />
              <motion.button
                className="btn btn-primary"
                style={{ padding: '10px 14px', borderRadius: '12px' }}
                onClick={handleSend}
                disabled={!isAuthenticated || loading || !input.trim()}
                whileTap={{ scale: 0.9 }}
              >
                {loading ? <Loader2 size={18} className="animate-spin-slow" /> : <Send size={18} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
