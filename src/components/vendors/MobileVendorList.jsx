// src/components/vendors/MobileVendorList.jsx
// Mobile-only ranked vendor list ("Popular Sellers"): avatar overlapping the
// left edge of each row, rank badge, name + stats, and a Visit button.
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const V = {
  bg:      '#F7F5F3',
  card:    '#FFFFFF',
  ink:     '#26201C',
  muted:   '#9A928C',
  accent:  '#C84B11',
  accentD: '#A93D0C',
  accentBg:'#FBEDE6',
  green:   '#1F9D6B',
  font:    "'Poppins', system-ui, sans-serif",
};

// Muted, varied avatar backdrops (cycled by rank) for vendors without a photo
const AVATAR_TONES = ['#3F4656', '#A9B38C', '#D2553F', '#C9A36B', '#E0784C', '#7E6A93', '#5B8A8C'];

const spring = { type: 'spring', stiffness: 100, damping: 20 };

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const rowVariants = {
  hidden: { opacity: 0, x: 28 },
  show:   { opacity: 1, x: 0, transition: spring },
  exit:   { opacity: 0, x: -20, transition: { duration: 0.18 } },
};

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'B';

const compact = n => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n || 0));

// Perpetual slow twinkle next to the title — isolated so it never re-renders the list
const TitleSparkle = memo(function TitleSparkle() {
  return (
    <motion.svg
      width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
      animate={{ rotate: [0, 18, 0], scale: [1, 1.12, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ marginLeft: 4, flexShrink: 0 }}
    >
      <path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z" fill="#F2B544" />
      <circle cx="19" cy="4.5" r="1.4" fill="#F6CF7A" />
      <circle cx="5" cy="18.5" r="1" fill="#F6CF7A" />
    </motion.svg>
  );
});

function VendorAvatar({ vendor, rank }) {
  const tone = AVATAR_TONES[(rank - 1) % AVATAR_TONES.length];
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.08 + Math.min(rank, 10) * 0.05 }}
      style={{
        position: 'absolute', left: 0, top: '50%', marginTop: -33,
        width: 66, height: 66, borderRadius: '50%', background: tone,
        boxShadow: '0 6px 16px rgba(38,32,28,0.16)', zIndex: 1,
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {vendor.avatarUrl
          ? <img src={vendor.avatarUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#fff', fontWeight: 600, fontSize: 20, letterSpacing: '0.02em' }}>{initials(vendor.name)}</span>}
      </div>
      <span
        aria-label={`${vendor.products || 0} bags uploaded`}
        style={{
          position: 'absolute', top: -1, right: -3,
          minWidth: 20, height: 20, padding: '0 5px', borderRadius: 999,
          background: '#2F2A27', color: '#fff', border: '2px solid #fff',
          fontSize: 10, fontWeight: 600, lineHeight: '16px', textAlign: 'center',
        }}
      >
        {compact(vendor.products)}
      </span>
    </motion.div>
  );
}

function VendorRow({ vendor, rank, onOpen }) {
  const verified = !!(vendor.ninApproved || vendor.communityTrusted);
  return (
    <motion.li variants={rowVariants} exit="exit" layout style={{ position: 'relative', listStyle: 'none', paddingLeft: 0 }}>
      <VendorAvatar vendor={vendor} rank={rank} />
      <motion.div
        whileTap={{ scale: 0.985 }}
        onClick={() => onOpen(vendor)}
        style={{
          marginLeft: 30, minHeight: 78,
          background: V.card, borderRadius: 18,
          padding: '14px 14px 14px 50px',
          boxShadow: '0 8px 24px -10px rgba(38,32,28,0.14)',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: V.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {vendor.name}
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 11, color: V.muted, display: 'flex', gap: 12, whiteSpace: 'nowrap' }}>
            <span style={{ textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vendor.specialty || 'Bags'}</span>
            <span>{compact(vendor.views)} views</span>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          {verified ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 500, color: V.green }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Verified
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 500, color: V.muted }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#F2B544"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
              {vendor.reviews || 0}
            </span>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={e => { e.stopPropagation(); onOpen(vendor); }}
            style={{
              height: 30, padding: '0 16px', borderRadius: 999, border: 'none',
              background: V.accent, color: '#fff', cursor: 'pointer',
              fontFamily: V.font, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
            }}
          >
            VISIT
          </motion.button>
        </div>
      </motion.div>
    </motion.li>
  );
}

function SkeletonRow({ i }) {
  return (
    <li style={{ position: 'relative', listStyle: 'none' }}>
      <div className="mvl-shimmer" style={{ position: 'absolute', left: 0, top: 6, width: 66, height: 66, borderRadius: '50%', animationDelay: `${i * 90}ms` }} />
      <div style={{ marginLeft: 30, height: 78, borderRadius: 18, background: V.card, padding: '18px 14px 18px 50px' }}>
        <div className="mvl-shimmer" style={{ width: '55%', height: 12, borderRadius: 6, animationDelay: `${i * 90}ms` }} />
        <div className="mvl-shimmer" style={{ width: '35%', height: 9, borderRadius: 6, marginTop: 10, animationDelay: `${i * 90}ms` }} />
      </div>
    </li>
  );
}

export default function MobileVendorList({ vendors, loading, search, onSearch, onBack, onOpen }) {
  return (
    <section style={{ fontFamily: V.font, color: V.ink, margin: '-24px -12px 0', padding: '18px 16px 110px', background: V.bg, minHeight: '100dvh' }}>
      <style>{`
        @keyframes mvlShimmer { 0%{background-position:-200px 0} 100%{background-position:200px 0} }
        .mvl-shimmer {
          background:linear-gradient(90deg,#EFEBE8 0px,#F8F6F4 60px,#EFEBE8 120px);
          background-size:400px 100%;animation:mvlShimmer 1.3s linear infinite;
        }
        .mvl-search::placeholder { color:#B5ADA7; }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}
      >
        <motion.button
          type="button"
          onClick={onBack}
          aria-label="Back"
          whileTap={{ scale: 0.9 }}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: V.accentBg, color: V.accent, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </motion.button>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center' }}>
          Popular Sellers
          <TitleSparkle />
        </h1>
      </motion.div>

      {/* Search */}
      <motion.label
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 16px', marginBottom: 22,
          background: V.card, borderRadius: 14, boxShadow: '0 6px 18px -10px rgba(38,32,28,0.18)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={V.muted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input
          className="mvl-search"
          type="search"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search sellers"
          aria-label="Search sellers"
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: V.font, fontSize: 13, color: V.ink }}
        />
        {search && (
          <button type="button" onClick={() => onSearch('')} aria-label="Clear search" style={{ border: 'none', background: 'none', padding: 2, cursor: 'pointer', color: V.muted, display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </motion.label>

      {loading ? (
        <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} i={i} />)}
        </ul>
      ) : vendors.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: V.accentBg, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={V.accent} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No sellers match "{search}"</p>
          <p style={{ margin: '6px 0 18px', fontSize: 12, color: V.muted }}>Try a shop name or a bag type like tote or clutch.</p>
          <button type="button" onClick={() => onSearch('')} style={{ height: 38, padding: '0 22px', borderRadius: 999, border: 'none', background: V.accent, color: '#fff', fontFamily: V.font, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Show all sellers
          </button>
        </motion.div>
      ) : (
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <AnimatePresence initial={false}>
            {vendors.map((v, i) => <VendorRow key={v.id} vendor={v} rank={i + 1} onOpen={onOpen} />)}
          </AnimatePresence>
        </motion.ul>
      )}
    </section>
  );
}
