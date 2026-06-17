import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookieConsent')) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 2147483647,
      background: 'white',
      borderTop: '1.5px solid #f0d9cc',
      boxShadow: '0 -8px 32px rgba(200,75,17,0.12)',
      padding: 'clamp(14px,3vw,22px) clamp(16px,4vw,32px)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
    }}>
      <p style={{ margin: 0, fontSize: 13, color: '#5c3317', lineHeight: 1.65, flex: '1 1 280px', maxWidth: 680 }}>
        BagSearch uses cookies and similar technologies to improve your browsing experience and to serve personalised
        advertisements through Google AdSense. By clicking <strong>Accept All</strong>, you consent to our use of
        cookies as described in our{' '}
        <a href="/policy" style={{ color: '#c84b11', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</a>.
        You may decline non-essential cookies at any time.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: '1.5px solid #f0d9cc',
            background: 'white',
            color: '#9a6348',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff5ee'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: '10px 22px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg,#c84b11,#f97316)',
            color: 'white',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(200,75,17,0.35)',
            transition: 'transform 0.15s,box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,75,17,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(200,75,17,0.35)'; }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
