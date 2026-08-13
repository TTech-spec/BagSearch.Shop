import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSEO } from './hooks/useSEO';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';

const C = { primary: '#c84b11', primaryLight: '#f97316' };

// Placeholder "reels" — gradient cards standing in for seller video content
// until the real feature ships. Each has its own hue so the preview doesn't
// look like one repeated card.
const MOCK_REELS = [
  { id: 1, gradient: 'linear-gradient(160deg,#c84b11 0%,#7c2d12 100%)', seller: 'Aniekan Luxe Bags', caption: 'Unboxing our new tote collection ✨', likes: 412, comments: 38, shares: 12 },
  { id: 2, gradient: 'linear-gradient(160deg,#be185d 0%,#831843 100%)', seller: 'Lekki Bag Studio', caption: 'How to spot a real vs fake clutch 👜', likes: 289, comments: 21, shares: 9 },
  { id: 3, gradient: 'linear-gradient(160deg,#0d9488 0%,#134e4a 100%)', seller: 'Abuja Handbags Co.', caption: 'Restyling one bag 5 ways 🔥', likes: 531, comments: 64, shares: 27 },
];

const TABS = [{ id: 'community', label: 'Community' }, { id: 'following', label: 'Following' }, { id: 'foryou', label: 'For You' }];

// Mock comment thread reused across reels — this is a UI preview, not real data.
const MOCK_COMMENTS = [
  { id: 1, name: 'Ada N.', text: 'This bag is stunning! Is it still available? 😍', time: '2h', likes: 14 },
  { id: 2, name: 'Chidi O.', text: 'Quality looks top notch 🔥 how much is delivery to Abuja?', time: '5h', likes: 8 },
  { id: 3, name: 'Blessing K.', text: 'How much for the mini size?', time: '1d', likes: 3 },
  { id: 4, name: 'Emeka T.', text: 'Bought one last week, it\'s even nicer in person', time: '2d', likes: 21 },
];

function IconHeart({ size = 26, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21s-6.7-4.35-9.3-8.2C.9 9.9 1.7 6.4 4.8 5.1c2.2-.9 4.4 0 5.7 1.8l1.5 2 1.5-2c1.3-1.8 3.5-2.7 5.7-1.8 3.1 1.3 3.9 4.8 2.1 7.7C18.7 16.65 12 21 12 21z" /></svg>;
}
function IconComment({ size = 26, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
function IconBookmark({ size = 24, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>;
}
function IconShare({ size = 24, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
}
function IconPlay({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)">
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.28)" />
      <polygon points="10,8 17,12 10,16" />
    </svg>
  );
}
function IconArrowLeft({ size = 18, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconSearch({ size = 18, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IconChevron({ size = 20, color = 'white', dir = 'up' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'down' ? 'rotate(180deg)' : 'none' }}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ComingSoonBadge({ style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, boxShadow: '0 6px 20px rgba(200,75,17,0.5)', ...style }}>
      <span style={{ fontSize: 14 }}>🎬</span>
      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>Coming Soon — Preview</span>
    </div>
  );
}

function TabRow({ tab, onSelect, size = 14 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: size, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? 'white' : 'rgba(255,255,255,0.55)' }}>{t.label}</span>
          {tab === t.id && <span style={{ width: 18, height: 2, borderRadius: 2, background: 'white' }} />}
        </button>
      ))}
    </div>
  );
}

function ReelsToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: 'white', color: '#1a0a00', padding: '10px 20px', borderRadius: 30, fontSize: 13, fontWeight: 800, boxShadow: '0 12px 32px rgba(0,0,0,0.35)', whiteSpace: 'nowrap' }}>
          🎬 Reels is coming very soon!
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IconX({ size = 14, color = 'white' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

/* ─── Comments — bottom sheet on mobile, side panel on desktop ──────────── */

function CommentsBody({ onClose, onNotReady }) {
  const [draft, setDraft] = useState('');
  const post = () => { if (!draft.trim()) return; setDraft(''); onNotReady(); };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>{MOCK_COMMENTS.length} Comments</span>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconX size={13} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {MOCK_COMMENTS.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
              {c.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.time}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{c.text}</p>
            </div>
            <button onClick={onNotReady} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              <IconHeart size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{c.likes}</span>
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') post(); }} placeholder="Add a comment…"
          style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '9px 14px', color: 'white', fontSize: 13, outline: 'none' }} />
        <button onClick={post} disabled={!draft.trim()} style={{ background: 'none', border: 'none', cursor: draft.trim() ? 'pointer' : 'default', color: draft.trim() ? C.primaryLight : 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>Post</button>
      </div>
    </>
  );
}

function CommentsPanel({ open, onClose, variant, onNotReady }) {
  if (variant === 'side') {
    return (
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 340 }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.25 }}
            style={{ background: '#161211', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 711, flexShrink: 0 }}>
            <div style={{ width: 340, height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 14 }}>
              <CommentsBody onClose={onClose} onNotReady={onNotReady} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70 }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 71, height: '68vh', background: '#161211', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '10px auto 4px', flexShrink: 0 }} />
            <CommentsBody onClose={onClose} onNotReady={onNotReady} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Reels() {
  const navigate = useNavigate();
  const isMobile = useIsMobileViewport(768);
  const [tab, setTab] = useState('foryou');
  const [toast, setToast] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useSEO({ title: 'Reels (Coming Soon) | BagSearch', description: 'A preview of BagSearch Reels — short videos from bag sellers across Nigeria. Coming soon.', url: '/reels', noindex: true });

  const notReady = () => {
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };
  const selectTab = (id) => { setTab(id); notReady(); };

  return isMobile
    ? <MobileReels tab={tab} onSelectTab={selectTab} toast={toast} notReady={notReady} navigate={navigate} />
    : <DesktopReels tab={tab} onSelectTab={selectTab} toast={toast} notReady={notReady} navigate={navigate} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />;
}

/* ─── Mobile: full-bleed vertical snap-scroll ────────────────────────────── */

function MobileReels({ tab, onSelectTab, toast, notReady, navigate }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white', fontFamily: "'Manrope',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(180deg,rgba(0,0,0,0.6) 0%,transparent 100%)' }}>
        <button onClick={() => navigate('/products')} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconArrowLeft size={16} />
        </button>
        <TabRow tab={tab} onSelect={onSelectTab} />
        <button onClick={notReady} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconSearch size={16} />
        </button>
      </div>

      <ComingSoonBadge style={{ position: 'fixed', top: 62, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }} />

      <div style={{ height: '100vh', overflowY: 'auto', scrollSnapType: 'y mandatory' }}>
        {MOCK_REELS.map((reel, i) => (
          <ReelCard key={reel.id} reel={reel} index={i} onInteract={notReady} onOpenComments={() => setCommentsOpen(true)} />
        ))}
      </div>

      <CommentsPanel variant="sheet" open={commentsOpen} onClose={() => setCommentsOpen(false)} onNotReady={notReady} />
      <ReelsToast visible={toast} />
    </div>
  );
}

function ReelCard({ reel, index, onInteract, onOpenComments }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', scrollSnapAlign: 'start', background: reel.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
      <div onClick={onInteract} style={{ cursor: 'pointer' }}>
        <IconPlay size={index === 0 ? 64 : 56} />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '90px 70px 100px 16px', background: 'linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.75) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
            {reel.seller.charAt(0)}
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>{reel.seller}</span>
          <button onClick={onInteract} style={{ padding: '4px 12px', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.7)', background: 'transparent', color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Follow</button>
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{reel.caption}</p>
      </div>

      <div style={{ position: 'absolute', right: 12, bottom: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <button onClick={() => { setLiked(l => !l); onInteract(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <IconHeart color={liked ? '#f97316' : 'white'} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.likes + (liked ? 1 : 0)}</span>
        </button>
        <button onClick={onOpenComments} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <IconComment />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.comments}</span>
        </button>
        <button onClick={() => { setSaved(s => !s); onInteract(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <IconBookmark color={saved ? '#f97316' : 'white'} />
        </button>
        <button onClick={onInteract} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <IconShare />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.shares}</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Desktop: centered "theater" panel, YouTube-Shorts-style ───────────── */

function DesktopReels({ tab, onSelectTab, toast, notReady, navigate, activeIndex, setActiveIndex }) {
  const reel = MOCK_REELS[activeIndex];
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const goTo = (i) => { setActiveIndex(((i % MOCK_REELS.length) + MOCK_REELS.length) % MOCK_REELS.length); setLiked(false); setSaved(false); };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%,#241a15 0%,#0a0806 60%)', color: 'white', fontFamily: "'Manrope',sans-serif" }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => navigate('/products')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <IconArrowLeft size={14} /> Back to BagSearch
        </button>
        <TabRow tab={tab} onSelect={onSelectTab} size={15} />
        <button onClick={notReady} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <IconSearch size={14} /> Search
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 60px' }}>
        <ComingSoonBadge style={{ marginBottom: 24 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* Prev/next + progress dots */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <button onClick={() => goTo(activeIndex - 1)} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevron dir="up" />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MOCK_REELS.map((r, i) => (
                <span key={r.id} onClick={() => goTo(i)} style={{ width: 6, height: i === activeIndex ? 20 : 6, borderRadius: 4, background: i === activeIndex ? C.primaryLight : 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'all 0.25s ease' }} />
              ))}
            </div>
            <button onClick={() => goTo(activeIndex + 1)} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevron dir="down" />
            </button>
          </div>

          {/* Phone-proportioned reel panel */}
          <AnimatePresence mode="wait">
            <motion.div key={reel.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
              style={{ width: 400, height: 711, borderRadius: 28, overflow: 'hidden', position: 'relative', background: reel.gradient, boxShadow: '0 40px 100px rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
              <div onClick={notReady} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <IconPlay size={64} />
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '90px 24px 26px 20px', background: 'linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.75) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
                    {reel.seller.charAt(0)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{reel.seller}</span>
                  <button onClick={notReady} style={{ padding: '5px 13px', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.7)', background: 'transparent', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Follow</button>
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{reel.caption}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action rail — outside the panel, YouTube-Shorts-style */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <button onClick={() => { setLiked(l => !l); notReady(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconHeart size={22} color={liked ? '#f97316' : 'white'} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{reel.likes + (liked ? 1 : 0)}</span>
            </button>
            <button onClick={() => setCommentsOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 48, height: 48, borderRadius: '50%', background: commentsOpen ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconComment size={22} color={commentsOpen ? '#f97316' : 'white'} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{reel.comments}</span>
            </button>
            <button onClick={() => { setSaved(s => !s); notReady(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBookmark size={20} color={saved ? '#f97316' : 'white'} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Save</span>
            </button>
            <button onClick={notReady} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconShare size={20} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{reel.shares}</span>
            </button>
          </div>

          <CommentsPanel variant="side" open={commentsOpen} onClose={() => setCommentsOpen(false)} onNotReady={notReady} />
        </div>
      </div>

      <ReelsToast visible={toast} />
    </div>
  );
}
