import { motion as Motion } from 'framer-motion';
import { LOGIN_PAUSED_TITLE, LOGIN_PAUSED_HOME_TEXT, LOGIN_PAUSED_LOGIN_TEXT } from '../config/loginPause';

// The "Database error" notice, in two sizes:
//   variant="home"  — white card with a pulsing icon and a Try again button
//   variant="login" — compact red panel that shakes once when it appears
//   variant="popup" — pop-up dialog over the login page (used when someone tries to log in)
// Words and the on/off switch live in src/config/loginPause.js.
const font = "'Manrope',system-ui,-apple-system,sans-serif";
const RED = '#9B2C1A';

const DbIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.7 3.1 3 7 3M5 12v6c0 1.7 3.1 3 7 3" />
    <path d="M19 6v4" />
    <path d="M19 14v4M19 21.5v.01" />
  </svg>
);

export default function PausedNotice({ variant = 'home', onClose }) {
  // Pop-up shown over the login page when someone tries to log in.
  if (variant === 'popup') {
    return (
      <Motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(28,20,16,.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', fontFamily: font }}>
        <Motion.div role="alertdialog" aria-modal="true" aria-labelledby="paused-title" aria-describedby="paused-text"
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.7, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          style={{ width: '100%', maxWidth: 340, boxSizing: 'border-box', padding: '28px 24px 22px', borderRadius: 26, background: '#FAF6F1', color: '#1C1410', textAlign: 'center', boxShadow: '0 24px 60px rgba(28,20,16,.3)' }}>
          <Motion.span
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.12 }}
            style={{ display: 'inline-grid', placeItems: 'center', width: 68, height: 68, borderRadius: 22, background: '#FBE4DE', color: RED }}>
            <Motion.span animate={{ x: [0, -4, 4, -3, 3, 0] }} transition={{ duration: 0.5, delay: 0.45 }} style={{ display: 'flex' }}>
              <DbIcon size={32} />
            </Motion.span>
          </Motion.span>
          <h2 id="paused-title" style={{ margin: '16px 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{LOGIN_PAUSED_TITLE}</h2>
          <p id="paused-text" style={{ margin: '0 0 22px', fontSize: 14.5, lineHeight: 1.55, color: '#54443A' }}>{LOGIN_PAUSED_LOGIN_TEXT}</p>
          <Motion.button type="button" autoFocus whileTap={{ scale: 0.97 }} onClick={onClose}
            style={{ width: '100%', minHeight: 52, borderRadius: 999, border: 0, background: '#B4410E', color: '#fff', font: `800 15px ${font}`, cursor: 'pointer', boxShadow: '0 10px 24px rgba(180,65,14,.28)' }}>
            OK
          </Motion.button>
        </Motion.div>
      </Motion.div>
    );
  }

  if (variant === 'login') {
    return (
      <Motion.div role="alert"
        initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: [0, -7, 6, -4, 3, 0] }} transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, marginBottom: 14, borderRadius: 16, background: '#FBE4DE', border: '1px solid #F2C4B8', fontFamily: font, textAlign: 'left' }}>
        <span style={{ flex: 'none', width: 36, height: 36, borderRadius: 11, background: '#fff', color: RED, display: 'grid', placeItems: 'center' }}><DbIcon size={19} /></span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: RED }}>{LOGIN_PAUSED_TITLE}</span>
          <span style={{ fontSize: 13, lineHeight: 1.5, color: '#7A2414' }}>{LOGIN_PAUSED_LOGIN_TEXT}</span>
        </span>
      </Motion.div>
    );
  }

  return (
    <div style={{ padding: '14px 16px 4px', background: '#FAF6F1' }}>
      <Motion.div role="alert"
        initial={{ opacity: 0, y: -14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'flex', gap: 14, alignItems: 'flex-start', maxWidth: 560, margin: '0 auto', padding: 16, borderRadius: 20, background: '#fff', border: '1px solid #F2C4B8', boxShadow: '0 12px 28px rgba(155,44,26,.10)', fontFamily: font, color: '#1C1410' }}>
        <Motion.span
          animate={{ boxShadow: ['0 0 0 0 rgba(155,44,26,.35)', '0 0 0 12px rgba(155,44,26,0)'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          style={{ flex: 'none', width: 44, height: 44, borderRadius: 14, background: '#FBE4DE', color: RED, display: 'grid', placeItems: 'center' }}>
          <DbIcon size={22} />
        </Motion.span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{LOGIN_PAUSED_TITLE}</span>
          <span style={{ fontSize: 13.5, lineHeight: 1.5, color: '#54443A' }}>{LOGIN_PAUSED_HOME_TEXT}</span>
          <Motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => window.location.reload()}
            style={{ alignSelf: 'flex-start', marginTop: 8, minHeight: 40, padding: '0 16px', borderRadius: 999, border: '1.5px solid #E7DCD1', background: '#fff', font: `800 13px ${font}`, color: '#1C1410', cursor: 'pointer' }}>
            Try again
          </Motion.button>
        </div>
      </Motion.div>
    </div>
  );
}
