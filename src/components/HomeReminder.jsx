import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { enablePushNotifications, getPushPermissionState, hasStoredPushSubscription, isPushSupported } from '../services/pushNotifications';

// One small reminder on the home page asking signed-in users to turn on
// notifications. Same idea as NetFun's HomeReminder: ✕ hides it for 3 days.
//   off          → "Turn on" (asks the browser for permission)
//   needs-install→ iPhone in Safari: add to Home Screen first, with steps
//   denied       → blocked in settings: explain how to allow
const HOME_PATHS = ['/', '/products'];
const HIDE_KEY = 'bs-notif-reminder-hidden-until';
const DAYS_3 = 3 * 24 * 60 * 60 * 1000;
const V = { ink: '#1C1410', muted: '#75625A', line: '#E7DCD1', accent: '#B4410E', accentSoft: '#F6E6DA' };
const font = "'Manrope',system-ui,-apple-system,sans-serif";

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const hiddenNow = () => { try { return Date.now() < Number(localStorage.getItem(HIDE_KEY) || 0); } catch { return false; } };

async function readStatus(userId) {
  if (isIos() && !isStandalone()) return 'needs-install';
  if (!isPushSupported()) return 'unsupported';
  const perm = await getPushPermissionState();
  if (perm === 'denied') return 'denied';
  if (perm === 'granted' && await hasStoredPushSubscription(userId).catch(() => false)) return 'on';
  return 'off';
}

const COPY = {
  off: { title: 'Turn on notifications', body: 'Get price drops, order updates and seller replies.' },
  'needs-install': { title: 'Add BagSearch to your Home Screen', body: 'Then you can turn on notifications.' },
  denied: { title: 'Notifications are blocked', body: 'Allow them in your browser settings to get order updates.' },
};

export default function HomeReminder() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();
  const [status, setStatus] = useState(null);
  const [hidden, setHidden] = useState(hiddenNow);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    readStatus(user.id).then(s => { if (alive) setStatus(s); }).catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);

  const show = !!user && HOME_PATHS.includes(pathname) && !hidden && COPY[status];
  const dismiss = () => {
    try { localStorage.setItem(HIDE_KEY, String(Date.now() + DAYS_3)); } catch { /* private mode */ }
    setHidden(true);
  };
  const turnOn = async () => {
    setBusy(true); setErr('');
    try { await enablePushNotifications(user.id); setStatus('on'); }
    catch (e) {
      const perm = await getPushPermissionState().catch(() => 'default');
      if (perm === 'denied') setStatus('denied'); else setErr(e?.message || 'Could not turn on notifications.');
    } finally { setBusy(false); }
  };

  const copy = COPY[status] || COPY.off;
  const action = status === 'off'
    ? { label: busy ? '…' : 'Turn on', onClick: turnOn }
    : { label: steps ? 'Close' : 'How', onClick: () => setSteps(s => !s) };

  return (
    <AnimatePresence>
      {show && (
        <Motion.aside key="reminder" role="status" aria-live="polite"
          initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.8 }}
          style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(96px + env(safe-area-inset-bottom))', zIndex: 45, maxWidth: 440, margin: '0 auto', background: '#fff', border: `1px solid ${V.line}`, borderRadius: 20, boxShadow: '0 14px 34px rgba(28,20,16,.14)', fontFamily: font, color: V.ink, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px 12px 12px' }}>
            <Motion.span aria-hidden="true" animate={{ rotate: [0, -14, 12, -8, 6, 0] }} transition={{ duration: 0.9, delay: 1.4, repeat: 2, repeatDelay: 4 }}
              style={{ flex: 'none', width: 40, height: 40, borderRadius: 12, background: V.accentSoft, color: V.accent, display: 'grid', placeItems: 'center', transformOrigin: '50% 10%' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            </Motion.span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>{copy.title}</div>
              <div style={{ fontSize: 12.5, color: V.muted, lineHeight: 1.4, marginTop: 2 }}>{err || copy.body}</div>
            </div>
            <Motion.button whileTap={{ scale: 0.95 }} onClick={action.onClick} disabled={busy}
              style={{ flex: 'none', minHeight: 38, padding: '0 14px', borderRadius: 999, border: 0, background: V.accent, color: '#fff', font: `800 13px ${font}`, cursor: 'pointer' }}>
              {action.label}
            </Motion.button>
            <button onClick={dismiss} aria-label="Hide for 3 days"
              style={{ flex: 'none', width: 32, height: 32, borderRadius: 999, border: 0, background: 'transparent', color: V.muted, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <AnimatePresence initial={false}>
            {steps && (
              <Motion.ol key="steps" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ margin: 0, padding: '0 16px 14px 36px', fontSize: 13, lineHeight: 1.7, color: V.ink, overflow: 'hidden' }}>
                {status === 'needs-install' ? <>
                  <li>Open BagSearch in <b>Safari</b>.</li>
                  <li>Tap the <b>Share</b> button.</li>
                  <li>Choose <b>Add to Home Screen</b>, then open BagSearch from your Home Screen.</li>
                </> : <>
                  <li>Tap the <b>lock icon</b> next to the web address.</li>
                  <li>Open <b>Permissions</b> or <b>Site settings</b>.</li>
                  <li>Set <b>Notifications</b> to <b>Allow</b>, then reload.</li>
                </>}
              </Motion.ol>
            )}
          </AnimatePresence>
        </Motion.aside>
      )}
    </AnimatePresence>
  );
}
