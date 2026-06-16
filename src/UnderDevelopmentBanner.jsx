import React, { useEffect, useState } from 'react';
import LogoIcon from './components/Logo.jsx';

export default function UnderDevelopmentBanner({ fullscreen = false, onEnter }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 400);
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onEnter?.(), 500);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(leaveTimer);
    };
  }, [onEnter]);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onEnter?.(), 450);
  };

  return (
    <>
      <style>{`
        @keyframes devCardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.93); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes devCardOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(24px) scale(0.93); }
        }
        @keyframes devProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes devPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,75,17,0.4); }
          50%       { box-shadow: 0 0 0 7px rgba(200,75,17,0); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 24,
          zIndex: 99999,
          width: 'min(300px, calc(100vw - 40px))',
          background: 'white',
          borderRadius: 18,
          border: '1.5px solid #f9c4a0',
          boxShadow: '0 20px 60px rgba(200,75,17,0.18), 0 4px 16px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          animation: visible
            ? leaving
              ? 'devCardOut 0.45s cubic-bezier(0.4,0,1,1) both'
              : 'devCardIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both'
            : 'none',
          pointerEvents: visible ? 'all' : 'none',
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#c84b11,#f97316,#ea580c)' }} />

        {/* Progress bar */}
        {!leaving && (
          <div style={{ height: 2, background: '#fde8d8' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg,#c84b11,#f97316)',
              animation: 'devProgress 4.6s linear both',
              animationDelay: '0.5s',
            }} />
          </div>
        )}

        <div style={{ padding: '14px 16px 18px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#f97316',
                animation: 'devPulse 1.8s ease-in-out infinite',
                flexShrink: 0,
              }} />
              <LogoIcon size={20} />
              <span style={{ fontSize: 12, fontWeight: 900, color: '#1a0a00', letterSpacing: '-0.02em' }}>
                Bag<span style={{ color: '#c84b11' }}>Search</span>
              </span>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                border: 'none', background: '#fde8d8',
                color: '#c84b11', cursor: 'pointer',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c84b11'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fde8d8'; e.currentTarget.style.color = '#c84b11'; }}
              aria-label="Dismiss"
            >✕</button>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#fde8d8,#fdf4ee)',
              border: '1.5px solid #f9c4a0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🚧</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 900, color: '#1a0a00', marginBottom: 4, letterSpacing: '-0.01em' }}>
                Still under development
              </p>
              <p style={{ fontSize: 11, color: '#9a6348', lineHeight: 1.6, fontWeight: 500 }}>
                Things may look rough around the edges. Use the <strong style={{ color: '#c84b11' }}>💬 Feedback</strong> button to tell us what to fix!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}