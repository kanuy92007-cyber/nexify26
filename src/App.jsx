import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import AuthPage from './pages/AuthPage';
import Landing from './pages/Landing';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import SetupKey from './pages/SetupKey';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('auth'); // Default to auth page
  const [currentReport, setCurrentReport] = useState(null);
  const [geminiReady, setGeminiReady] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // Restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mediclear_user');
      const token = localStorage.getItem('mediclear_token');
      if (saved && token) {
        setUser(JSON.parse(saved));
        setCurrentView('landing');
      }
    } catch {}
    setGeminiReady(true);
    setCheckingKey(false);
  }, []);

  const handleAuth = (userData) => {
    setUser(userData);
    setCurrentView('landing');
  };

  const handleLogout = () => {
    localStorage.removeItem('mediclear_token');
    localStorage.removeItem('mediclear_user');
    setUser(null);
    setCurrentView('landing');
    setCurrentReport(null);
  };

  const handleUploadComplete = (report) => {
    setCurrentReport(report);
    setCurrentView('dashboard');
  };

  const handleHistorySelect = (report) => {
    setCurrentReport(report);
    setCurrentView('dashboard');
  };

  // Loading state
  if (checkingKey) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)' }}>Starting Mediclear...</p>
        </div>
      </div>
    );
  }

  // Show API key setup if not configured
  if (!geminiReady) {
    return <SetupKey onKeySet={() => setGeminiReady(true)} />;
  }

  // Redirect to auth for protected routes
  if (!user && (currentView === 'upload' || currentView === 'dashboard' || currentView === 'history')) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // Full-page auth view
  if (currentView === 'auth') {
    return <AuthPage onAuth={handleAuth} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'landing':   return <Landing onStart={() => user ? setCurrentView('upload') : setCurrentView('auth')} user={user} />;
      case 'upload':    return <Upload onComplete={handleUploadComplete} />;
      case 'dashboard': return <Dashboard report={currentReport} />;
      case 'history':   return <History onSelect={handleHistorySelect} />;
      default:          return <Landing onStart={() => setCurrentView('upload')} user={user} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar
        onViewChange={setCurrentView}
        currentView={currentView}
        user={user}
        onLogout={handleLogout}
        onSetupKey={() => setGeminiReady(false)}
      />

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Chatbot
        reportContext={currentReport?.data || null}
        isAuthenticated={!!user}
      />
    </div>
  );
}

export default App;
