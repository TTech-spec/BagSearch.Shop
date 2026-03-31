import { useState, useEffect, useRef } from 'react';

// ─── Under Development Banner Component ──────────────────────────────────────
// Drop this anywhere in your app. Two modes:
//  1. <UnderDevelopmentBanner /> → sticky top banner (non-blocking)
//  2. <UnderDevelopmentBanner fullscreen /> → full page splash before app loads

const C = {
  primary:      '#c84b11',
  primaryLight: '#f97316',
  primaryBg:    '#fde8d8',
  primaryBorder:'#f9c4a0',
  text:         '#1a0a00',
  textMuted:    '#9a6348',
  textFaint:    '#c4957a',
  surface:      '#ffffff',
  border:       '#f0d9cc',
};

// ─── Animated bag icon (pure SVG, no emoji) ───────────────────────────────────
const AnimatedBag = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'bagBounce 2.4s cubic-bezier(0.34,1.56,0.64,1) infinite' }}>
    <rect x="8" y="18" width="32" height="24" rx="5" fill="#c84b11" opacity="0.15" stroke="#c84b11" strokeWidth="2"/>
    <rect x="10" y="20" width="28" height="20" rx="4" fill="#fde8d8" stroke="#c84b11" strokeWidth="1.5"/>
    <path d="M17 20V16a7 7 0 0 1 14 0v4" stroke="#c84b11" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="30" r="3" fill="#f97316"/>
    <path d="M24 27v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M21 30h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─── Particle burst on mount ──────────────────────────────────────────────────
const PARTICLES = ['🔨', '⚙️', '✨', '🛍️', '💛', '🧡', '👜', '🔧'];
function Sparkle({ x, y, emoji, delay }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontSize: 16, pointerEvents: 'none',
      animation: `sparkleFloat 1.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
      zIndex: 0,
    }}>{emoji}</div>
  );
}

// ─── Progress bar (fake progress to signal "actively building") ───────────────
function BuildProgress() {
  const [pct, setPct] = useState(72); // start near done, wiggle back and forth
  const [dir, setDir] = useState(1);
  useEffect(() => {
    const iv = setInterval(() => {
      setPct(p => {
        const next = p + dir * (Math.random() * 1.2 + 0.3);
        if (next >= 89) { setDir(-1); return 89; }
        if (next <= 68) { setDir(1); return 68; }
        return next;
      });
    }, 400);
    return () => clearInterval(iv);
  }, [dir]);

  return (
    <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted }}>Build Progress</span>
        <span style={{ fontSize: 11, fontWeight: 900, color: C.primary }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 8, background: C.primaryBg, borderRadius: 99, overflow: 'hidden', border: `1px solid ${C.primaryBorder}` }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: 'linear-gradient(90deg, #c84b11, #f97316, #ea580c)',
          backgroundSize: '200% 100%',
          animation: 'progressShimmer 2s linear infinite',
          transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
      <p style={{ fontSize: 10, color: C.textFaint, fontWeight: 600, marginTop: 5, textAlign: 'center' }}>
        Almost ready — finishing the magic ✨
      </p>
    </div>
  );
}

// ─── Feature teaser chips ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🔍', label: 'Visual Search' },
  { icon: '💬', label: 'WhatsApp Orders' },
  { icon: '📍', label: 'Location Filter' },
  { icon: '🛍️', label: 'Smart Cart' },
  { icon: '⭐', label: 'Seller Reviews' },
  { icon: '🔥', label: 'Hot Deals' },
];

function FeatureChips() {
  const [active, setActive] = useState(null);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
      {FEATURES.map((f, i) => (
        <button key={f.label}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 13px', borderRadius: 99,
            border: `1.5px solid ${active === i ? C.primary : C.primaryBorder}`,
            background: active === i ? C.primary : C.primaryBg,
            color: active === i ? 'white' : C.primary,
            fontSize: 11, fontWeight: 800,
            cursor: 'default',
            transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            transform: active === i ? 'translateY(-3px) scale(1.06)' : 'none',
            boxShadow: active === i ? `0 6px 18px rgba(200,75,17,0.35)` : 'none',
            animation: `chipIn 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 80 + 400}ms both`,
          }}>
          <span style={{ fontSize: 13 }}>{f.icon}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Countdown timer (counts up from "started", showing how long it's been in dev)
function DevTimer() {
  const startDate = new Date('2024-11-01'); // adjust to your actual start date
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = Date.now() - startDate.getTime();
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setElapsed(`${days}d ${hrs}h ${mins}m`);
    };
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'livePulse 1.5s ease-in-out infinite' }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>
        Actively building for <span style={{ color: C.primary, fontWeight: 900 }}>{elapsed}</span>
      </span>
    </div>
  );
}

// ─── BANNER MODE (sticky top bar) ─────────────────────────────────────────────
function StickyBanner({ onDismiss }) {
  const [hov, setHov] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(() => onDismiss?.(), 400);
  };

  return (
    <div style={{
      width: '100%', zIndex: 9998,
      background: 'linear-gradient(90deg, #1a0a00 0%, #3d1408 40%, #c84b11 100%)',
      overflow: 'hidden',
      opacity: dismissed ? 0 : 1,
      maxHeight: dismissed ? 0 : 80,
      transition: 'opacity 0.4s ease, max-height 0.4s ease',
    }}>
      {/* shimmer bar */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, #c84b11, #f97316, #ea580c, #c84b11)', backgroundSize: '300% 100%', animation: 'bannerShimmer 3s linear infinite' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Left: icon + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.25)', border: '1px solid rgba(249,115,22,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, animation: 'wrenchWiggle 2.5s ease-in-out infinite' }}>
            🔧
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>
              BagSearch is under active development
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginLeft: 8, display: 'inline' }}>
              — features may change. Thank you for your patience! 🧡
            </span>
          </div>
        </div>

        {/* Center: live dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'livePulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>Live build</span>
        </div>

        {/* Right: dismiss */}
        <button
          onClick={handleDismiss}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: hov ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, transition: 'all 0.2s' }}
        >✕</button>
      </div>
    </div>
  );
}

// ─── FULLSCREEN MODE (splash before app loads) ────────────────────────────────
function FullscreenSplash({ onEnter }) {
  const [phase, setPhase] = useState(0); // 0=entering, 1=shown, 2=exiting
  const [sparkles, setSparkles] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    // Spawn random sparkles across the bg
    const sp = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: `${5 + Math.random() * 85}%`,
      y: `${10 + Math.random() * 75}%`,
      emoji: PARTICLES[i % PARTICLES.length],
      delay: Math.random() * 1200,
    }));
    setSparkles(sp);
    setTimeout(() => setPhase(1), 80);
  }, []);

  const handleEnter = () => {
    setPhase(2);
    setTimeout(() => onEnter?.(), 700);
  };

  const visible = phase === 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: `linear-gradient(135deg, #fff9f5 0%, #fde8d8 40%, #fff5ee 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      opacity: phase === 2 ? 0 : phase === 0 ? 0 : 1,
      transform: phase === 2 ? 'scale(1.04)' : phase === 0 ? 'scale(0.97)' : 'scale(1)',
      transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
      overflow: 'hidden',
    }} ref={containerRef}>
      {/* Decorative bg circles */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(200,75,17,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '35%', left: '8%', width: 12, height: 12, borderRadius: '50%', background: C.primaryBorder, animation: 'floatDot 4s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '20%', right: '12%', width: 8, height: 8, borderRadius: '50%', background: C.primaryLight, opacity: 0.3, animation: 'floatDot 3.2s ease-in-out infinite 0.8s', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '28%', right: '7%', width: 16, height: 16, borderRadius: '50%', background: C.primaryBorder, animation: 'floatDot 5s ease-in-out infinite 1.6s', pointerEvents: 'none' }} />

      {/* Sparkle particles */}
      {sparkles.map(s => <Sparkle key={s.id} x={s.x} y={s.y} emoji={s.emoji} delay={s.delay} />)}

      {/* Main card */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'white',
        borderRadius: 28,
        padding: '44px 40px 40px',
        maxWidth: 480, width: '100%',
        boxShadow: '0 40px 100px rgba(200,75,17,0.15), 0 8px 32px rgba(0,0,0,0.06)',
        border: `1.5px solid ${C.primaryBorder}`,
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s, transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s',
      }}>
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c84b11, #f97316, #ea580c)', borderRadius: '28px 28px 0 0' }} />

        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ animation: 'bagBounce 2.4s cubic-bezier(0.34,1.56,0.64,1) infinite' }}>
            <AnimatedBag size={52} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 2, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
              Bag<span style={{ color: C.primary }}>Search</span>
            </h1>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textFaint }}>Nigeria's Bag Marketplace</p>
          </div>
        </div>

        {/* Under construction badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #1a0a00, #3d1408)',
          color: 'white', borderRadius: 99,
          padding: '8px 18px',
          fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: 20,
          boxShadow: '0 4px 16px rgba(26,10,0,0.3)',
          animation: 'badgePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.4s both',
        }}>
          <span style={{ fontSize: 14, animation: 'wrenchWiggle 2s ease-in-out infinite' }}>🔧</span>
          Under Development
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 900, color: C.text,
          letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 12,
          fontFamily: 'system-ui,-apple-system,sans-serif',
          animation: 'fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s both',
        }}>
          We're crafting something<br />
          <span style={{ color: C.primary }}>extraordinary for you</span> 🧡
        </h2>

        <p style={{
          fontSize: 14, color: C.textMuted, fontWeight: 500, lineHeight: 1.7,
          maxWidth: 340, margin: '0 auto 24px',
          animation: 'fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.35s both',
        }}>
          BagSearch is being actively built. Some features may be incomplete,
          experimental, or a little rough around the edges — that's part of the journey.
        </p>

        {/* Build progress */}
        <div style={{ marginBottom: 24, animation: 'fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.45s both' }}>
          <BuildProgress />
        </div>

        {/* Feature chips */}
        <div style={{ marginBottom: 24, animation: 'fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.5s both' }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>Coming features</p>
          <FeatureChips />
        </div>

        {/* Dev timer */}
        <div style={{ marginBottom: 24, animation: 'fadeSlideUp 0.5s ease 0.55s both' }}>
          <DevTimer />
        </div>

        {/* CTA button */}
        <button onClick={handleEnter}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #c84b11, #f97316)',
            color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(200,75,17,0.42)',
            letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
            animation: 'fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.6s both',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 14px 38px rgba(200,75,17,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(200,75,17,0.42)'; }}>
          <span style={{ fontSize: 16 }}>👜</span>
          Explore the Early Build
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </button>

        <p style={{ fontSize: 11, color: C.textFaint, fontWeight: 600, marginTop: 12, animation: 'fadeSlideUp 0.5s ease 0.65s both' }}>
          Tap to see the work in progress 🚧
        </p>
      </div>

      {/* Bottom tagline */}
      <p style={{ marginTop: 24, fontSize: 12, color: C.textMuted, fontWeight: 600, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.8s', zIndex: 1 }}>
        Built with 🧡 in Nigeria
      </p>
    </div>
  );
}

// ─── KEYFRAMES (inject once) ──────────────────────────────────────────────────
const STYLES = `
  @keyframes bagBounce {
    0%,100% { transform: translateY(0) rotate(-3deg); }
    30% { transform: translateY(-10px) rotate(3deg); }
    60% { transform: translateY(-5px) rotate(-1deg); }
  }
  @keyframes wrenchWiggle {
    0%,100% { transform: rotate(0deg); }
    20% { transform: rotate(-18deg); }
    40% { transform: rotate(14deg); }
    60% { transform: rotate(-10deg); }
    80% { transform: rotate(6deg); }
  }
  @keyframes livePulse {
    0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
    50% { opacity: 0.85; box-shadow: 0 0 0 5px rgba(34,197,94,0); }
  }
  @keyframes progressShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes bannerShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 300% 50%; }
  }
  @keyframes chipIn {
    from { opacity: 0; transform: translateY(10px) scale(0.85); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes badgePop {
    from { opacity: 0; transform: scale(0.7) rotate(-5deg); }
    60% { transform: scale(1.1) rotate(2deg); }
    to { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes sparkleFloat {
    0% { opacity: 0; transform: translate(0,0) scale(0.4) rotate(0deg); }
    20% { opacity: 1; }
    80% { opacity: 0.6; }
    100% { opacity: 0; transform: translate(0,-60px) scale(1) rotate(360deg); }
  }
  @keyframes floatDot {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-18px); }
  }
`;

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function UnderDevelopmentBanner({ fullscreen = false, onDismiss, onEnter }) {
  return (
    <>
      <style>{STYLES}</style>
      {fullscreen
        ? <FullscreenSplash onEnter={onEnter} />
        : <StickyBanner onDismiss={onDismiss} />
      }
    </>
  );
}