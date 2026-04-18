import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Eye, EyeOff, Mail, Lock, User, ArrowRight, ShieldCheck, Brain } from 'lucide-react';
import { api } from '../api';

const AuthPage = ({ onAuth }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api.login(form.email, form.password);
      } else {
        data = await api.register(form.name, form.email, form.password);
      }
      localStorage.setItem('mediclear_token', data.token);
      localStorage.setItem('mediclear_user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 14px 14px 44px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    background: '#F9FAFB',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  };

  const fields = mode === 'register'
    ? [
        { name: 'name', type: 'text', placeholder: 'Full Name', icon: <User size={18} /> },
        { name: 'email', type: 'email', placeholder: 'Email Address', icon: <Mail size={18} /> },
        { name: 'password', type: showPassword ? 'text' : 'password', placeholder: 'Password', icon: <Lock size={18} /> }
      ]
    : [
        { name: 'email', type: 'email', placeholder: 'Email Address', icon: <Mail size={18} /> },
        { name: 'password', type: showPassword ? 'text' : 'password', placeholder: 'Password', icon: <Lock size={18} /> }
      ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Left — Branding Panel */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563EB 50%, #0ea5e9 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', zIndex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '12px' }}>
              <Activity size={40} color="white" />
            </div>
            <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>Mediclear</h1>
          </div>

          <p style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '3rem', lineHeight: 1.6 }}>
            Clarity in Every<br />Medical Report
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            {[
              { icon: <Brain size={20} />, text: 'AI-powered report analysis' },
              { icon: <ShieldCheck size={20} />, text: '100% private & secure' },
              { icon: <Mail size={20} />, text: 'Understand results instantly' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.9 }}
              >
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '15px' }}>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Form Panel */}
      <div style={{
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem'
      }}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {mode === 'login' ? 'Welcome back 👋' : 'Create account 🎉'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
            {mode === 'login'
              ? 'Sign in to access your health reports.'
              : 'Join Mediclear and understand your health.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {fields.map(field => (
              <div key={field.name} style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex'
                }}>
                  {field.icon}
                </div>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
                {field.name === 'password' && (
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex'
                  }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            ))}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '10px', fontSize: '14px' }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ padding: '16px', fontSize: '16px', width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Please wait...' : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '14px' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setForm({ name: '', email: '', password: '' }); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '12px', color: '#9CA3AF' }}>
            This is not a medical diagnosis tool. Always consult a doctor.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
