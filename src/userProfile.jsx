import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, History, AlertCircle, ArrowLeft, Upload, Check, X, Pencil, Loader } from 'lucide-react';
import { supabase } from './services/api';
import { deleteFromPinecone } from './services/pinecone';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  primary:      '#c84b11',
  primaryLight: '#f97316',
  primaryBg:    '#fde8d8',
  primaryPale:  '#fdf4ee',
  primaryBorder:'#f9c4a0',
  accent:       '#ea580c',
  success:      '#16a34a',
  successBg:    '#dcfce7',
  danger:       '#dc2626',
  dangerBg:     '#fef2f2',
  surface:      '#ffffff',
  surfaceDim:   '#fdf8f5',
  border:       '#f0d9cc',
  borderLight:  '#f7ece4',
  text:         '#1a0a00',
  textMid:      '#5c3317',
  textMuted:    '#9a6348',
  textFaint:    '#c4957a',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function fmtShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

function AnimatedNumber({ target, duration = 1200, delay = 0 }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target == null || started.current) return;
    const t = setTimeout(() => {
      started.current = true;
      const steps = 40;
      const stepTime = duration / steps;
      let current = 0;
      const timer = setInterval(() => {
        current++;
        setCount(Math.round((target / steps) * current));
        if (current >= steps) { setCount(target); clearInterval(timer); }
      }, stepTime);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return <>{count}</>;
}

function Skeleton({ style = {} }) {
  return (
    <div aria-hidden="true" style={{
      background: `linear-gradient(90deg, ${C.primaryBg} 25%, ${C.surfaceDim} 50%, ${C.primaryBg} 75%)`,
      backgroundSize: '400px 100%',
      animation: 'skeletonShimmer 1.6s ease infinite',
      borderRadius: 8,
      ...style,
    }} />
  );
}

const Icon = ({ name, size = 22 }) => (
  <span style={{ fontFamily: "'Material Symbols Outlined'", fontWeight: 'normal', fontStyle: 'normal', fontSize: size, lineHeight: 1, display: 'inline-block', textTransform: 'none', letterSpacing: 'normal', wordWrap: 'normal', whiteSpace: 'nowrap', direction: 'ltr' }}>{name}</span>
);

// ─── Inline Edit Field ────────────────────────────────────────────────────────
function EditableField({ icon, iconBg, iconBorder, label, value, field, onSave, loading, type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value ?? '');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [hovered, setHovered] = useState(false);
  const [ripple,  setRipple]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const startEdit = () => { setDraft(value ?? ''); setEditing(true); setError(''); };
  const cancel    = () => { setEditing(false); setError(''); setDraft(value ?? ''); };

  const save = async () => {
    if (draft.trim() === (value ?? '').trim()) { cancel(); return; }
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.trim())) { setError('Invalid email address'); return; }
    if (field === 'phone' && draft.trim() && !/^\+?[\d\s\-()]{7,}$/.test(draft.trim())) { setError('Invalid phone number'); return; }
    if (field === 'full_name' && draft.trim().length < 2) { setError('Name too short'); return; }
    setSaving(true);
    try {
      await onSave(field, draft.trim());
      setEditing(false); setSaved(true); setRipple(true);
      setTimeout(() => setSaved(false), 2200);
      setTimeout(() => setRipple(false), 600);
    } catch (e) { setError(e.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const onKey = (e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px', borderRadius: 14, background: editing ? C.primaryBg : hovered ? C.surfaceDim : 'transparent', border: `1.5px solid ${editing ? C.primary : hovered ? C.border : 'transparent'}`, transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden' }}>
      {ripple && <div style={{ position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none', background: `radial-gradient(circle at 50% 50%, ${C.successBg} 0%, transparent 70%)`, animation: 'rippleFade 0.6s ease-out forwards' }} />}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: editing ? C.surface : iconBg, border: `1.5px solid ${editing ? C.primaryBorder : iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s ease', transform: editing ? 'scale(1.12)' : 'scale(1)', boxShadow: editing ? `0 4px 16px ${C.primaryBorder}` : 'none' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 4 }}>{label}</p>
        {loading ? <Skeleton style={{ height: 14, width: 140 }} /> : editing ? (
          <div>
            <input ref={inputRef} type={type} value={draft} onChange={e => { setDraft(e.target.value); setError(''); }} onKeyDown={onKey} placeholder={`Enter ${label.toLowerCase()}…`}
              style={{ width: '100%', fontSize: 13, fontWeight: 600, color: C.text, background: C.surface, border: `1.5px solid ${error ? C.danger : C.primaryBorder}`, borderRadius: 8, padding: '6px 10px', outline: 'none', fontFamily: "'Manrope', sans-serif", transition: 'border-color 0.2s', boxShadow: `0 0 0 3px ${error ? C.dangerBg : C.primaryBg}` }}/>
            {error && <p style={{ fontSize: 10, color: C.danger, marginTop: 4, fontWeight: 600, animation: 'shakeError 0.3s ease' }}>⚠ {error}</p>}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: saving ? C.primaryBg : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, border: 'none', color: saving ? C.primary : '#fff', cursor: saving ? 'default' : 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: saving ? 'none' : `0 3px 12px rgba(200,75,17,0.35)` }}>
                {saving ? <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={11} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={cancel} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: 'transparent', border: `1.5px solid ${C.border}`, color: C.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                <X size={11} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{value ?? '—'}</p>
            {saved && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: C.success, animation: 'fadeUpIn 0.3s ease' }}><Check size={10} /> Saved</span>}
          </div>
        )}
      </div>
      {!editing && !loading && (
        <button onClick={startEdit} aria-label={`Edit ${label}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: hovered ? C.primaryBg : 'transparent', border: `1px solid ${hovered ? C.primaryBorder : 'transparent'}`, cursor: 'pointer', color: C.textFaint, transition: 'all 0.25s ease', opacity: hovered ? 1 : 0, transform: hovered ? 'scale(1) rotate(0deg)' : 'scale(0.7) rotate(-15deg)', flexShrink: 0, alignSelf: 'flex-start', marginTop: 12 }}
          onMouseEnter={e => { e.currentTarget.style.color = C.primary; e.currentTarget.style.transform = 'scale(1.15) rotate(0deg)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.textFaint; e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}>
          <Pencil size={12} />
        </button>
      )}
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────
function HistoryRow({ item, index }) {
  const [hovered, setHovered] = useState(false);
  const isImage = item.type === 'image';
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: hovered ? C.surfaceDim : C.primaryPale, border: `1px solid ${hovered ? C.border : C.borderLight}`, transition: 'all 0.2s ease', cursor: 'default', animation: `historyIn 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 50}ms both` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: isImage ? C.accent : C.primary, flexShrink: 0, boxShadow: `0 0 6px ${isImage ? C.accent : C.primary}` }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.query}</p>
          <p style={{ fontSize: 10, color: C.textFaint, marginTop: 1 }}>{fmtShort(item.created_at)}</p>
        </div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBorder}`, flexShrink: 0, marginLeft: 8 }}>{item.type}</span>
    </div>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({ value, label, icon, color, glow, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: '22px 20px', borderRadius: 14, textAlign: 'center', background: hovered ? glow : C.surfaceDim, border: `1px solid ${hovered ? color + '44' : C.borderLight}`, transition: 'all 0.3s ease', transform: hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hovered ? `0 8px 28px ${glow}` : 'none', cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><Icon name={icon} size={22} /></div>
      <p style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6, fontFamily: "'Manrope', sans-serif" }}>
        {value != null ? <AnimatedNumber target={value} duration={1000} delay={delay} /> : 0}
      </p>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', visible }) {
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`, opacity: visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)', zIndex: 999, pointerEvents: 'none', background: type === 'success' ? C.success : C.danger, color: '#fff', padding: '10px 22px', borderRadius: 40, fontSize: 13, fontWeight: 700, fontFamily: "'Manrope', sans-serif", boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
      {type === 'success' ? <Check size={14} /> : <X size={14} />}
      {message}
    </div>
  );
}

// ─── Name editor in hero ──────────────────────────────────────────────────────
function InlineNameEditor({ value, onSave, loading }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const startEdit = () => { setDraft(value ?? ''); setEditing(true); setError(''); };
  const cancel    = () => { setEditing(false); setError(''); };
  const save = async () => {
    if (!draft.trim() || draft.trim().length < 2) { setError('Name too short'); return; }
    if (draft.trim() === (value ?? '').trim()) { cancel(); return; }
    setSaving(true);
    try { await onSave('full_name', draft.trim()); setEditing(false); }
    catch (e) { setError(e.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };
  const onKey = (e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); };

  if (loading) return <Skeleton style={{ height: 42, width: 220 }} />;
  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input ref={inputRef} value={draft} onChange={e => { setDraft(e.target.value); setError(''); }} onKeyDown={onKey}
            style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 900, color: C.text, background: 'rgba(255,255,255,0.9)', border: `2px solid ${error ? C.danger : C.primary}`, borderRadius: 10, padding: '6px 14px', outline: 'none', fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.04em', boxShadow: `0 0 0 4px ${error ? C.dangerBg : C.primaryBg}`, transition: 'all 0.2s' }}/>
          <button onClick={save} disabled={saving} style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, border: 'none', cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px rgba(200,75,17,0.4)`, transition: 'all 0.2s' }}>
            {saving ? <Loader size={14} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={14} color="#fff" />}
          </button>
          <button onClick={cancel} style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.7)', border: `1.5px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <X size={14} color={C.textMuted} />
          </button>
        </div>
        {error && <p style={{ fontSize: 11, color: C.danger, fontWeight: 600, animation: 'shakeError 0.3s ease' }}>⚠ {error}</p>}
      </div>
    );
  }
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={startEdit}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px 4px 4px', borderRadius: 10, margin: '-4px -8px -4px -4px', background: hovered ? 'rgba(200,75,17,0.08)' : 'transparent', border: `1.5px solid ${hovered ? C.primaryBorder : 'transparent'}`, transition: 'all 0.25s ease' }} title="Click to edit name">
      <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: C.text, letterSpacing: '-0.04em', fontFamily: "'Manrope', sans-serif", lineHeight: 1, margin: 0 }}>{value ?? '—'}</h1>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: hovered ? C.primaryBg : 'transparent', border: `1px solid ${hovered ? C.primaryBorder : 'transparent'}`, opacity: hovered ? 1 : 0, transform: hovered ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-20deg)', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <Pencil size={12} color={C.primary} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── DELETE ACCOUNT MODAL ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function DeleteAccountModal({ visible, onClose, onConfirm, deleting, deleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [shake,       setShake]       = useState(false);
  const inputRef = useRef(null);
  const isValid = confirmText.trim().toUpperCase() === 'DELETE';

  useEffect(() => {
    if (!visible) { setConfirmText(''); setShake(false); }
    if (visible) setTimeout(() => inputRef.current?.focus(), 420);
  }, [visible]);

  const handleInput = (e) => {
    setConfirmText(e.target.value);
    if (e.target.value.length >= 5 && e.target.value.trim().toUpperCase() !== 'DELETE') {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!visible) return null;

  const warnings = [
    { icon: 'inventory_2', isX: false, text: <><strong style={{ color: '#dc2626', fontWeight: 800 }}>All your orders and saved items</strong> will be permanently removed with no recovery.</> },
    { icon: 'history',     isX: false, text: <><strong style={{ color: '#dc2626', fontWeight: 800 }}>Your search history and activity</strong> will be wiped from our servers entirely.</> },
    { icon: 'person',      isX: false, text: <><strong style={{ color: '#dc2626', fontWeight: 800 }}>Your profile, name, and contact info</strong> will be deleted forever.</> },
    { icon: 'block',       isX: true,  text: <><strong style={{ color: '#dc2626', fontWeight: 800 }}>This action is irreversible.</strong> You will need to create a brand-new account to use BagSearch again.</> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={!deleting && !deleted ? onClose : undefined}
        style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(10,0,0,0.65)', backdropFilter: 'blur(6px)', animation: 'dmOverlayIn 0.25s ease' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 601,
        width: 'min(460px, calc(100vw - 32px))',
        background: '#ffffff', borderRadius: 24,
        boxShadow: '0 40px 100px rgba(0,0,0,0.28), 0 8px 24px rgba(220,38,38,0.14)',
        overflow: 'hidden',
        animation: shake ? 'dmShakeX 0.5s ease' : 'dmModalPop 0.42s cubic-bezier(0.34,1.28,0.64,1) both',
      }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a0000 0%, #320a0a 60%, #1a0000 100%)', padding: '28px 28px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(220,38,38,0.13)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 20, width: 110, height: 110, borderRadius: '50%', background: 'rgba(220,38,38,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 70, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)', animation: 'dmScan 3s ease-in-out infinite', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Animated trash icon */}
            <div style={{ width: 54, height: 54, borderRadius: 17, background: 'rgba(220,38,38,0.2)', border: '1.5px solid rgba(220,38,38,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, animation: 'dmIconEntrance 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.08s both' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#ef4444" style={{ animation: 'dmTrashWiggle 0.7s ease-in-out 0.65s' }}>
                <path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/>
              </svg>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6, fontFamily: "'Manrope', sans-serif", lineHeight: 1.1 }}>Delete Your Account</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', fontWeight: 500 }}>This action is permanent and cannot be undone</div>
              </div>
              {!deleting && !deleted && (
                <button onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success state */}
        {deleted ? (
          <div style={{ padding: '44px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'dmFadeUp 0.4s ease' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#dcfce7', border: '2.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M4 12l5 5 11-11" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'dmCheckDraw 0.6s ease 0.1s forwards' }}/>
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8 }}>Account Deleted</div>
            <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, lineHeight: 1.65, maxWidth: 280 }}>
              Your account and all data have been permanently removed. Redirecting you now…
            </div>
          </div>
        ) : (
          <>
            {/* Body */}
            <div style={{ padding: '22px 28px' }}>
              {/* Warning list */}
              <div style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                {warnings.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < warnings.length - 1 ? '1px solid #fee2e2' : 'none', opacity: 0, animation: `dmFadeUp 0.4s ease ${80 + i * 80}ms both` }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: w.isX ? '#dc2626' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon name={w.icon} size={13} />
                    </div>
                    <div style={{ fontSize: 12, color: '#7f1d1d', fontWeight: 600, lineHeight: 1.65 }}>{w.text}</div>
                  </div>
                ))}
              </div>

              {/* Confirm input */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Type <span style={{ color: C.danger, fontWeight: 900 }}>DELETE</span> to confirm
                </label>
                <input ref={inputRef} type="text" value={confirmText} onChange={handleInput} placeholder="DELETE" autoComplete="off" disabled={deleting}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `2px solid ${isValid ? '#dc2626' : C.border}`, background: isValid ? '#fff5f5' : C.surfaceDim, fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Manrope', monospace", outline: 'none', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)', boxShadow: isValid ? '0 0 0 4px rgba(220,38,38,0.09)' : 'none', letterSpacing: '0.08em' }}/>
                {confirmText.length > 0 && !isValid && (
                  <p style={{ fontSize: 10, color: C.danger, fontWeight: 600, marginTop: 5, paddingLeft: 2, animation: 'dmFadeUp 0.25s ease both' }}>
                    Type DELETE exactly (all caps) to proceed
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10 }}>
              <button onClick={onClose} disabled={deleting}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: 'white', fontSize: 13, fontWeight: 700, color: C.textMid, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: "'Manrope', sans-serif", transition: 'all 0.2s', opacity: deleting ? 0.5 : 1 }}
                onMouseEnter={e => { if (!deleting) { e.currentTarget.style.background = C.primaryPale; e.currentTarget.style.borderColor = C.primaryBorder; }}}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = C.border; }}>
                Cancel
              </button>
              <button onClick={() => isValid && !deleting && onConfirm()} disabled={!isValid || deleting}
                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: isValid && !deleting ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : '#fca5a5', fontSize: 13, fontWeight: 800, color: 'white', cursor: isValid && !deleting ? 'pointer' : 'not-allowed', fontFamily: "'Manrope', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: isValid && !deleting ? '0 6px 20px rgba(220,38,38,0.38)' : 'none', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { if (isValid && !deleting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(220,38,38,0.5)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = isValid && !deleting ? '0 6px 20px rgba(220,38,38,0.38)' : 'none'; }}>
                {isValid && !deleting && <div style={{ position: 'absolute', top: 0, bottom: 0, width: 50, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', animation: 'dmScan 2s ease-in-out infinite', pointerEvents: 'none' }} />}
                {deleting
                  ? <Loader size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/></svg>
                }
                {deleting ? 'Deleting account…' : 'Permanently Delete'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes dmOverlayIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dmModalPop     { from { opacity: 0; transform: translate(-50%,-50%) scale(0.92); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes dmShakeX       { 0%,100%{transform:translate(-50%,-50%)} 15%{transform:translate(calc(-50% - 8px),-50%)} 30%{transform:translate(calc(-50% + 6px),-50%)} 45%{transform:translate(calc(-50% - 5px),-50%)} 60%{transform:translate(calc(-50% + 3px),-50%)} 75%{transform:translate(calc(-50% - 2px),-50%)} }
        @keyframes dmIconEntrance  { from { opacity: 0; transform: rotate(-90deg) scale(0.4); } to { opacity: 1; transform: rotate(0deg) scale(1); } }
        @keyframes dmTrashWiggle   { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-9deg)} 75%{transform:rotate(9deg)} }
        @keyframes dmScan          { from { transform: translateX(-100%); } to { transform: translateX(700%); } }
        @keyframes dmFadeUp        { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dmCheckDraw     { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
      `}</style>
    </>
  );
}

// ─── Danger Zone Card ─────────────────────────────────────────────────────────
function DangerZoneCard({ onDeleteClick, visible }) {
  const [hovered,    setHovered]    = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
        border: `1.5px solid ${hovered ? '#fecaca' : C.borderLight}`,
        borderRadius: 20, padding: '28px',
        boxShadow: hovered ? '0 8px 36px rgba(220,38,38,0.08)' : `0 4px 32px rgba(200,75,17,0.05)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.3s',
        position: 'relative', overflow: 'hidden',
      }}>

      {/* Hover tint */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 100% 0%, rgba(220,38,38,0.04) 0%, transparent 60%)', opacity: hovered ? 1 : 0, transition: 'opacity 0.4s ease' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: hovered ? '#fee2e2' : C.dangerBg, border: `1.5px solid ${hovered ? '#fca5a5' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', transform: hovered ? 'rotate(-5deg) scale(1.1)' : 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill={hovered ? C.danger : '#ef4444'} style={{ transition: 'fill 0.3s' }}>
              <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19H3.5L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: hovered ? C.danger : C.text, letterSpacing: '-0.02em', transition: 'color 0.3s', marginBottom: 2 }}>Danger Zone</h2>
            <p style={{ fontSize: 10, color: C.textFaint, fontWeight: 500 }}>Irreversible account actions</p>
          </div>
          {/* Pulsing danger indicator */}
          <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.danger, opacity: 0.3, animation: 'dangerPing 1.8s ease-out infinite' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.danger, position: 'relative', zIndex: 1 }} />
          </div>
        </div>

        {/* Description */}
        <div style={{ background: hovered ? '#fff5f5' : C.surfaceDim, border: `1px solid ${hovered ? '#fecaca' : C.borderLight}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20, transition: 'all 0.3s ease' }}>
          <p style={{ fontSize: 12, color: hovered ? '#7f1d1d' : C.textMuted, fontWeight: 500, lineHeight: 1.65, transition: 'color 0.3s' }}>
            Deleting your account will <strong style={{ color: hovered ? C.danger : C.textMid, fontWeight: 700 }}>permanently erase</strong> all your data — orders, saved items, search history, and your profile. <strong style={{ color: hovered ? C.danger : C.textMid, fontWeight: 700 }}>This cannot be undone.</strong>
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={onDeleteClick}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            padding: '13px 20px', borderRadius: 12,
            border: `1.5px solid ${btnHovered ? 'transparent' : '#fca5a5'}`,
            background: btnHovered ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : '#fff5f5',
            color: btnHovered ? 'white' : C.danger,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
            transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
            boxShadow: btnHovered ? '0 8px 24px rgba(220,38,38,0.38)' : 'none',
            transform: btnHovered ? 'translateY(-2px)' : 'none',
            position: 'relative', overflow: 'hidden',
          }}>
          {btnHovered && <div style={{ position: 'absolute', top: 0, bottom: 0, width: 50, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', animation: 'dmScan 2s ease-in-out infinite', pointerEvents: 'none' }} />}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ transition: 'transform 0.3s', transform: btnHovered ? 'rotate(-8deg)' : 'none' }}>
            <path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/>
          </svg>
          Delete My Account
        </button>
      </div>

      <style>{`
        @keyframes dangerPing { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.8); opacity: 0; } }
        @keyframes dmScan { from { transform: translateX(-100%); } to { transform: translateX(700%); } }
      `}</style>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function UserProfile() {
  const navigate = useNavigate();
  const [profile,       setProfile]       = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [toast,         setToast]         = useState({ visible: false, message: '', type: 'success' });

  // ── Delete state ──
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [deleted,         setDeleted]         = useState(false);

  const [headerIn, setHeaderIn] = useState(false);
  const [heroIn,   setHeroIn]   = useState(false);
  const [cardsIn,  setCardsIn]  = useState(false);
  const [statsIn,  setStatsIn]  = useState(false);
  const [dangerIn, setDangerIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeaderIn(true), 80);
    setTimeout(() => setHeroIn(true),   240);
    setTimeout(() => setCardsIn(true),  420);
    setTimeout(() => setStatsIn(true),  580);
    setTimeout(() => setDangerIn(true), 720);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    async function loadAll() {
      setLoading(true); setError(null);
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        if (!user)   throw new Error('Not authenticated. Please sign in.');
        const userId = user.id;

        const { data: profileData } = await supabase
          .from('users').select('user_id, full_name, email, phone, role, created_at')
          .eq('user_id', userId).maybeSingle();

        setProfile(profileData || {
          user_id: user.id, full_name: user.user_metadata?.full_name || 'User',
          email: user.email, phone: user.user_metadata?.phone || '',
          role: user.user_metadata?.role || 'buyer', created_at: user.created_at,
        });

        const { data: historyData, error: historyErr } = await supabase
          .from('search_history').select('query, created_at, type')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(10);

        if (historyErr) { console.warn('Search history not available:', historyErr.message); setSearchHistory([]); }
        else setSearchHistory(historyData ?? []);

        const total  = historyData?.length ?? 0;
        const images = historyData?.filter(h => h.type === 'image').length ?? 0;

        const [ordersResult, savedResult] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('saved_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);

        setStats({
          totalSearches: total, imageSearches: images,
          orders:     ordersResult.error ? 0 : (ordersResult.count ?? 0),
          savedItems: savedResult.error  ? 0 : (savedResult.count  ?? 0),
        });
      } catch (err) {
        console.error('Profile load error:', err);
        setError(err.message ?? 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleSave = async (field, newValue) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error: dbErr } = await supabase.from('users').update({ [field]: newValue }).eq('user_id', user.id);
    if (dbErr) throw dbErr;
    if (field === 'email') {
      const { error: authErr } = await supabase.auth.updateUser({ email: newValue });
      if (authErr) throw authErr;
    }
    if (field === 'full_name') await supabase.auth.updateUser({ data: { full_name: newValue } });
    setProfile(prev => ({ ...prev, [field]: newValue }));
    showToast(`${field === 'full_name' ? 'Name' : field === 'email' ? 'Email' : 'Phone'} updated!`, 'success');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      // 1. If user is a seller, delete their products from Pinecone first
      // We do this here because the Edge Function doesn't have Pinecone access
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .or(`user_id.eq.${userId},seller_id.eq.${userId}`);

      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);
        await deleteFromPinecone(productIds);
      }

      // 2. Call the Edge Function to delete the auth user and all related data
      let detail = '';
      try {
        const { data: fnData, error: functionError } = await supabase.functions.invoke('delete-account');

        if (functionError) {
          // Try to get more details from the error
          detail = functionError.message;
          if (functionError.context) {
            try {
              const body = await functionError.context.json();
              detail = body?.error || body?.message || detail;
            } catch (_) {}
          }
          console.error('Edge function error:', functionError);
          console.error('Edge function error detail:', detail);
          throw new Error(detail || 'Failed to delete account. Please try again.');
        }

        if (fnData?.error) {
          throw new Error(fnData.error);
        }
      } catch (invokeErr) {
        // Check if it's a network error or function not found
        if (invokeErr.message?.includes('function not found') || invokeErr.message?.includes('404')) {
          throw new Error('Delete account service is not configured. Please contact support.');
        }
        throw invokeErr;
      }

      setDeleted(true);
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 2400);
    } catch (e) {
      console.error('Delete account error:', e);
      showToast(e.message || 'Could not delete account. Please try again.', 'error');
      setDeleting(false);
    }
  };

  const isSeller = profile?.role === 'seller';
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  if (!loading && error) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${C.primaryPale} 0%, white 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <AlertCircle size={32} color={C.danger} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Unable to load profile</h2>
          <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '11px 28px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${C.primaryPale} 0%, ${C.surfaceDim} 25%, white 100%)`, fontFamily: "'Manrope', sans-serif", color: C.text, position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes skeletonShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes fadeUp          { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUpIn        { from { opacity: 0; transform: translateY(6px);  } to { opacity: 1; transform: translateY(0); } }
        @keyframes avatarRing      { 0%,100% { box-shadow: 0 0 0 3px ${C.primary}, 0 0 32px rgba(200,75,17,0.35); } 50% { box-shadow: 0 0 0 4px ${C.primaryLight}, 0 0 44px rgba(249,115,22,0.5); } }
        @keyframes floatDot        { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes historyIn       { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes rippleFade      { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.04); } }
        @keyframes shakeError      { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes spin            { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar       { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.surfaceDim}; }
        ::-webkit-scrollbar-thumb { background: ${C.primaryBorder}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.primary}; }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, rgba(200,75,17,0.12) 1px, transparent 1px)`, backgroundSize: '36px 36px' }} />
        <div style={{ position: 'absolute', top: -100, left: -100, width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, rgba(200,75,17,0.08) 0%, transparent 65%)` }} />
        <div style={{ position: 'absolute', bottom: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 65%)` }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${C.borderLight}`, boxShadow: `0 1px 0 ${C.primaryBorder}`, opacity: headerIn ? 1 : 0, transform: headerIn ? 'translateY(0)' : 'translateY(-100%)', transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 14, height: 68 }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceDim, cursor: 'pointer', color: C.textMuted, fontSize: 13, fontWeight: 600, transition: 'all 0.2s', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.borderColor = C.primaryBorder; e.currentTarget.style.color = C.primary; e.currentTarget.style.transform = 'translateX(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surfaceDim; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.transform = 'none'; }}>
            <ArrowLeft size={16} strokeWidth={2.2} /> Back
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>My Profile</span>
          {!loading && isSeller && (
            <button onClick={() => navigate('/upload-product')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: `0 4px 16px rgba(200,75,17,0.3)` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(200,75,17,0.45)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 16px rgba(200,75,17,0.3)`; }}>
              <Upload size={15} strokeWidth={2.2} /> Upload Product
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Hero Card */}
        <div style={{ position: 'relative', marginBottom: 28, borderRadius: 24, overflow: 'hidden', border: `1px solid ${C.borderLight}`, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', boxShadow: `0 4px 40px rgba(200,75,17,0.08)`, opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(30px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${C.primaryBg} 0%, ${C.primaryPale} 40%, ${C.primaryBg} 100%)`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(200,75,17,0.2) 0%, rgba(249,115,22,0.15) 50%, rgba(200,75,17,0.1) 100%)` }} />
            {[15, 35, 55, 75].map(p => <div key={p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(0,0,0,0.04)' }} />)}
          </div>
          <div style={{ padding: '0 36px 36px' }}>
            <div style={{ marginTop: -52, marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {loading ? <Skeleton style={{ width: 88, height: 88, borderRadius: '50%' }} /> : (
                  <>
                    <div style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'white', fontFamily: "'Manrope', sans-serif", animation: 'avatarRing 3s ease-in-out infinite', border: '3px solid #fff', position: 'relative', zIndex: 1 }}>{initials}</div>
                    <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff', zIndex: 2, animation: 'floatDot 2s ease-in-out infinite' }} />
                  </>
                )}
              </div>
              {!loading && isSeller && (
                <button onClick={() => navigate('/upload-product')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1px solid ${C.primaryBorder}`, background: C.primaryBg, cursor: 'pointer', color: C.primary, fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                  <Upload size={14} /> Upload Product
                </button>
              )}
            </div>
            {loading ? (
              <div>
                <Skeleton style={{ height: 32, width: 200, marginBottom: 10 }} />
                <Skeleton style={{ height: 16, width: 160, marginBottom: 14 }} />
                <div style={{ display: 'flex', gap: 8 }}><Skeleton style={{ height: 26, width: 70, borderRadius: 20 }} /><Skeleton style={{ height: 26, width: 90, borderRadius: 20 }} /></div>
              </div>
            ) : (
              <div>
                <InlineNameEditor value={profile?.full_name} onSave={handleSave} loading={loading} />
                <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 500, marginTop: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} color={C.primary} /> Member since {fmt(profile?.created_at)}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile?.role && <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBorder}` }}>{profile.role}</span>}
                  <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.04)', color: C.textMuted, border: `1px solid ${C.borderLight}` }}>{stats?.totalSearches ?? 0}+ Searches</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid: Contact + History */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20, opacity: cardsIn ? 1 : 0, transform: cardsIn ? 'none' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
          {/* Contact Info */}
          <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: 20, padding: '28px', boxShadow: `0 4px 32px rgba(200,75,17,0.05)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color={C.primary} /></div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Contact Info</h2>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: C.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Pencil size={10} color={C.textFaint} /> Hover to edit</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <EditableField icon={<Mail size={15} color={C.primary} />} iconBg={C.primaryBg} iconBorder={C.primaryBorder} label="Email" field="email" type="email" value={profile?.email} onSave={handleSave} loading={loading} />
              <EditableField icon={<Phone size={15} color={C.success} />} iconBg={C.successBg} iconBorder={C.primaryBorder} label="Phone" field="phone" type="tel" value={profile?.phone} onSave={handleSave} loading={loading} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Calendar size={15} color={C.accent} /></div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 3 }}>Member Since</p>
                  {loading ? <Skeleton style={{ height: 14, width: 140 }} /> : <p style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{fmt(profile?.created_at)}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Search History */}
          <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: 20, padding: '28px', boxShadow: `0 4px 32px rgba(200,75,17,0.05)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><History size={16} color={C.primary} /></div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Recent Searches</h2>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            ) : searchHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}><p style={{ color: C.textFaint, fontSize: 13 }}>No search history yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {searchHistory.map((item, index) => <HistoryRow key={index} item={item} index={index} />)}
              </div>
            )}
          </div>
        </div>

        {/* Activity Stats */}
        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: 20, padding: '28px', boxShadow: `0 4px 32px rgba(200,75,17,0.05)`, marginBottom: 20, opacity: statsIn ? 1 : 0, transform: statsIn ? 'none' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: C.successBg, border: `1px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Activity Stats</h2>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: 100, borderRadius: 14 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <StatBox value={stats?.totalSearches} label="Total Searches" icon="search"       color={C.primary} glow={C.primaryBg}  delay={0}   />
              <StatBox value={stats?.orders}        label="Orders Placed"  icon="shopping_bag" color={C.success} glow={C.successBg}  delay={120} />
              <StatBox value={stats?.imageSearches} label="Image Searches" icon="photo_camera" color={C.accent}  glow={C.primaryBg}  delay={240} />
              <StatBox value={stats?.savedItems}    label="Saved Items"    icon="bookmark"     color={C.accent}  glow={C.primaryBg}  delay={360} />
            </div>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <DangerZoneCard
          onDeleteClick={() => setDeleteModalOpen(true)}
          visible={dangerIn}
        />
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={deleteModalOpen}
        onClose={() => { if (!deleting && !deleted) { setDeleteModalOpen(false); setDeleted(false); }}}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
        deleted={deleted}
      />

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

export default UserProfile;