// src/components/profile/BuyerProfile.jsx
// Buyer profile (mobile + desktop). Pure UI: all data and saving come from
// UserProfile (src/userProfile.jsx) via props.
import React, { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import PushNotificationToggle from '../PushNotificationToggle';

const P = {
  ink: '#1E1A17',
  muted: '#6F6761',
  faint: '#A69E98',
  line: '#EFE9E5',
  pill: '#F4F1EF',
  yellow: '#F3B41E',
  green: '#7DAF5C',
  accent: '#C84B11',
  price: '#C2361F',
  danger: '#B42318',
  font: "'Poppins', system-ui, sans-serif",
};
const PASTELS = ['#A6DFAE', '#E6D3F5', '#F8C9A5', '#9ADFE1'];
const SELLER_TONES = ['#3F4656', '#D2553F', '#7E6A93', '#5B8A8C', '#C9A36B', '#A9B38C'];

const STATUS = {
  paid: { label: 'Paid, awaiting delivery', bg: '#E3ECFF', fg: '#2449B8', dot: '#2449B8', confirm: true },
  shipped: { label: 'On its way', bg: '#FFF3D6', fg: '#8A5A00', dot: '#D99A00', confirm: true },
  delivered: { label: 'Delivered', bg: '#E7F4EA', fg: '#2F6B3E', dot: '#3B8E4F', confirm: false },
  seller_credited: { label: 'Completed', bg: '#E7F4EA', fg: '#2F6B3E', dot: '#3B8E4F', confirm: false },
  disputed: { label: 'Disputed', bg: '#FDEBEC', fg: '#9F2F2D', dot: '#B42318', confirm: false },
};

const spring = { type: 'spring', stiffness: 100, damping: 20 };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: spring } };

const naira = n => `₦${Number(n || 0).toLocaleString()}`;
const memberSince = d => (d ? new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '');
const initialsOf = name => (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'B';

const Svg = ({ size = 16, sw = 1.9, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Back = () => <Svg size={18} sw={2}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>;
const Chevron = () => <Svg size={14} sw={2.2}><path d="M9 6l6 6-6 6" /></Svg>;

function Shimmer({ h = 14, w = '100%', r = 8, style }) {
  return <div className="bp-shimmer" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

// Counts up from 0 when it first appears
function CountUp({ value }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, v => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(mv, value || 0, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

function Avatar({ profile, size, ring }) {
  const name = profile?.full_name;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {ring && (
        <motion.span
          aria-hidden="true"
          animate={{ scale: [1, 1.32], opacity: [0.55, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #fff' }}
        />
      )}
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt={name || 'Your photo'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxSizing: 'border-box' }} />
        : <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: P.ink, color: '#fff', fontSize: size * 0.32, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxSizing: 'border-box' }}>{initialsOf(name)}</div>}
    </div>
  );
}

// Inline-editable account field (name / email / phone)
function EditableRow({ label, field, value, type = 'text', onSave, icon, tone, last }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [err, setErr] = useState('');

  const start = () => { setDraft(value || ''); setErr(''); setEditing(true); };
  const save = async () => {
    const v = draft.trim();
    if (!v || v === value) { setEditing(false); return; }
    setState('saving');
    try {
      await onSave(field, v);
      setState('saved');
      setEditing(false);
      setTimeout(() => setState('idle'), 1600);
    } catch (e) {
      setErr(e?.message || 'Could not save. Try again.');
      setState('error');
    }
  };

  return (
    <div className="bp-row" style={{ borderBottom: last ? 'none' : `1px solid ${P.line}` }}>
      <div style={{ minHeight: 60, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 36, height: 36, borderRadius: 12, background: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 11.5, color: P.muted }}>{label}</span>
          <span style={{ display: 'block', fontSize: 13.5, color: value ? P.ink : P.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || `Add your ${label.toLowerCase()}`}</span>
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {state === 'saved'
            ? <motion.span key="ok" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} style={{ color: '#2F6B3E', display: 'flex' }}><Svg size={16} sw={2.4}><polyline points="20 6 9 17 4 12" /></Svg></motion.span>
            : !editing && <motion.button key="edit" type="button" onClick={start} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bp-link" style={{ fontSize: 12 }}>Edit</motion.button>}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px 62px' }}>
              <label htmlFor={`bp-${field}`} className="bp-sr">{label}</label>
              <input
                id={`bp-${field}`} type={type} value={draft} autoFocus
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                className="bp-input"
              />
              {state === 'error' && <p role="alert" style={{ margin: '6px 0 0', fontSize: 11.5, color: P.danger }}>{err}</p>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button type="button" onClick={save} disabled={state === 'saving'} className="bp-dark" style={{ height: 38, padding: '0 16px', fontSize: 12.5 }}>
                  {state === 'saving' ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="bp-ghost" style={{ height: 38, padding: '0 14px', fontSize: 12.5 }}>Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderRow({ order, index, compact, navigate }) {
  const s = STATUS[order.status] || STATUS.paid;
  return (
    <motion.div variants={rise} className="bp-row" style={{ padding: compact ? 12 : '14px 18px', display: 'flex', alignItems: 'center', gap: compact ? 12 : 16, borderBottom: `1px solid ${P.line}` }}>
      <div style={{ width: compact ? 64 : 60, height: compact ? 64 : 60, borderRadius: 16, background: PASTELS[index % 4], padding: 6, boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 11, overflow: 'hidden', background: '#fff' }}>
          {order.product_image && <img src={order.product_image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: compact ? 13.5 : 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.product_name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11.5, color: P.muted }}>{order.seller_name || 'Seller'}{compact ? ` · ${naira(order.total_price)}` : ''}</p>
        {compact && <StatusChip s={s} />}
      </div>
      {!compact && <span style={{ width: 120, fontSize: 14, fontWeight: 600 }}>{naira(order.total_price)}</span>}
      {!compact && <span style={{ width: 190 }}><StatusChip s={s} /></span>}
      {!compact && (
        <span style={{ width: 160, textAlign: 'right' }}>
          {s.confirm && <button type="button" onClick={() => navigate('/orders')} className="bp-dark" style={{ height: 38, padding: '0 16px', fontSize: 12 }}>Confirm delivery</button>}
        </span>
      )}
    </motion.div>
  );
}

function StatusChip({ s }) {
  return (
    <span style={{ marginTop: 6, height: 24, padding: '0 10px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h2>
      {action}
    </div>
  );
}

export default function BuyerProfile({
  profile, stats, history, recentSellers, orders, loading, isMobile, navigate,
  onSave, onClearHistory, onLogout, onRequestDelete,
}) {
  const compact = isMobile;
  const statTiles = [
    { label: 'Orders', value: stats?.orders ?? 0, bg: PASTELS[0], to: '/orders' },
    { label: 'Saved bags', value: stats?.savedItems ?? 0, bg: PASTELS[1] },
    { label: 'Searches', value: stats?.totalSearches ?? 0, bg: PASTELS[2] },
  ];
  const shownOrders = (orders || []).slice(0, compact ? 1 : 3);
  const latest = shownOrders[0];
  const latestStatus = latest ? (STATUS[latest.status] || STATUS.paid) : null;

  const icon = {
    name: <Svg><circle cx="12" cy="8" r="4" /><path d="M4 20.5a8 8 0 0 1 16 0" /></Svg>,
    email: <Svg><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7l8.5 6 8.5-6" /></Svg>,
    phone: <Svg><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Svg>,
  };

  const identity = (
    <motion.section
      variants={rise}
      style={{ position: 'relative', borderRadius: compact ? 28 : 32, background: P.yellow, overflow: 'hidden', padding: compact ? '22px 20px 20px' : '32px 28px 28px' }}
    >
      <motion.span aria-hidden="true" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', right: compact ? -40 : -60, top: compact ? -50 : -70, width: compact ? 170 : 240, height: compact ? 170 : 240, borderRadius: '50%', background: 'rgba(255,255,255,.22)' }} />
      <motion.span aria-hidden="true" animate={{ x: [0, 10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', left: compact ? -30 : -50, bottom: compact ? -60 : -80, width: compact ? 140 : 220, height: compact ? 140 : 220, borderRadius: '50%', background: P.green, opacity: 0.85 }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : 'flex-start', gap: compact ? 16 : 20 }}>
        {loading ? <Shimmer h={compact ? 76 : 112} w={compact ? 76 : 112} r={999} /> : <Avatar profile={profile} size={compact ? 76 : 112} ring />}
        <div style={{ minWidth: 0 }}>
          {loading ? <><Shimmer h={20} w={160} /><Shimmer h={12} w={190} style={{ marginTop: 8 }} /></> : <>
            <h1 style={{ margin: 0, fontSize: compact ? 21 : 30, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}>{profile?.full_name || 'Your profile'}</h1>
            <p style={{ margin: '4px 0 0', fontSize: compact ? 12.5 : 13.5, color: 'rgba(30,26,23,.75)', overflowWrap: 'anywhere' }}>{profile?.email}</p>
            {profile?.created_at && (
              <span style={{ marginTop: 10, height: 26, padding: '0 10px', borderRadius: 999, background: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Svg size={12} sw={2.2}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></Svg>
                Member since {memberSince(profile.created_at)}
              </span>
            )}
          </>}
        </div>
      </div>
    </motion.section>
  );

  const statsGrid = (
    <motion.section variants={rise} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: compact ? 10 : 16 }}>
      {statTiles.map(t => (
        <motion.button
          key={t.label} type="button"
          onClick={t.to ? () => navigate(t.to) : undefined}
          whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }} transition={spring}
          style={{ height: compact ? 92 : 132, border: 'none', borderRadius: compact ? 20 : 26, background: t.bg, textAlign: 'left', padding: compact ? 14 : 22, cursor: t.to ? 'pointer' : 'default', fontFamily: P.font, color: P.ink }}
        >
          <span style={{ display: 'block', fontSize: compact ? 24 : 36, fontWeight: 600, letterSpacing: '-0.02em' }}>{loading ? '–' : <CountUp value={t.value} />}</span>
          <span style={{ display: 'block', marginTop: 2, fontSize: compact ? 11.5 : 13, color: 'rgba(30,26,23,.75)' }}>{t.label}</span>
        </motion.button>
      ))}
    </motion.section>
  );

  const ordersSection = (
    <motion.section variants={rise}>
      <SectionTitle title={compact ? 'Latest order' : 'Recent orders'} action={<button type="button" className="bp-link" onClick={() => navigate('/orders')}>All orders <span aria-hidden="true">→</span></button>} />
      {loading ? <Shimmer h={88} r={20} style={{ marginTop: 12 }} /> : shownOrders.length === 0 ? (
        <div style={{ marginTop: 12, padding: '22px 18px', borderRadius: 20, background: P.pill, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.accent }}>
            <Svg size={20}><path d="M6.5 8 8 4h8l1.5 4" /><path d="M4.8 8h14.4l-1 11a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8z" /></Svg>
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>No orders yet</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: P.muted }}>Bags you buy show up here with their delivery status.</p>
          </div>
          <button type="button" className="bp-dark" onClick={() => navigate('/products')} style={{ height: 38, padding: '0 16px', fontSize: 12 }}>Browse</button>
        </div>
      ) : (
        <>
          <motion.div variants={list} initial="hidden" animate="show" style={{ marginTop: 12, border: `1px solid ${P.line}`, borderRadius: compact ? 20 : 22, overflow: 'hidden' }}>
            {shownOrders.map((o, i) => <OrderRow key={o.id} order={o} index={i} compact={compact} navigate={navigate} />)}
          </motion.div>
          {compact && latestStatus?.confirm && (
            <>
              <motion.button type="button" whileTap={{ scale: 0.98 }} className="bp-dark" onClick={() => navigate('/orders')} style={{ marginTop: 10, width: '100%', height: 46, fontSize: 13 }}>
                Got it? Confirm delivery
              </motion.button>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: P.faint, textAlign: 'center' }}>Your money stays safe until you confirm delivery.</p>
            </>
          )}
        </>
      )}
    </motion.section>
  );

  const searchesSection = (
    <motion.section variants={rise} style={compact ? undefined : { border: `1px solid ${P.line}`, borderRadius: 22, padding: 20 }}>
      <SectionTitle title="Recent searches" action={history?.length ? <button type="button" className="bp-link" style={{ color: P.muted }} onClick={onClearHistory}>Clear</button> : null} />
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {loading ? [80, 110, 70].map(w => <Shimmer key={w} h={34} w={w} r={999} />)
          : !history?.length ? <p style={{ margin: 0, fontSize: 12.5, color: P.muted }}>Your searches will appear here.</p>
          : (
            <AnimatePresence initial={false}>
              {history.slice(0, 8).map((h, i) => (
                <motion.button
                  key={`${h.query}-${h.created_at}`} type="button"
                  layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ ...spring, delay: i * 0.03 }}
                  onClick={() => h.type !== 'image' && navigate(`/products?q=${encodeURIComponent(h.query)}`)}
                  className="bp-chip"
                >
                  {h.type === 'image'
                    ? <Svg size={12} sw={2}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>
                    : <span style={{ color: P.faint, display: 'flex' }}><Svg size={12} sw={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg></span>}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{h.type === 'image' ? 'Photo search' : h.query}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
      </div>
    </motion.section>
  );

  const sellersSection = (
    <motion.section variants={rise} style={compact ? undefined : { border: `1px solid ${P.line}`, borderRadius: 22, padding: 20 }}>
      <SectionTitle title="Sellers you viewed" />
      <div className="bp-hscroll" style={{ marginTop: 12, display: 'flex', gap: 14, overflowX: 'auto', margin: compact ? '12px -16px 0' : '12px 0 0', padding: compact ? '0 16px 4px' : 0 }}>
        {loading ? [0, 1, 2].map(i => <Shimmer key={i} h={64} w={64} r={999} />)
          : !recentSellers?.length ? <p style={{ margin: 0, fontSize: 12.5, color: P.muted }}>Sellers whose bags you open will show up here.</p>
          : recentSellers.map((s, i) => {
            const name = s.brand_name || s.full_name || 'Seller';
            return (
              <motion.button
                key={s.user_id} type="button"
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 + i * 0.06 }}
                whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate(s.profile_slug ? `/vendor/${s.profile_slug}` : `/vendor/${s.user_id}`)}
                style={{ width: 72, flexShrink: 0, border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: P.font, color: P.ink, textAlign: 'center' }}
              >
                {s.avatar_url
                  ? <img src={s.avatar_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto' }} />
                  : <span style={{ width: 60, height: 60, margin: '0 auto', borderRadius: '50%', background: SELLER_TONES[i % SELLER_TONES.length], color: '#fff', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initialsOf(name)}</span>}
                <span style={{ display: 'block', marginTop: 6, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
              </motion.button>
            );
          })}
      </div>
    </motion.section>
  );

  const accountSection = (
    <motion.section variants={rise}>
      <SectionTitle title="Account" />
      <div style={{ marginTop: 10, border: `1px solid ${P.line}`, borderRadius: 20, overflow: 'hidden' }}>
        <EditableRow label="Name" field="full_name" value={profile?.full_name} onSave={onSave} icon={icon.name} tone={PASTELS[3]} />
        <EditableRow label="Email" field="email" type="email" value={profile?.email} onSave={onSave} icon={icon.email} tone={PASTELS[2]} />
        <EditableRow label="Phone" field="phone" type="tel" value={profile?.phone} onSave={onSave} icon={icon.phone} tone={PASTELS[1]} last />
      </div>
      <div className="bp-push" style={{ marginTop: 12 }}><PushNotificationToggle /></div>
      <div style={{ marginTop: 12, border: `1px solid ${P.line}`, borderRadius: 20, overflow: 'hidden' }}>
        {[
          { label: 'Help and feedback', to: '/contact', tone: PASTELS[2], icon: <Svg><path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4.5A8 8 0 1 1 21 12z" /></Svg> },
          { label: 'Terms of service', to: '/terms-of-service', tone: PASTELS[0], icon: <Svg><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></Svg> },
        ].map(r => (
          <button key={r.label} type="button" onClick={() => navigate(r.to)} className="bp-row bp-listbtn" style={{ borderBottom: `1px solid ${P.line}` }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: r.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.icon}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{r.label}</span>
            <span style={{ color: P.faint, display: 'flex' }}><Chevron /></span>
          </button>
        ))}
        <button type="button" onClick={onLogout} className="bp-row bp-listbtn">
          <span style={{ width: 36, height: 36, borderRadius: 12, background: P.pill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Svg><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></Svg></span>
          <span style={{ flex: 1, textAlign: 'left' }}>Log out</span>
        </button>
      </div>
      <button type="button" onClick={onRequestDelete} className="bp-delete">Delete my account</button>
    </motion.section>
  );

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', fontFamily: P.font, color: P.ink }}>
      <style>{`
        @keyframes bpShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .bp-shimmer{background:linear-gradient(90deg,#F1EDEA 0px,#F9F7F5 120px,#F1EDEA 240px);background-size:800px 100%;animation:bpShimmer 1.4s linear infinite}
        .bp-row{transition:background .2s}
        .bp-row:hover{background:#FAF8F6}
        .bp-link{border:none;background:none;cursor:pointer;font-family:${P.font};font-size:12.5px;color:${P.accent};padding:6px 0;display:inline-flex;gap:4px;align-items:center}
        .bp-dark{border:none;border-radius:999px;background:${P.ink};color:#fff;font-family:${P.font};font-weight:500;cursor:pointer;transition:background .2s,transform .15s}
        .bp-dark:hover{background:#000}.bp-dark:active{transform:scale(.97)}.bp-dark:disabled{opacity:.6;cursor:default}
        .bp-ghost{border:none;border-radius:999px;background:${P.pill};color:${P.ink};font-family:${P.font};cursor:pointer}
        .bp-input{width:100%;box-sizing:border-box;height:44px;padding:0 14px;border:1.5px solid ${P.line};border-radius:12px;font-family:${P.font};font-size:14px;color:${P.ink};outline:none;transition:border-color .2s}
        .bp-input:focus{border-color:${P.ink}}
        .bp-chip{height:34px;padding:0 12px;border:none;border-radius:999px;background:${P.pill};font-family:${P.font};font-size:12px;color:${P.ink};display:inline-flex;align-items:center;gap:6px;cursor:pointer;transition:background .2s}
        .bp-chip:hover{background:#ECE7E3}
        .bp-listbtn{width:100%;min-height:60px;padding:0 14px;border:none;background:#fff;display:flex;align-items:center;gap:12px;font-family:${P.font};font-size:13.5px;color:${P.ink};cursor:pointer}
        .bp-delete{margin:18px auto 0;display:block;border:none;background:none;font-family:${P.font};font-size:12px;color:${P.danger};cursor:pointer;text-decoration:underline;text-underline-offset:3px}
        .bp-hscroll{scrollbar-width:none}.bp-hscroll::-webkit-scrollbar{display:none}
        .bp-push > div{margin:0 !important}
        .bp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
      `}</style>

      {/* Top bar */}
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={spring}
        style={{ maxWidth: compact ? 520 : 1440, margin: '0 auto', height: compact ? 64 : 84, padding: compact ? '0 16px' : '0 clamp(24px,5vw,72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => navigate(-1)} aria-label="Back"
          style={{ width: 44, height: 44, border: 'none', borderRadius: 14, background: P.pill, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.ink }}>
          <Back />
        </motion.button>
        <span style={{ fontSize: compact ? 15 : 17, fontWeight: 500 }}>My profile</span>
        <span style={{ width: 44 }} />
      </motion.header>

      {compact ? (
        <motion.main variants={list} initial="hidden" animate="show"
          style={{ maxWidth: 520, margin: '0 auto', padding: '8px 16px 120px', display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{identity}{statsGrid}</div>
          {ordersSection}
          {searchesSection}
          {sellersSection}
          {accountSection}
        </motion.main>
      ) : (
        <motion.main variants={list} initial="hidden" animate="show"
          style={{ maxWidth: 1440, margin: '0 auto', padding: '16px clamp(24px,5vw,72px) 80px', display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {identity}
            {accountSection}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {statsGrid}
            {ordersSection}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
              {searchesSection}
              {sellersSection}
            </div>
          </div>
        </motion.main>
      )}
    </div>
  );
}
