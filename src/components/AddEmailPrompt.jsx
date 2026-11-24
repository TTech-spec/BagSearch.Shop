import { useContext, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/api';

// Shown on the profile page to accounts created for someone without an email
// (e.g. factory partners added by BagSearch). Such accounts carry
// user_metadata.needs_email = true and a placeholder login email.
// Supabase sends a confirmation link to the new address; the login email only
// switches once they click it.
const V = { ink:'#1C1410', muted:'#75625A', line:'#E7DCD1', accent:'#B4410E', green:'#1D7044', greenSoft:'#E3F1E8', red:'#9B2C1A', redSoft:'#FBE4DE' };
const font = "'Manrope',system-ui,-apple-system,sans-serif";

export default function AddEmailPrompt() {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [hidden, setHidden] = useState(false);

  const open = !!user?.user_metadata?.needs_email && !hidden;
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const save = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError(null);
    const clean = email.trim().toLowerCase();
    const { error: err } = await supabase.auth.updateUser({ email: clean, data: { needs_email: false, contact_email: clean } });
    if (err) { setError(err.message.includes('already') ? 'That email is already used by another account.' : 'Could not save your email. Please try again.'); setBusy(false); return; }
    await supabase.from('users').update({ email: clean }).eq('user_id', user.id);
    setBusy(false); setSent(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(28,20,16,.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: font }}>
          <Motion.div role="dialog" aria-modal="true" aria-labelledby="add-email-title"
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{ width: '100%', maxWidth: 460, margin: '0 12px 12px', background: '#FAF6F1', borderRadius: 24, padding: '26px 22px 22px', boxSizing: 'border-box', color: V.ink }}>
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <h2 id="add-email-title" style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>Check your inbox</h2>
                <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: V.muted }}>We sent a confirmation link to <b style={{ color: V.ink }}>{email.trim()}</b>. Open it to finish. After that, sign in with this email.</p>
                <button onClick={() => setHidden(true)} style={{ width: '100%', minHeight: 50, borderRadius: 999, border: 0, background: V.accent, color: '#fff', font: `800 15px ${font}`, cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <form onSubmit={save}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: V.accent }}>One last step</div>
                <h2 id="add-email-title" style={{ margin: '6px 0 8px', fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>Add your email address</h2>
                <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: V.muted }}>We use it for order updates, buyer messages and to help you sign in.</p>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, fontWeight: 700 }}>
                  Email address
                  <input type="email" autoComplete="email" autoFocus required value={email} onChange={e => { setEmail(e.target.value); setError(null); }} placeholder="you@company.com"
                    style={{ minHeight: 52, padding: '0 16px', borderRadius: 14, border: `1.5px solid ${V.line}`, background: '#fff', font: `600 15px ${font}`, color: V.ink, outline: 'none' }} />
                </label>
                {error && <p role="alert" style={{ margin: '12px 0 0', padding: '10px 14px', borderRadius: 12, background: V.redSoft, color: V.red, fontSize: 13, fontWeight: 600 }}>{error}</p>}
                <Motion.button type="submit" whileTap={valid ? { scale: .98 } : undefined} disabled={!valid || busy}
                  style={{ width: '100%', marginTop: 18, minHeight: 52, borderRadius: 999, border: 0, font: `800 15px ${font}`, cursor: valid ? 'pointer' : 'not-allowed', background: valid ? V.accent : V.line, color: valid ? '#fff' : V.muted }}>
                  {busy ? 'Saving…' : 'Save email'}
                </Motion.button>
              </form>
            )}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
