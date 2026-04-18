import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';

const SetupKey = ({ onKeySet }) => {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [message, setMessage] = useState('');

  // Check if key already set on backend
  useEffect(() => {
    fetch('http://localhost:5001/api/health')
      .then(r => r.json())
      .then(d => { if (d.geminiReady) onKeySet(); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key || key.trim().length < 10) {
      setStatus('error');
      setMessage('Please enter a valid API key.');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('http://localhost:5001/api/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('success');
      setMessage('API key verified and saved! Redirecting...');
      setTimeout(() => onKeySet(), 1200);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to set API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ maxWidth: '520px', width: '100%', padding: '3rem', textAlign: 'center' }}
      >
        <div style={{
          width: '72px', height: '72px',
          background: 'linear-gradient(135deg, var(--primary), #1D4ED8)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.75rem'
        }}>
          <Key size={36} color="white" />
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Setup Gemini API Key</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.7 }}>
          Mediclear uses Google Gemini AI to analyze your medical reports.
          Paste your API key below to get started.
        </p>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--primary)', fontSize: '14px', fontWeight: 600,
            marginBottom: '2rem', textDecoration: 'none'
          }}
        >
          Get your free API key at Google AI Studio <ExternalLink size={14} />
        </a>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={key}
              onChange={e => setKey(e.target.value)}
              required
              style={{
                width: '100%', padding: '14px 48px 14px 16px',
                border: '1.5px solid #E5E7EB', borderRadius: '12px',
                fontSize: '15px', fontFamily: 'monospace',
                outline: 'none', background: '#F9FAFB',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex'
              }}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {status && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px 16px', borderRadius: '10px', textAlign: 'left',
                background: status === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: status === 'success' ? '#166534' : '#991B1B',
                fontSize: '14px'
              }}
            >
              {status === 'success' ? <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />}
              {message}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ padding: '16px', fontSize: '16px', opacity: key ? 1 : 0.5 }}
          >
            {loading ? 'Verifying...' : '🚀 Activate Mediclear AI'}
          </motion.button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '12px', color: '#9CA3AF' }}>
          Your API key is stored only in the local server session and is never shared.
        </p>
      </motion.div>
    </div>
  );
};

export default SetupKey;
