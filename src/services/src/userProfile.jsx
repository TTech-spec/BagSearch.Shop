import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { deleteFromPinecone } from './services/visualSearch';
import {
  User, Mail, Phone, Calendar, History, AlertCircle,
  ArrowLeft, Upload, Check, X, Pencil, Loader
} from 'lucide-react';

// ─── Design Tokens — Warm Light Mode ─────────────────────────────────────────
const T = {
  bg:           '#faf7f4',
  bgCard:       '#ffffff',
  bgCardHover:  '#fef9f6',
  surface:      '#f5f0eb',
  surfaceHover: '#ede6df',
  border:       '#e4d9d0',
  borderStrong: '#d4c5b8',
  orange:       '#c84b11',
  orangeLight:  '#f97316',
  orangeGlow:   'rgba(200,75,17,0.18)',
  orangePale:   'rgba(200,75,17,0.07)',
  amber:        '#b45309',
  amberLight:   '#d97706',
  amberGlow:    'rgba(180,83,9,0.15)',
  red:          '#dc2626',
  redGlow:      'rgba(220,38,38,0.18)',
  green:        '#16a34a',
  greenLight:   '#22c55e',
  greenGlow:    'rgba(22,163,74,0.15)',
  textPrimary:  '#1c1209',
  textSec:      '#6b4e3a',
  textMuted:    '#9d7b68',
  textFaint:    '#c4a898',
  gold:         '#92400e',
  shadow:       'rgba(100,50,20,0.08)',
  shadowMd:     'rgba(100,50,20,0.13)',
  shadowLg:     'rgba(100,50,20,0.18)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d)      { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); }
function fmtShort(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'2-digit' }); }

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;500;600;700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@300;400;500&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${T.bg}; }

  ::-webkit-scrollbar       { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${T.surface}; }
  ::-webkit-scrollbar-thumb { background: ${T.borderStrong}; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.orange}; }

  @keyframes fadeUp    { from { opacity:0; transform:translateY(22px);   } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; }                              to { opacity:1; } }
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes shimmer   { 0% { background-position:-600px 0; } 100% { background-position:600px 0; } }
  @keyframes pulseRing { 0%,100% { transform:scale(1);   opacity:.6; } 50% { transform:scale(1.5); opacity:0; } }
  @keyframes floatY    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
  @keyframes scanline  { from { transform:translateX(-100%); } to { transform:translateX(2000%); } }
  @keyframes tickIn    { from { opacity:0; transform:scale(.4) rotate(-30deg); } to { opacity:1; transform:scale(1) rotate(0); } }
  @keyframes shakeX    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(3px)} }
  @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
  @keyframes modalPop  { from { opacity:0; transform:translate(-50%,-50%) scale(.9); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
  @keyframes drawCheck { from { stroke-dashoffset:60; } to { stroke-dashoffset:0; } }
  @keyframes histIn    { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
  @keyframes orb1      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-20px) scale(1.1)} 66%{transform:translate(-20px,30px) scale(.9)} }
  @keyframes orb2      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-30px,20px) scale(.9)} 66%{transform:translate(20px,-30px) scale(1.1)} }
  @keyframes dangerPulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)} 70%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
  @keyframes spinSlow  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 14, r = 6, style = {} }) {
  return <div style={{ width:w, height:h, borderRadius:r, background:`linear-gradient(90deg, ${T.surface} 25%, ${T.surfaceHover} 50%, ${T.surface} 75%)`, backgroundSize:'600px 100%', animation:'shimmer 1.6s ease infinite', ...style }} />;
}

// ─── Icon (Material Symbols) ──────────────────────────────────────────────────
function MI({ name, size = 20, color }) {
  return <span style={{ fontFamily:"'Material Symbols Outlined'", fontSize:size, lineHeight:1, display:'inline-block', userSelect:'none', color:color||'inherit' }}>{name}</span>;
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimNum({ val, delay = 0 }) {
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (val == null || done.current) return;
    const t = setTimeout(() => {
      done.current = true;
      const steps = 40, dur = 1100;
      let i = 0;
      const iv = setInterval(() => {
        i++; setN(Math.round((val/steps)*i));
        if (i >= steps) { setN(val); clearInterval(iv); }
      }, dur/steps);
    }, delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return <span>{n}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type='success', visible }) {
  return (
    <div style={{
      position:'fixed', bottom:28, left:'50%',
      transform:`translateX(-50%) translateY(${visible?0:100}px)`,
      opacity: visible?1:0,
      transition:'all .4s cubic-bezier(.22,1,.36,1)',
      zIndex:999, pointerEvents:'none',
      background: type==='success' ? 'linear-gradient(135deg,#14532d,#16a34a)' : 'linear-gradient(135deg,#7f1d1d,#dc2626)',
      color:'#fff', padding:'10px 20px', borderRadius:40,
      fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
      boxShadow:`0 12px 40px rgba(0,0,0,.2)`,
      display:'flex', alignItems:'center', gap:8, letterSpacing:'.04em',
      border:`1px solid ${type==='success'?'rgba(134,239,172,.4)':'rgba(254,202,202,.3)'}`,
      whiteSpace:'nowrap',
    }}>
      {type==='success' ? <Check size={13}/> : <X size={13}/>} {msg}
    </div>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────────────
function EditField({ icon, label, value, field, onSave, loading, type='text', accentColor=T.orange }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft  ] = useState(value ?? '');
  const [saving,  setSaving ] = useState(false);
  const [saved,   setSaved  ] = useState(false);
  const [err,     setErr    ] = useState('');
  const [hov,     setHov    ] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const start  = () => { setDraft(value ?? ''); setEditing(true); setErr(''); };
  const cancel = () => { setEditing(false); setErr(''); setDraft(value ?? ''); };
  const save   = async () => {
    if (draft.trim() === (value ?? '').trim()) { cancel(); return; }
    if (field==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.trim())) { setErr('Invalid email'); return; }
    if (field==='phone' && draft.trim() && !/^\+?[\d\s\-()+]{7,}$/.test(draft.trim())) { setErr('Invalid phone'); return; }
    if (field==='full_name' && draft.trim().length < 2) { setErr('Too short'); return; }
    setSaving(true);
    try { await onSave(field, draft.trim()); setEditing(false); setSaved(true); setTimeout(()=>setSaved(false),2200); }
    catch(e) { setErr(e.message||'Failed'); }
    finally { setSaving(false); }
  };
  const onKey = e => { if(e.key==='Enter') save(); if(e.key==='Escape') cancel(); };

  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        position:'relative', padding:'12px 14px', borderRadius:12,
        background: editing ? T.surface : hov ? T.surface : 'transparent',
        border:`1px solid ${editing ? accentColor+'66' : hov ? T.border : 'transparent'}`,
        transition:'all .25s ease', overflow:'hidden',
      }}
    >
      <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:2, borderRadius:1, background:accentColor, opacity: editing ? 1 : hov ? .35 : 0, transition:'opacity .25s' }} />
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:`${accentColor}12`, border:`1px solid ${accentColor}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:accentColor, transition:'all .25s', transform: editing?'scale(1.08)':'scale(1)' }}>
          {icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:9, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:T.textMuted, marginBottom:4, fontFamily:"'DM Mono',monospace" }}>{label}</p>
          {loading ? <Skel w={140} h={13} /> : editing ? (
            <div>
              <input ref={inputRef} type={type} value={draft}
                onChange={e=>{setDraft(e.target.value);setErr('');}} onKeyDown={onKey}
                placeholder={`Enter ${label.toLowerCase()}…`}
                style={{ width:'100%', fontSize:13, fontWeight:500, color:T.textPrimary, background:T.bgCard, border:`1.5px solid ${err?T.red:accentColor+'88'}`, borderRadius:8, padding:'7px 10px', outline:'none', fontFamily:"'DM Sans',sans-serif", transition:'border-color .2s', boxShadow: err?`0 0 0 3px ${T.redGlow}`:`0 0 0 3px ${accentColor}18` }}
              />
              {err && <p style={{ fontSize:10, color:T.red, marginTop:4, fontWeight:600 }}>⚠ {err}</p>}
              <div style={{ display:'flex', gap:6, marginTop:8 }}>
                <button onClick={save} disabled={saving}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:7, background:saving?T.surface:`linear-gradient(135deg,${T.orange},${T.orangeLight})`, border:'none', color:saving?T.orange:'#fff', cursor:saving?'default':'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit', boxShadow:saving?'none':`0 4px 14px ${T.orangeGlow}` }}>
                  {saving ? <Loader size={10} style={{animation:'spin .8s linear infinite'}}/> : <Check size={10}/>}
                  {saving?'Saving…':'Save'}
                </button>
                <button onClick={cancel}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, background:'transparent', border:`1px solid ${T.border}`, color:T.textSec, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                  <X size={10}/> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <p style={{ fontSize:13, fontWeight:500, color: value ? T.textPrimary : T.textMuted, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value || '—'}</p>
              {saved && <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:T.green, animation:'tickIn .3s ease' }}><Check size={9}/> saved</span>}
            </div>
          )}
        </div>
        {!editing && !loading && (
          <button onClick={start}
            style={{ width:26, height:26, borderRadius:7, background: hov?`${accentColor}12`:'transparent', border:`1px solid ${hov?accentColor+'44':'transparent'}`, cursor:'pointer', color: hov?accentColor:T.textFaint, display:'flex', alignItems:'center', justifyContent:'center', opacity: hov?1:0, transform: hov?'scale(1)':'scale(.6)', transition:'all .25s cubic-bezier(.34,1.56,.64,1)', flexShrink:0, alignSelf:'flex-start', marginTop:6 }}>
            <Pencil size={11}/>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inline Name Editor ───────────────────────────────────────────────────────
function NameEditor({ value, onSave, loading }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft  ] = useState(value ?? '');
  const [saving,  setSaving ] = useState(false);
  const [err,     setErr    ] = useState('');
  const [hov,     setHov    ] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const cancel = () => { setEditing(false); setErr(''); };
  const save   = async () => {
    if (!draft.trim() || draft.trim().length < 2) { setErr('Too short'); return; }
    if (draft.trim() === (value ?? '').trim()) { cancel(); return; }
    setSaving(true);
    try { await onSave('full_name', draft.trim()); setEditing(false); }
    catch(e) { setErr(e.message||'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <Skel h={32} w={200} r={8} />;
  if (editing) return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <input ref={inputRef} value={draft}
          onChange={e=>{setDraft(e.target.value);setErr('');}}
          onKeyDown={e=>{if(e.key==='Enter')save();if(e.key==='Escape')cancel();}}
          style={{ fontSize:'clamp(1.1rem,3.5vw,1.6rem)', fontWeight:700, color:T.textPrimary, background:T.bgCard, border:`2px solid ${err?T.red:T.orange}`, borderRadius:10, padding:'6px 14px', outline:'none', fontFamily:"'Unbounded',sans-serif", letterSpacing:'-.03em', boxShadow:`0 0 0 4px ${err?T.redGlow:T.orangePale}`, maxWidth:'min(320px,calc(100vw - 120px))', boxShadow:`0 2px 12px ${T.shadow}` }}
        />
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={save} disabled={saving} style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${T.orange},${T.orangeLight})`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 14px ${T.orangeGlow}` }}>
            {saving ? <Loader size={13} color="#fff" style={{animation:'spin .8s linear infinite'}}/> : <Check size={13} color="#fff"/>}
          </button>
          <button onClick={cancel} style={{ width:34, height:34, borderRadius:9, background:T.surface, border:`1px solid ${T.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={13} color={T.textSec}/></button>
        </div>
      </div>
      {err && <p style={{ fontSize:10, color:T.red, fontWeight:600 }}>⚠ {err}</p>}
    </div>
  );
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>{setDraft(value??'');setEditing(true);setErr('');}}
      style={{ display:'inline-flex', alignItems:'center', gap:10, cursor:'pointer', padding:'4px 10px 4px 4px', borderRadius:10, margin:'-4px -10px -4px -4px', background: hov?T.orangePale:'transparent', border:`1.5px solid ${hov?T.orange+'55':'transparent'}`, transition:'all .25s', maxWidth:'100%' }}
      title="Click to edit name"
    >
      <h1 style={{ fontSize:'clamp(1.1rem,3.5vw,1.7rem)', fontWeight:700, color:T.textPrimary, letterSpacing:'-.03em', fontFamily:"'Unbounded',sans-serif", lineHeight:1.15, wordBreak:'break-word' }}>{value || '—'}</h1>
      <Pencil size={12} color={T.orange} style={{ flexShrink:0, opacity: hov?.9:.3, transition:'opacity .2s' }}/>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────
function HistRow({ item, index }) {
  const [hov, setHov] = useState(false);
  const isImg = item.type === 'image';
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', borderRadius:10, background: hov?T.surface:'transparent', border:`1px solid ${hov?T.border:'transparent'}`, transition:'all .2s ease', cursor:'default', animation:`histIn .35s cubic-bezier(.22,1,.36,1) ${index*45}ms both` }}
    >
      <div style={{ width:7, height:7, borderRadius:'50%', background: isImg?T.amberLight:T.orange, flexShrink:0, boxShadow:`0 0 8px ${isImg?T.amberGlow:T.orangeGlow}` }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12, fontWeight:500, color:T.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" }}>{item.query}</p>
        <p style={{ fontSize:10, color:T.textMuted, marginTop:2, fontFamily:"'DM Mono',monospace" }}>{fmtShort(item.created_at)}</p>
      </div>
      <span style={{ fontSize:8, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', padding:'3px 9px', borderRadius:20, background: isImg?`${T.amberLight}14`:T.orangePale, color: isImg?T.amber:T.orange, border:`1px solid ${isImg?T.amber+'40':T.orange+'40'}`, flexShrink:0, fontFamily:"'DM Mono',monospace" }}>{item.type}</span>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ val, label, icon, color, glow, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:'18px 14px', borderRadius:14, textAlign:'center', background: hov?T.bgCard:T.surface, border:`1px solid ${hov?color+'55':T.border}`, transition:'all .3s ease', transform: hov?'translateY(-4px)':'none', boxShadow: hov?`0 12px 32px ${glow}, 0 4px 12px ${T.shadow}`:`0 2px 8px ${T.shadow}`, cursor:'default', position:'relative', overflow:'hidden' }}
    >
      {hov && <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 110%, ${glow} 0%, transparent 65%)`, pointerEvents:'none' }}/>}
      <div style={{ position:'relative', zIndex:1 }}>
        <MI name={icon} size={18} color={hov?color:T.textMuted}/>
        <p style={{ fontSize:'clamp(1.5rem,3.5vw,2.1rem)', fontWeight:900, color:hov?color:T.textPrimary, letterSpacing:'-.06em', lineHeight:1, margin:'7px 0 5px', fontFamily:"'Unbounded',sans-serif" }}>
          {val != null ? <AnimNum val={val} delay={delay}/> : 0}
        </p>
        <p style={{ fontSize:9, fontWeight:500, color:T.textMuted, letterSpacing:'.08em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace" }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ visible, onClose, onConfirm, deleting, deleted }) {
  const [confirm, setConfirm] = useState('');
  const [shake,   setShake  ] = useState(false);
  const inputRef = useRef(null);
  const valid = confirm.trim().toUpperCase() === 'DELETE';

  useEffect(() => {
    if (!visible) { setConfirm(''); setShake(false); }
    if (visible)  setTimeout(() => inputRef.current?.focus(), 420);
  }, [visible]);

  const handleInput = e => {
    setConfirm(e.target.value);
    if (e.target.value.length >= 5 && e.target.value.trim().toUpperCase() !== 'DELETE') {
      setShake(true); setTimeout(()=>setShake(false), 500);
    }
  };

  if (!visible) return null;

  const warnings = [
    { text: 'All orders & saved items permanently removed', icon:'inventory_2' },
    { text: 'Search history & activity wiped from servers', icon:'history' },
    { text: 'Profile, name & contact info deleted forever',  icon:'person' },
    { text: 'This action is completely irreversible',        icon:'block' },
  ];

  return (
    <>
      <div onClick={!deleting&&!deleted?onClose:undefined}
        style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(28,18,9,.55)', backdropFilter:'blur(8px)', animation:'overlayIn .25s ease' }}/>
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:601, width:'min(480px,calc(100vw - 20px))',
        background:T.bgCard,
        borderRadius:20, overflow:'hidden',
        border:`1px solid ${shake?T.red+'66':T.borderStrong}`,
        boxShadow:`0 40px 80px ${T.shadowLg}, 0 0 0 1px ${T.border}`,
        animation: shake ? 'shakeX .5s ease' : 'modalPop .4s cubic-bezier(.34,1.28,.64,1) both',
        maxHeight:'90vh', overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{ padding:'26px 26px 20px', background:'linear-gradient(135deg,#fff5f5,#fee2e2)', position:'relative', overflow:'hidden', borderBottom:`1px solid #fecaca` }}>
          <div style={{ position:'absolute', top:-60, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(220,38,38,.05)' }}/>
          <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
            <div>
              <div style={{ width:48, height:48, borderRadius:13, background:'rgba(220,38,38,.1)', border:'1.5px solid rgba(220,38,38,.22)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={T.red}><path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/></svg>
              </div>
              <p style={{ fontSize:17, fontWeight:700, color:'#7f1d1d', fontFamily:"'Unbounded',sans-serif", letterSpacing:'-.03em', marginBottom:4 }}>Delete Account</p>
              <p style={{ fontSize:11, color:'#b91c1c', fontFamily:"'DM Sans',sans-serif" }}>Permanent · cannot be undone</p>
            </div>
            {!deleting && !deleted && (
              <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'rgba(220,38,38,.07)', border:'1px solid rgba(220,38,38,.15)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.red, flexShrink:0 }}>
                <X size={13}/>
              </button>
            )}
          </div>
        </div>

        {deleted ? (
          <div style={{ padding:'40px 26px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', animation:'fadeUp .4s ease' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'#f0fdf4', border:`2px solid ${T.greenLight}66`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M4 12l5 5 11-11" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray:60, strokeDashoffset:60, animation:'drawCheck .6s ease .1s forwards' }}/>
              </svg>
            </div>
            <p style={{ fontSize:15, fontWeight:700, color:T.textPrimary, fontFamily:"'Unbounded',sans-serif", marginBottom:8 }}>Account Deleted</p>
            <p style={{ fontSize:13, color:T.textSec, lineHeight:1.65, maxWidth:240, fontFamily:"'DM Sans',sans-serif" }}>All data permanently removed. Redirecting…</p>
          </div>
        ) : (
          <>
            <div style={{ padding:'20px 26px' }}>
              <div style={{ background:'#fef2f2', border:`1px solid #fecaca`, borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
                {warnings.map((w,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom: i<warnings.length-1?`1px solid #fee2e2`:'none', opacity:0, animation:`fadeUp .35s ease ${80+i*70}ms both` }}>
                    <MI name={w.icon} size={14} color={T.red}/>
                    <p style={{ fontSize:12, color:'#dc2626', fontWeight:500, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{w.text}</p>
                  </div>
                ))}
              </div>
              <label style={{ display:'block', fontSize:9, fontWeight:700, color:T.textMuted, letterSpacing:'.14em', textTransform:'uppercase', marginBottom:7, fontFamily:"'DM Mono',monospace" }}>
                Type <span style={{ color:T.red }}>DELETE</span> to confirm
              </label>
              <input ref={inputRef} type="text" value={confirm} onChange={handleInput} placeholder="DELETE"
                autoComplete="off" disabled={deleting}
                style={{ width:'100%', padding:'11px 13px', borderRadius:10, border:`1.5px solid ${valid?T.red:T.border}`, background:T.bg, fontSize:14, fontWeight:700, color:T.textPrimary, fontFamily:"'DM Mono',monospace", outline:'none', letterSpacing:'.1em', boxShadow: valid?`0 0 0 3px ${T.redGlow}`:'none', transition:'all .25s' }}
              />
            </div>
            <div style={{ padding:'0 26px 22px', display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={onClose} disabled={deleting}
                style={{ flex:'1 1 100px', padding:'11px', borderRadius:11, border:`1px solid ${T.border}`, background:T.surface, fontSize:12, fontWeight:600, color:T.textSec, cursor:deleting?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Cancel
              </button>
              <button onClick={()=>valid&&!deleting&&onConfirm()} disabled={!valid||deleting}
                style={{ flex:'2 1 160px', padding:'11px', borderRadius:11, border:'none', background: valid&&!deleting?'linear-gradient(135deg,#dc2626,#b91c1c)':'#fecaca', fontSize:12, fontWeight:700, color: valid&&!deleting?'#fff':'#f87171', cursor: valid&&!deleting?'pointer':'not-allowed', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow: valid&&!deleting?`0 6px 20px ${T.redGlow}`:'none', transition:'all .25s' }}>
                {deleting ? <Loader size={13} style={{animation:'spin .7s linear infinite'}}/> : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/></svg>}
                {deleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────
function DangerZone({ onDelete, visible }) {
  const [hov, setHov] = useState(false);
  const [btnHov, setBtnHov] = useState(false);
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:T.bgCard, border:`1px solid ${hov?'#fca5a5':T.border}`, borderRadius:18, padding:'clamp(20px,4vw,28px)', boxShadow: hov?`0 8px 32px rgba(220,38,38,.08), 0 2px 12px ${T.shadow}`:`0 2px 12px ${T.shadow}`, opacity: visible?1:0, transform: visible?'none':'translateY(20px)', transition:'opacity .6s ease, transform .6s ease, border-color .3s, box-shadow .3s', position:'relative', overflow:'hidden' }}
    >
      {hov && <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(220,38,38,.06) 0%,transparent 65%)', pointerEvents:'none' }}/>}
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${T.border}` }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'#fef2f2', border:`1px solid #fecaca`, display:'flex', alignItems:'center', justifyContent:'center', animation: hov?'dangerPulse 1.5s ease infinite':'none', flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={T.red}><path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19H3.5L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ fontSize:13, fontWeight:700, color: hov?T.red:T.textPrimary, fontFamily:"'Unbounded',sans-serif", letterSpacing:'-.02em', transition:'color .3s' }}>Danger Zone</h2>
            <p style={{ fontSize:9, color:T.textMuted, fontFamily:"'DM Mono',monospace" }}>Irreversible actions</p>
          </div>
          <div style={{ position:'relative', width:10, height:10, flexShrink:0 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:T.red, animation:'pulseRing 2s ease-out infinite', opacity:.5 }}/>
            <div style={{ width:10, height:10, borderRadius:'50%', background:T.red }}/>
          </div>
        </div>
        <p style={{ fontSize:12, color:T.textSec, fontWeight:400, lineHeight:1.7, marginBottom:20, fontFamily:"'DM Sans',sans-serif", paddingLeft:4 }}>
          Deleting your account will <strong style={{ color:hov?T.red:T.textPrimary }}>permanently erase</strong> all your data including orders, saved items, search history, and your profile. <strong style={{ color:hov?T.red:T.textPrimary }}>This cannot be undone.</strong>
        </p>
        <button
          onMouseEnter={()=>setBtnHov(true)} onMouseLeave={()=>setBtnHov(false)}
          onClick={onDelete}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:9, padding:'12px', borderRadius:11, border:`1px solid ${btnHov?'transparent':'#fca5a5'}`, background: btnHov?'linear-gradient(135deg,#dc2626,#b91c1c)':'#fef2f2', color: btnHov?'#fff':T.red, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .28s cubic-bezier(.22,1,.36,1)', boxShadow: btnHov?`0 8px 24px ${T.redGlow}`:'none', transform: btnHov?'translateY(-2px)':'none', position:'relative', overflow:'hidden' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/></svg>
          Delete My Account
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function UserProfile() {
  const navigate = useNavigate();
  const [profile,  setProfile ] = useState(null);
  const [history,  setHistory ] = useState([]);
  const [stats,    setStats   ] = useState(null);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState(null);
  const [toast,    setToast   ] = useState({ visible:false, msg:'', type:'success' });

  const [delModal, setDelModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted,  setDeleted ] = useState(false);

  const [in0, setIn0] = useState(false);
  const [in1, setIn1] = useState(false);
  const [in2, setIn2] = useState(false);
  const [in3, setIn3] = useState(false);
  const [in4, setIn4] = useState(false);
  useEffect(() => {
    setTimeout(()=>setIn0(true), 60);
    setTimeout(()=>setIn1(true), 180);
    setTimeout(()=>setIn2(true), 320);
    setTimeout(()=>setIn3(true), 460);
    setTimeout(()=>setIn4(true), 600);
  }, []);

  const showToast = (msg, type='success') => {
    setToast({ visible:true, msg, type });
    setTimeout(()=>setToast(t=>({...t,visible:false})), 3000);
  };

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const { data:{ user }, error:e } = await supabase.auth.getUser();
        if (e) throw e;
        if (!user) throw new Error('Not authenticated');
        const uid = user.id;
        const { data: pd } = await supabase.from('users').select('user_id,full_name,email,phone,role,created_at').eq('user_id',uid).maybeSingle();
        setProfile(pd || { user_id:user.id, full_name:user.user_metadata?.full_name||'User', email:user.email, phone:user.user_metadata?.phone||'', role:user.user_metadata?.role||'buyer', created_at:user.created_at });
        const { data:hist } = await supabase.from('search_history').select('query,created_at,type').eq('user_id',uid).order('created_at',{ascending:false}).limit(10);
        setHistory(hist ?? []);
        const total=hist?.length??0, imgs=hist?.filter(h=>h.type==='image').length??0;
        const [ord, sav] = await Promise.all([
          supabase.from('orders').select('id',{count:'exact',head:true}).eq('user_id',uid),
          supabase.from('saved_items').select('id',{count:'exact',head:true}).eq('user_id',uid),
        ]);
        setStats({ totalSearches:total, imageSearches:imgs, orders:ord.error?0:(ord.count??0), savedItems:sav.error?0:(sav.count??0) });
      } catch(e) { setError(e.message||'Failed to load'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleSave = async (field, val) => {
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error:e } = await supabase.from('users').update({[field]:val}).eq('user_id',user.id);
    if (e) throw e;
    if (field==='email') { const { error:ae } = await supabase.auth.updateUser({email:val}); if(ae) throw ae; }
    if (field==='full_name') await supabase.auth.updateUser({data:{full_name:val}});
    setProfile(p=>({...p,[field]:val}));
    showToast(`${field==='full_name'?'Name':field==='email'?'Email':'Phone'} updated`, 'success');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const uid = session.user.id;
      const { data: prods } = await supabase.from('products').select('id').or(`user_id.eq.${uid},seller_id.eq.${uid}`);
      if (prods?.length) await deleteFromPinecone(prods.map(p=>p.id));
      const { data:fnData, error:fnErr } = await supabase.functions.invoke('delete-account',{body:{userId:uid}});
      if (fnErr) throw new Error(fnErr.message||'Delete failed');
      if (fnData?.error) throw new Error(fnData.error);
      setDeleted(true);
      setTimeout(async()=>{ await supabase.auth.signOut(); navigate('/'); }, 2400);
    } catch(e) { showToast(e.message||'Could not delete account','error'); setDeleting(false); }
  };

  const isSeller = profile?.role === 'seller';
  const initials = profile?.full_name ? profile.full_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'U';

  if (!loading && error) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif", padding:24 }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ textAlign:'center', maxWidth:340 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#fef2f2', border:`1px solid #fecaca`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
          <AlertCircle size={28} color={T.red}/>
        </div>
        <h2 style={{ fontSize:16, fontWeight:700, color:T.textPrimary, fontFamily:"'Unbounded',sans-serif", marginBottom:8 }}>Load Failed</h2>
        <p style={{ color:T.textSec, fontSize:13, marginBottom:22, lineHeight:1.65 }}>{error}</p>
        <button onClick={()=>window.location.reload()} style={{ padding:'10px 26px', background:`linear-gradient(135deg,${T.orange},${T.orangeLight})`, color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:`0 6px 20px ${T.orangeGlow}` }}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans',sans-serif", color:T.textPrimary, position:'relative', overflowX:'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Ambient Background ── */}
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        {/* Warm subtle orbs */}
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'60vw', height:'60vw', maxWidth:700, maxHeight:700, borderRadius:'50%', background:`radial-gradient(circle, rgba(200,75,17,.05) 0%, transparent 60%)`, animation:'orb1 18s ease-in-out infinite', filter:'blur(80px)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'-8%', width:'50vw', height:'50vw', maxWidth:600, maxHeight:600, borderRadius:'50%', background:`radial-gradient(circle, rgba(245,158,11,.04) 0%, transparent 60%)`, animation:'orb2 22s ease-in-out infinite', filter:'blur(80px)' }}/>
        {/* Subtle dot grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(circle, ${T.borderStrong} 1px, transparent 1px)`, backgroundSize:'28px 28px', opacity:.5 }}/>
        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.orange}44,${T.orangeLight}66,${T.orange}44,transparent)` }}/>
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(250,247,244,.92)', backdropFilter:'blur(20px)',
        borderBottom:`1px solid ${T.border}`,
        boxShadow:`0 1px 20px ${T.shadow}`,
        opacity: in0?1:0, transform: in0?'translateY(0)':'translateY(-20px)',
        transition:'opacity .4s ease, transform .4s ease',
      }}>
        {/* Top accent line */}
        <div style={{ height:2, background:`linear-gradient(90deg,transparent,${T.orange},${T.orangeLight},${T.orange},transparent)`, opacity:.7 }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 clamp(14px,4vw,20px)', display:'flex', alignItems:'center', gap:clamp(10,14), height:60 }}>
          <button onClick={()=>navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:9, border:`1px solid ${T.border}`, background:T.bgCard, cursor:'pointer', color:T.textSec, fontSize:12, fontWeight:600, transition:'all .2s', fontFamily:'inherit', flexShrink:0, whiteSpace:'nowrap', boxShadow:`0 1px 6px ${T.shadow}` }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.orange+'66';e.currentTarget.style.color=T.orange;e.currentTarget.style.transform='translateX(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSec;e.currentTarget.style.transform='none';}}>
            <ArrowLeft size={13} strokeWidth={2}/> <span style={{ display:'inline' }}>Back</span>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:9, flex:1, minWidth:0 }}>
            <div style={{ width:2, height:18, background:`linear-gradient(180deg,${T.orange},${T.orangeLight})`, borderRadius:1, flexShrink:0 }}/>
            <span style={{ fontSize:clamp(11,13), fontWeight:700, color:T.textPrimary, letterSpacing:'-.02em', fontFamily:"'Unbounded',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>My Profile</span>
          </div>

          {!loading && isSeller && (
            <button onClick={()=>navigate('/upload-product')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.orange},${T.orangeLight})`, cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700, fontFamily:'inherit', boxShadow:`0 4px 16px ${T.orangeGlow}`, transition:'all .2s', flexShrink:0, whiteSpace:'nowrap' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>
              <Upload size={12}/> <span style={{ display:'inline' }}>Upload</span>
            </button>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(20px,4vw,36px) clamp(14px,4vw,24px) 80px', position:'relative', zIndex:1 }}>

        {/* ── HERO CARD ── */}
        <div style={{
          marginBottom:16, borderRadius:20, overflow:'hidden',
          background:T.bgCard, border:`1px solid ${T.border}`,
          boxShadow:`0 4px 32px ${T.shadowMd}`,
          opacity: in1?1:0, transform: in1?'translateY(0)':'translateY(28px)',
          transition:'opacity .55s ease, transform .55s ease',
        }}>
          {/* Banner — warm cream with texture */}
          <div style={{ height:'clamp(70px,12vw,120px)', background:`linear-gradient(135deg, #fef3e2 0%, #fde8c8 40%, #fef3e2 100%)`, position:'relative', overflow:'hidden' }}>
            {/* Horizontal stripes pattern */}
            {[...Array(12)].map((_,i) => (
              <div key={i} style={{ position:'absolute', left:0, right:0, top:`${(i/12)*100}%`, height:1, background:`linear-gradient(90deg,transparent,${T.orange}18,transparent)` }}/>
            ))}
            {/* Scanline shimmer */}
            <div style={{ position:'absolute', top:0, bottom:0, width:'25%', background:`linear-gradient(90deg,transparent,rgba(200,75,17,.06),transparent)`, animation:'scanline 6s ease-in-out infinite', pointerEvents:'none' }}/>
            {/* Concentric circle decoration */}
            <div style={{ position:'absolute', top:'50%', right:'8%', transform:'translateY(-50%)' }}>
              {[70,100,130].map(size=>(
                <div key={size} style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:size, height:size, borderRadius:'50%', border:`1px solid ${T.orange}${size===70?'44':size===100?'28':'18'}` }}/>
              ))}
              <div style={{ width:20, height:20, borderRadius:'50%', background:T.orange, opacity:.2 }}/>
            </div>
            {/* Vertical stripes */}
            {[20,40,60,80].map(p=>(
              <div key={p} style={{ position:'absolute', left:`${p}%`, top:0, bottom:0, width:'1px', background:`linear-gradient(180deg,transparent,${T.borderStrong},transparent)` }}/>
            ))}
            {/* Bottom accent */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.orange}66,transparent)` }}/>
          </div>

          {/* Body */}
          <div style={{ padding:'0 clamp(16px,5vw,36px) clamp(20px,4vw,32px)' }}>
            <div style={{ marginTop:'-clamp(28px,5vw,40px)', marginBottom:18, display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              {/* Avatar */}
              {loading ? <Skel w={80} h={80} r={999} /> : (
                <div style={{ position:'relative', flexShrink:0 }}>
                  {/* Spinning conic ring */}
                  <div style={{ position:'absolute', inset:-2, borderRadius:'50%', padding:2, background:`conic-gradient(${T.orange},${T.orangeLight},${T.amberLight},${T.orange})`, animation:'spinSlow 6s linear infinite', zIndex:0 }}>
                    <div style={{ inset:0, position:'absolute', borderRadius:'50%', background:T.bgCard, margin:2 }}/>
                  </div>
                  <div style={{ position:'relative', width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg,${T.orange},${T.orangeLight},${T.amberLight})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', fontFamily:"'Unbounded',sans-serif", zIndex:1, border:`3px solid ${T.bgCard}`, boxShadow:`0 4px 16px ${T.orangeGlow}` }}>
                    {initials}
                  </div>
                  {/* Online indicator */}
                  <div style={{ position:'absolute', bottom:4, right:4, width:14, height:14, borderRadius:'50%', background:T.greenLight, border:`2.5px solid ${T.bgCard}`, zIndex:2, animation:'floatY 2.5s ease-in-out infinite', boxShadow:`0 2px 8px ${T.greenGlow}` }}>
                    <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:T.greenLight, animation:'pulseRing 2s ease-out infinite', opacity:.5 }}/>
                  </div>
                </div>
              )}

              {/* Badges top-right */}
              {!loading && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                  {isSeller && (
                    <button onClick={()=>navigate('/upload-product')}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:9, border:`1px solid ${T.orange}55`, background:T.orangePale, cursor:'pointer', color:T.orange, fontSize:11, fontWeight:700, fontFamily:'inherit', transition:'all .2s', whiteSpace:'nowrap', boxShadow:`0 2px 8px ${T.orangeGlow}` }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${T.orange}14`;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=T.orangePale;}}>
                      <Upload size={11}/> Upload Product
                    </button>
                  )}
                  {profile?.role && (
                    <span style={{ padding:'4px 12px', borderRadius:20, fontSize:9, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', background:T.orangePale, color:T.orange, border:`1px solid ${T.orange}44`, fontFamily:"'DM Mono',monospace" }}>
                      {profile.role}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Name + meta */}
            {loading ? (
              <div>
                <Skel h={28} w={200} r={8} style={{ marginBottom:10 }}/>
                <Skel h={13} w={150} r={6} style={{ marginBottom:14 }}/>
                <div style={{ display:'flex', gap:8 }}><Skel h={22} w={70} r={20}/><Skel h={22} w={80} r={20}/></div>
              </div>
            ) : (
              <div>
                <NameEditor value={profile?.full_name} onSave={handleSave} loading={loading}/>
                {/* Member since */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, marginBottom:14, flexWrap:'wrap' }}>
                  <Calendar size={11} color={T.orange}/>
                  <span style={{ fontSize:10, color:T.textMuted, fontFamily:"'DM Mono',monospace" }}>
                    Member since <span style={{ color:T.textSec }}>{fmt(profile?.created_at)}</span>
                  </span>
                </div>
                {/* Mini pill stats */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[
                    { val:stats?.totalSearches??0, label:'Searches', color:T.orange },
                    { val:stats?.orders??0,        label:'Orders',   color:T.amber  },
                    { val:stats?.savedItems??0,    label:'Saved',    color:T.green  },
                  ].map(s=>(
                    <span key={s.label} style={{ padding:'4px 11px', borderRadius:20, fontSize:10, fontWeight:600, background:`${s.color}12`, color:s.color, border:`1px solid ${s.color}33`, fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' }}>
                      {s.val} {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── GRID: Contact + History ── */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap:16, marginBottom:16,
          opacity: in2?1:0, transform: in2?'none':'translateY(24px)',
          transition:'opacity .6s ease, transform .6s ease',
        }}>
          {/* Contact Info Card */}
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:18, padding:'clamp(18px,4vw,26px)', boxShadow:`0 2px 16px ${T.shadow}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:30, height:30, borderRadius:8, background:T.orangePale, border:`1px solid ${T.orange}33`, display:'flex', alignItems:'center', justifyContent:'center', color:T.orange, flexShrink:0 }}>
                <User size={14}/>
              </div>
              <h2 style={{ fontSize:11, fontWeight:700, color:T.textPrimary, letterSpacing:'-.01em', fontFamily:"'Unbounded',sans-serif", flex:1 }}>Contact Info</h2>
              <span style={{ fontSize:9, color:T.textFaint, display:'flex', alignItems:'center', gap:3, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
                <Pencil size={8}/> hover to edit
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <EditField icon={<Mail size={13}/>} label="Email" field="email" type="email" value={profile?.email} onSave={handleSave} loading={loading} accentColor={T.orange}/>
              <EditField icon={<Phone size={13}/>} label="Phone" field="phone" type="tel" value={profile?.phone} onSave={handleSave} loading={loading} accentColor={T.green}/>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`${T.amberLight}14`, border:`1px solid ${T.amberLight}33`, display:'flex', alignItems:'center', justifyContent:'center', color:T.amber, flexShrink:0 }}>
                  <Calendar size={13}/>
                </div>
                <div>
                  <p style={{ fontSize:9, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:T.textMuted, marginBottom:3, fontFamily:"'DM Mono',monospace" }}>Member Since</p>
                  {loading ? <Skel h={13} w={130}/> : <p style={{ fontSize:12, fontWeight:500, color:T.textPrimary }}>{fmt(profile?.created_at)}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Search History Card */}
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:18, padding:'clamp(18px,4vw,26px)', boxShadow:`0 2px 16px ${T.shadow}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:30, height:30, borderRadius:8, background:T.orangePale, border:`1px solid ${T.orange}33`, display:'flex', alignItems:'center', justifyContent:'center', color:T.orange, flexShrink:0 }}>
                <History size={14}/>
              </div>
              <h2 style={{ fontSize:11, fontWeight:700, color:T.textPrimary, letterSpacing:'-.01em', fontFamily:"'Unbounded',sans-serif", flex:1 }}>Recent Searches</h2>
              {!loading && history.length > 0 && (
                <span style={{ padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, background:T.orangePale, color:T.orange, border:`1px solid ${T.orange}44`, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{history.length}</span>
              )}
            </div>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[...Array(4)].map((_,i)=><Skel key={i} h={46} r={10}/>)}
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                <MI name="search_off" size={30} color={T.textFaint}/>
                <p style={{ color:T.textMuted, fontSize:11, marginTop:9, fontFamily:"'DM Mono',monospace" }}>No history yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:280, overflowY:'auto' }}>
                {history.map((item,i) => <HistRow key={i} item={item} index={i}/>)}
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIVITY STATS ── */}
        <div style={{
          background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:18,
          padding:'clamp(18px,4vw,26px)', boxShadow:`0 2px 16px ${T.shadow}`,
          marginBottom:16,
          opacity: in3?1:0, transform: in3?'none':'translateY(24px)',
          transition:'opacity .6s ease, transform .6s ease',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
            <div style={{ width:30, height:30, borderRadius:8, background:`${T.green}14`, border:`1px solid ${T.green}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h2 style={{ fontSize:11, fontWeight:700, color:T.textPrimary, letterSpacing:'-.01em', fontFamily:"'Unbounded',sans-serif" }}>Activity Stats</h2>
          </div>
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:10 }}>
              {[...Array(4)].map((_,i)=><Skel key={i} h={90} r={14}/>)}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(clamp(90px,18vw,150px),1fr))', gap:10 }}>
              <StatCard val={stats?.totalSearches} label="Searches"   icon="search"        color={T.orange}      glow={T.orangeGlow}  delay={0}  />
              <StatCard val={stats?.orders}        label="Orders"     icon="shopping_bag"  color={T.green}       glow={T.greenGlow}   delay={100}/>
              <StatCard val={stats?.imageSearches} label="Img Search" icon="photo_camera"  color={T.amber}       glow={T.amberGlow}   delay={200}/>
              <StatCard val={stats?.savedItems}    label="Saved"      icon="bookmark"      color={T.orangeLight} glow={T.orangeGlow}  delay={300}/>
            </div>
          )}
        </div>

        {/* ── DANGER ZONE ── */}
        <div style={{ opacity: in4?1:0, transform: in4?'none':'translateY(24px)', transition:'opacity .6s ease, transform .6s ease' }}>
          <DangerZone onDelete={()=>setDelModal(true)} visible={in4}/>
        </div>
      </div>

      {/* ── DELETE MODAL ── */}
      <DeleteModal
        visible={delModal}
        onClose={()=>{ if(!deleting&&!deleted){setDelModal(false);setDeleted(false);} }}
        onConfirm={handleDelete}
        deleting={deleting}
        deleted={deleted}
      />

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible}/>
    </div>
  );
}

function clamp(min, max) { return `clamp(${min}px, 2.5vw, ${max}px)`; }