import { useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useSEO } from './hooks/useSEO';

// Admin page: send a phone notification to everyone who turned notifications on.
// It calls the send-push-notification Edge Function. The sending password
// (PUSH_TRIGGER_SECRET) is typed in by the admin and kept only for this browser
// tab — it is never stored in the code, so opening this page alone sends nothing.
const V = { bg: '#FAF6F1', ink: '#1C1410', ink2: '#54443A', muted: '#75625A', line: '#E7DCD1', accent: '#B4410E', accentSoft: '#F6E6DA', green: '#1D7044', greenSoft: '#E3F1E8', red: '#9B2C1A', redSoft: '#FBE4DE' };
const font = "'Manrope',system-ui,-apple-system,sans-serif";
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`;
const SECRET_KEY = 'bs-admin-push-secret';

const PAGES = [
  ['/', 'Home'], ['/products', 'All bags'], ['/hot-deals', 'Hot deals'], ['/factory', 'Factory Direct'],
  ['/vendors', 'Vendors'], ['/upload-product', 'List a bag'], ['/profile', 'Profile'],
];
const CAMPAIGNS = [
  ['morning', 'Morning', 'New bags · everyone'],
  ['afternoon', 'Afternoon', 'Sellers with no bags'],
  ['evening', 'Evening', 'Features & deals · everyone'],
];
const TITLE_MAX = 50, BODY_MAX = 120;

const field = { width: '100%', boxSizing: 'border-box', padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${V.line}`, background: '#fff', font: `600 15px ${font}`, color: V.ink, outline: 'none' };
const label = { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, fontWeight: 700, color: V.ink2 };
const readSecret = () => { try { return sessionStorage.getItem(SECRET_KEY) || ''; } catch { return ''; } };

export default function AdminNotify() {
  const [secret, setSecret] = useState(readSecret);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/products');
  const [confirm, setConfirm] = useState(null); // payload waiting for "Yes, send"
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);   // { ok, text }

  useSEO({ title: 'Send notification | BagSearch admin', description: 'Send a phone notification to BagSearch users.', noindex: true });

  const saveSecret = (v) => { setSecret(v); try { sessionStorage.setItem(SECRET_KEY, v); } catch { /* private mode */ } };
  const ready = secret.trim().length >= 16;
  const canSend = ready && title.trim() && body.trim() && !busy;

  const send = async (payload) => {
    setBusy(true); setResult(null); setConfirm(null);
    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret.trim()}` },
        // A fresh tag per send, so a new message doesn't silently replace the last one.
        body: JSON.stringify(payload.audience ? { ...payload, tag: `bagsearch-admin-${Date.now()}` } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) setResult({ ok: false, text: 'Wrong sending password. Check it matches PUSH_TRIGGER_SECRET in Supabase.' });
      else if (!res.ok || data.error) setResult({ ok: false, text: data.error || `Could not send (error ${res.status}).` });
      else if (!data.sent) setResult({ ok: true, text: data.message || 'Sent to 0 phones. Nobody matched, or nobody has notifications on yet.' });
      else setResult({ ok: true, text: `Sent to ${data.sent} phone${data.sent === 1 ? '' : 's'}${data.title ? ` — "${data.title}"` : ''}.` });
    } catch {
      setResult({ ok: false, text: 'Could not reach the server. Check your connection and try again.' });
    } finally { setBusy(false); }
  };

  const custom = { audience: 'all', title: title.trim(), body: body.trim(), url };

  return (
    <div style={{ minHeight: '100dvh', background: V.bg, color: V.ink, fontFamily: font }}>
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 140px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: V.accent }}>Admin</div>
        <h1 style={{ margin: '6px 0 6px', fontSize: 'clamp(26px,5vw,34px)', fontWeight: 800, letterSpacing: '-.03em' }}>Send a notification</h1>
        <p style={{ margin: '0 0 26px', fontSize: 15, color: V.muted, lineHeight: 1.6, maxWidth: 560 }}>Goes to the phone of everyone who turned on BagSearch notifications.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
          {/* ── Form ── */}
          <Motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }}
            style={{ flex: '999 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label style={label}>
              Sending password
              <input type="password" autoComplete="off" value={secret} onChange={e => saveSecret(e.target.value)} placeholder="Your PUSH_TRIGGER_SECRET" style={field} />
              <span style={{ fontWeight: 600, fontSize: 12, color: V.muted }}>Kept only in this browser tab. Closing the tab forgets it.</span>
            </label>

            <label style={label}>
              <span style={{ display: 'flex', justifyContent: 'space-between' }}>Title <Count n={title.length} max={TITLE_MAX} /></span>
              <input value={title} maxLength={TITLE_MAX} onChange={e => setTitle(e.target.value)} placeholder="New bags just landed 👜" style={field} />
            </label>

            <label style={label}>
              <span style={{ display: 'flex', justifyContent: 'space-between' }}>Message <Count n={body.length} max={BODY_MAX} /></span>
              <textarea value={body} maxLength={BODY_MAX} rows={3} onChange={e => setBody(e.target.value)} placeholder="Fresh arrivals are in. See them before they go." style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} />
            </label>

            <label style={label}>
              Opens this page when tapped
              <select value={url} onChange={e => setUrl(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                {PAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>

            <Motion.button whileTap={canSend ? { scale: .98 } : undefined} disabled={!canSend} onClick={() => setConfirm({ payload: custom, what: `"${custom.title}" to everyone` })}
              style={{ minHeight: 54, borderRadius: 999, border: 0, font: `800 15px ${font}`, cursor: canSend ? 'pointer' : 'not-allowed', background: canSend ? V.accent : V.line, color: canSend ? '#fff' : V.muted, boxShadow: canSend ? '0 10px 24px rgba(180,65,14,.28)' : 'none', transition: 'background .25s' }}>
              {busy ? 'Sending…' : 'Send to everyone'}
            </Motion.button>

            <AnimatePresence>
              {result && (
                <Motion.p key={result.text} role={result.ok ? 'status' : 'alert'} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ margin: 0, padding: '13px 16px', borderRadius: 14, fontSize: 14, fontWeight: 700, lineHeight: 1.5, background: result.ok ? V.greenSoft : V.redSoft, color: result.ok ? V.green : V.red }}>
                  {result.text}
                </Motion.p>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 10, paddingTop: 22, borderTop: `1px solid ${V.line}` }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Send a daily message now</h2>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: V.muted, lineHeight: 1.5 }}>These also go out on their own at 8 am, 1 pm and 8 pm.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {CAMPAIGNS.map(([id, name, who]) => (
                  <Motion.button key={id} whileTap={ready && !busy ? { scale: .97 } : undefined} disabled={!ready || busy}
                    onClick={() => setConfirm({ payload: { campaign: id }, what: `the ${name.toLowerCase()} message (${who.toLowerCase()})` })}
                    style={{ flex: '1 1 150px', textAlign: 'left', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${V.line}`, background: '#fff', cursor: ready && !busy ? 'pointer' : 'not-allowed', opacity: ready ? 1 : .55, font: `800 14px ${font}`, color: V.ink }}>
                    {name}
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12, fontWeight: 600, color: V.muted }}>{who}</span>
                  </Motion.button>
                ))}
              </div>
            </div>
          </Motion.section>

          {/* ── Preview ── */}
          <Motion.aside aria-label="Preview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: .08, ease: [.22, 1, .36, 1] }}
            style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: V.muted, marginBottom: 10 }}>How it looks on a phone</div>
            <div style={{ borderRadius: 28, padding: '34px 14px 60px', background: V.ink }}>
              <Motion.div layout style={{ borderRadius: 18, padding: 12, background: 'rgba(255,255,255,.94)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <img src="/pwa-192x192.png" alt="" width="38" height="38" style={{ borderRadius: 10, flex: 'none', background: V.accentSoft }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, fontWeight: 700, color: V.muted }}><span>BagSearch</span><span>now</span></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: V.ink, lineHeight: 1.3, marginTop: 2, overflowWrap: 'anywhere' }}>{title || 'Your title'}</div>
                  <div style={{ fontSize: 13, color: V.ink2, lineHeight: 1.4, marginTop: 2, overflowWrap: 'anywhere' }}>{body || 'Your message shows here.'}</div>
                </div>
              </Motion.div>
            </div>
          </Motion.aside>
        </div>
      </main>

      {/* ── Confirm ── */}
      <AnimatePresence>
        {confirm && (
          <Motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(28,20,16,.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
            <Motion.div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={e => e.stopPropagation()}
              initial={{ scale: .94, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: .96, opacity: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              style={{ width: '100%', maxWidth: 400, background: V.bg, borderRadius: 22, padding: 22, boxSizing: 'border-box' }}>
              <h2 id="confirm-title" style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Send this now?</h2>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: V.ink2, lineHeight: 1.6 }}>This sends {confirm.what}. It can't be taken back once sent.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirm(null)} style={{ flex: 1, minHeight: 48, borderRadius: 999, border: `1px solid ${V.line}`, background: '#fff', font: `800 14px ${font}`, color: V.ink, cursor: 'pointer' }}>Cancel</button>
                <button autoFocus onClick={() => send(confirm.payload)} style={{ flex: 1, minHeight: 48, borderRadius: 999, border: 0, background: V.accent, color: '#fff', font: `800 14px ${font}`, cursor: 'pointer' }}>Yes, send</button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Count({ n, max }) {
  return <span style={{ fontWeight: 600, color: n >= max ? V.red : V.muted }}>{n}/{max}</span>;
}
