import React from 'react';
import { Activity, History, Shield, LogOut, User } from 'lucide-react';

const Navbar = ({ onViewChange, currentView, user, onLogout }) => {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '68px'
    }}>
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => onViewChange('landing')}
      >
        <div style={{ background: 'linear-gradient(135deg, var(--primary), #1D4ED8)', borderRadius: '10px', padding: '7px', display: 'flex' }}>
          <Activity size={22} color="white" />
        </div>
        <span style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>Mediclear</span>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <button
              className={`btn ${currentView === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onViewChange('upload')}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Upload Report
            </button>
            <button
              className={`btn ${currentView === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onViewChange('history')}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              <History size={16} /> History
            </button>

            {/* User pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(37, 99, 235, 0.08)', borderRadius: '20px',
              padding: '6px 14px'
            }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="white" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
            </div>

            <button
              className="btn btn-secondary"
              onClick={onLogout}
              style={{ padding: '8px 14px', fontSize: '14px' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <Shield size={16} color="var(--secondary)" />
              <span>Secure & Private</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => onViewChange('auth')}
              style={{ padding: '9px 20px', fontSize: '14px' }}
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
