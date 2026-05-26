import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import LogoIcon from './components/Logo.jsx';
import { buildWhatsAppUrl } from './utils/whatsapp';

// ─── COLOR TOKENS (matches your existing C object) ───────────────────────────
const C = {
  primary:       '#c84b11',
  primaryLight:  '#f97316',
  primaryBg:     '#fde8d8',
  primaryPale:   '#fdf4ee',
  primaryBorder: '#f9c4a0',
  accent:        '#ea580c',
  success:       '#16a34a',
  successBg:     '#dcfce7',
  successDark:   '#15803d',
  surface:       '#ffffff',
  surfaceDim:    '#fdf8f5',
  border:        '#f0d9cc',
  borderLight:   '#f7ece4',
  text:          '#1a0a00',
  textMid:       '#5c3317',
  textMuted:     '#9a6348',
  textFaint:     '#c4957a',
  whatsapp:      '#25d366',
  whatsappDark:  '#128c7e',
  whatsappBg:    '#dcfce7',
};

const WHATSAPP_SUPPORT = '2348138734530';

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
const Icons = {
  Check: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Bolt: ({ size = 22, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Star: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  ),
  Crown: ({ size = 22, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20M5 20V10l7-7 7 7v10" />
    </svg>
  ),
  Flame: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
    </svg>
  ),
  Discount: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  MessageCircle: ({ size = 22, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
  TrendingUp: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Users: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  Search: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Rocket: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  ArrowLeft: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Sparkles: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L14 8L19 10L14 12L12 17L10 12L5 10L10 8L12 3Z" />
      <path d="M19 4L20 7L23 8L20 9L19 12L18 9L15 8L18 7L19 4Z" />
    </svg>
  ),
};

const WaIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── SCROLL REVEAL HOOK ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function AnimatedCount({ value, prefix = '', suffix = '' }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let s = 0;
        const timer = setInterval(() => {
          s += Math.ceil(value / 55);
          if (s >= value) { setN(value); clearInterval(timer); } else setN(s);
        }, 20);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

// ─── PLANS DATA ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'flash',
    name: 'Flash Boost',
    tagline: 'Quick visibility push',
    price: 1000,
    duration: '2 days',
    durationShort: '48 hrs',
    iconBg: '#fff7ed',
    iconColor: C.accent,
    Icon: Icons.Bolt,
    accentColor: C.primary,
    accentBg: C.primaryBg,
    accentBorder: C.primaryBorder,
    ctaStyle: 'outline',
    popular: false,
    highlight: null,
    features: [
      { text: 'Top of search results for 48 hours', included: true },
      { text: 'Pop-out badge on your listing', included: true },
      { text: 'Priority WhatsApp button placement', included: true },
      { text: 'Homepage feature slot', included: false },
      { text: 'Hot Deals section placement', included: false },
      { text: 'Dedicated seller badge', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Boost',
    tagline: 'Full month of dominance',
    price: 4000,
    duration: '1 month',
    durationShort: '30 days',
    iconBg: C.primaryBg,
    iconColor: C.primary,
    Icon: Icons.Star,
    accentColor: C.primary,
    accentBg: C.primaryBg,
    accentBorder: C.primaryBorder,
    ctaStyle: 'primary',
    popular: true,
    highlight: { icon: Icons.Flame, text: 'Pop-out card when buyers search your keywords', bg: C.primaryBg, color: '#9a3412' },
    features: [
      { text: 'Everything in Flash Boost', included: true },
      { text: 'Pop-out card on search results', included: true },
      { text: 'Featured in category browse pages', included: true },
      { text: 'Weekly performance summary', included: true },
      { text: 'Homepage feature slot', included: false },
      { text: 'Dedicated seller badge', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite Boost',
    tagline: 'Maximum visibility',
    price: 5000,
    duration: '2 months',
    durationShort: '60 days',
    iconBg: '#f0fdf4',
    iconColor: C.successDark,
    Icon: Icons.Crown,
    accentColor: C.successDark,
    accentBg: '#dcfce7',
    accentBorder: '#a7f3d0',
    ctaStyle: 'outline-green',
    popular: false,
    highlight: { icon: Icons.Discount, text: 'Save ₦3,000 vs buying 2× Pro plans', bg: '#dcfce7', color: '#14532d' },
    features: [
      { text: 'Everything in Pro Boost', included: true },
      { text: 'Homepage hero banner placement', included: true },
      { text: 'Pinned in Hot Deals section', included: true },
      { text: 'Dedicated seller badge on profile', included: true },
      { text: 'Priority support via WhatsApp', included: true },
      { text: 'Bi-weekly performance report', included: true },
    ],
  },
];

const HOW_STEPS = [
  { num: '1', title: 'Pick a plan', desc: 'Choose how long you want your product at the top of search results.' },
  { num: '2', title: 'Pay via WhatsApp', desc: 'Chat our team to confirm payment — your boost activates within minutes.' },
  { num: '3', title: 'Watch sales grow', desc: 'Your listing appears first. Buyers see you, not your competitors.' },
];

const STATS = [
  { icon: Icons.Users, label: '10,000+ active buyers' },
  { icon: Icons.Search, label: '50k monthly searches' },
  { icon: Icons.TrendingUp, label: 'Avg. 3× more views when boosted' },
];

// ─── PLAN CARD ────────────────────────────────────────────────────────────────
function PlanCard({ plan, index, isMobile }) {
  const [hov, setHov] = useState(false);
  const [ref, vis] = useScrollReveal(0.05);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleCTA = () => {
    const msg = `Hi BagSearch! I'd like to activate the *${plan.name}* for ₦${plan.price.toLocaleString()} (${plan.duration}). Please help me get started. 🚀`;
    const waUrl = `https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const cardBorder = plan.popular
    ? `2px solid ${C.primary}`
    : `1.5px solid ${hov ? plan.accentBorder : C.borderLight}`;

  const cardShadow = hov
    ? `0 24px 60px rgba(200,75,17,0.13), 0 4px 16px rgba(0,0,0,0.05)`
    : plan.popular
      ? `0 8px 32px rgba(200,75,17,0.12)`
      : '0 2px 10px rgba(0,0,0,0.04)';

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white',
        borderRadius: 22,
        border: cardBorder,
        padding: isMobile ? '24px 18px' : '32px 26px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        opacity: vis ? 1 : 0,
        transform: vis
          ? hov ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)'
          : `translateY(28px) scale(0.97)`,
        transition: `opacity .55s cubic-bezier(.22,1,.36,1) ${index * 120}ms,
                     transform .55s cubic-bezier(.22,1,.36,1) ${index * 120}ms,
                     box-shadow .3s, border-color .3s`,
        boxShadow: cardShadow,
        animation: plan.popular ? 'boostGlow 3.5s ease-in-out infinite' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
          color: 'white', fontSize: 10, fontWeight: 800, padding: '5px 20px',
          borderRadius: '0 0 14px 14px', letterSpacing: '0.12em', textTransform: 'uppercase',
          boxShadow: `0 4px 16px rgba(200,75,17,0.4)`, animation: 'badgePop .5s cubic-bezier(.34,1.56,.64,1) .6s both',
          whiteSpace: 'nowrap',
        }}>
          ⭐ Most Popular
        </div>
      )}

      {/* Shimmer top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg,${plan.accentColor},${C.primaryLight},${plan.accentColor})`,
        backgroundSize: '200% 100%',
        animation: 'shimBar 2.5s linear infinite',
      }} />

      <div style={{ marginTop: plan.popular ? 18 : 4 }}>
        {/* Icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: plan.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 14px ${plan.accentColor}22`,
            transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
            transform: hov ? 'scale(1.12) rotate(-6deg)' : 'scale(1)',
          }}>
            <plan.Icon size={24} color={plan.iconColor} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', marginBottom: 2 }}>{plan.name}</p>
            <p style={{ fontSize: 12, color: C.textFaint, fontWeight: 500 }}>{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: plan.accentColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
              ₦{plan.price.toLocaleString()}
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>
            for <span style={{ color: C.text, fontWeight: 800 }}>{plan.duration}</span>
            <span style={{ marginLeft: 8, fontSize: 11, background: plan.accentBg, color: plan.accentColor, border: `1px solid ${plan.accentBorder}`, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              {plan.durationShort}
            </span>
          </p>
        </div>

        {/* Highlight callout */}
        {plan.highlight && (
          <div style={{
            background: plan.highlight.bg, borderRadius: 12,
            padding: '10px 14px', marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
            border: `1px solid ${plan.accentBorder}`,
            animation: 'fadeSlideIn .5s cubic-bezier(.22,1,.36,1) .4s both',
          }}>
            <plan.highlight.icon size={16} color={plan.accentColor} />
            <span style={{ fontSize: 12, color: plan.highlight.color, fontWeight: 700, lineHeight: 1.5 }}>{plan.highlight.text}</span>
          </div>
        )}

        {/* Features */}
        <div style={{ marginBottom: 24, flex: 1 }}>
          {plan.features.map((feat, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 0',
              borderBottom: i < plan.features.length - 1 ? `1px solid ${C.borderLight}` : 'none',
            }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                {feat.included
                  ? <Icons.Check size={15} color={C.success} />
                  : <Icons.X size={15} color={C.textFaint} />
                }
              </div>
              <span style={{ fontSize: 13, color: feat.included ? C.textMid : C.textFaint, fontWeight: feat.included ? 600 : 500, lineHeight: 1.5 }}>
                {feat.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleCTA}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 13, border: 'none',
          cursor: 'pointer', fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em',
          transition: 'all .3s cubic-bezier(.34,1.2,.64,1)',
          transform: hov ? 'translateY(-2px)' : 'none',
          ...(plan.ctaStyle === 'primary' ? {
            background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
            color: 'white',
            boxShadow: hov ? `0 10px 28px rgba(200,75,17,0.45)` : `0 6px 20px rgba(200,75,17,0.3)`,
          } : plan.ctaStyle === 'outline-green' ? {
            background: hov ? '#dcfce7' : 'white',
            color: C.successDark,
            border: `1.5px solid ${C.successDark}`,
            boxShadow: hov ? `0 8px 22px rgba(21,128,61,0.2)` : 'none',
          } : {
            background: hov ? C.primaryBg : 'white',
            color: C.primary,
            border: `1.5px solid ${C.primaryBorder}`,
            boxShadow: hov ? `0 8px 22px rgba(200,75,17,0.15)` : 'none',
          }),
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => {
          if (plan.ctaStyle === 'primary') e.currentTarget.style.opacity = '.9';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <WaIcon size={16} color={plan.ctaStyle === 'primary' ? 'white' : plan.ctaStyle === 'outline-green' ? C.successDark : C.primary} />
        {plan.ctaStyle === 'primary' ? 'Boost My Product →' : 'Get Started →'}
      </button>
    </div>
  );
}

// ─── HOW IT WORKS STEP ────────────────────────────────────────────────────────
function HowStep({ step, index }) {
  const [ref, vis] = useScrollReveal(0.08);
  return (
    <div ref={ref} style={{
      background: 'white', borderRadius: 18,
      padding: '22px 20px', border: `1.5px solid ${C.borderLight}`,
      display: 'flex', alignItems: 'flex-start', gap: 16,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity .5s ease ${index * 100 + 300}ms, transform .5s cubic-bezier(.22,1,.36,1) ${index * 100 + 300}ms`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: 'white', fontSize: 17, fontWeight: 900,
        boxShadow: `0 6px 16px rgba(200,75,17,0.35)`,
      }}>
        {step.num}
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{step.title}</p>
        <p style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, lineHeight: 1.65 }}>{step.desc}</p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function BoostPlans() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [heroVisible, setHeroVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80);
    setTimeout(() => setStatsVisible(true), 280);
  }, []);

  const handleWhatsAppSupport = () => {
    const msg = 'Hi BagSearch! I have a question about your boost plans. Can you help me?';
    window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const fmtCurrency = (v) => `₦${Number(v).toLocaleString()}`;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg,${C.primaryPale} 0%,#fdf8f5 20%,white 55%)`,
      fontFamily: "'Manrope', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes shimBar{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes boostGlow{0%,100%{box-shadow:0 8px 32px rgba(200,75,17,0.12)}50%{box-shadow:0 12px 44px rgba(200,75,17,0.22)}}
        @keyframes badgePop{0%{transform:translateX(-50%) scale(.7)}60%{transform:translateX(-50%) scale(1.1)}100%{transform:translateX(-50%) scale(1)}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes heroFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes statIn{from{opacity:0;transform:translateY(12px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.6);opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .boost-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;}
        .how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;}
        @media(max-width:640px){.boost-grid{grid-template-columns:1fr!important;}.how-grid{grid-template-columns:1fr!important;}}
      `}</style>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '24px 14px 80px' : '48px 24px 100px' }}>

        {/* Back button */}
        <button onClick={() => navigate('/products')} style={{
          display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none',
          color: C.primary, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          padding: '8px 0', marginBottom: 28, fontFamily: 'inherit',
          transition: 'gap .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.gap = '10px'}
          onMouseLeave={e => e.currentTarget.style.gap = '7px'}
        >
          <Icons.ArrowLeft size={18} color={C.primary} />
          Back to products
        </button>

        {/* ── HERO ── */}
        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1)',
          marginBottom: isMobile ? 28 : 40,
        }}>
          {/* Label pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: C.primaryBg, border: `1px solid ${C.primaryBorder}`,
            borderRadius: 20, padding: '6px 14px', marginBottom: 18,
          }}>
            <Icons.Rocket size={15} color={C.primary} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: C.primary }}>
              Boost Plans
            </span>
          </div>

          <h1 style={{
            fontSize: isMobile ? 'clamp(1.7rem,7vw,2.2rem)' : 'clamp(2rem,4vw,3rem)',
            fontWeight: 900, color: C.text, letterSpacing: '-0.04em', lineHeight: 1.15,
            marginBottom: 14,
          }}>
            Get your product seen{' '}
            <span style={{ color: C.primary, display: 'inline-block', position: 'relative' }}>
              first
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
                background: `linear-gradient(90deg,${C.primary},${C.primaryLight})`,
                borderRadius: 2, animation: 'shimBar 2.5s linear infinite',
                backgroundSize: '200% 100%',
              }} />
            </span>
          </h1>

          <p style={{
            fontSize: isMobile ? 14 : 16, color: C.textMuted, fontWeight: 500,
            lineHeight: 1.7, maxWidth: 540, marginBottom: 28,
          }}>
            Boosted products appear at the very top of search results — before everyone else.
            More eyes on your bag means more WhatsApp messages and more sales.
          </p>

          {/* Stats pills */}
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap',
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity .5s ease .2s, transform .5s ease .2s',
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'white', border: `1.5px solid ${C.border}`,
                borderRadius: 20, padding: '8px 14px',
                fontSize: 12, color: C.textMid, fontWeight: 600,
                animation: `statIn .45s cubic-bezier(.22,1,.36,1) ${i * 100 + 300}ms both`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <s.icon size={15} color={C.primary} />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── DECORATIVE VISUAL DEMO ── */}
        <div style={{
          marginBottom: isMobile ? 32 : 48,
          background: C.primaryBg, borderRadius: 20,
          border: `1.5px solid ${C.primaryBorder}`,
          padding: isMobile ? '18px 14px' : '22px 28px',
          display: 'flex', alignItems: 'center', gap: 16,
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Animated "Boosted" product mockup */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: isMobile ? 54 : 70, height: isMobile ? 54 : 70,
              borderRadius: 14, background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'float 3s ease-in-out infinite',
              boxShadow: `0 8px 24px rgba(200,75,17,0.4)`,
            }}>
              <Icons.Sparkles size={isMobile ? 24 : 30} color="white" />
            </div>
            {/* Pulse rings */}
            {[0, 1].map(i => (
              <div key={i} style={{
                position: 'absolute', inset: -8 - i * 8, borderRadius: '50%',
                border: `2px solid ${C.primaryLight}`,
                animation: `pulseRing 2s ease-out ${i * 0.5}s infinite`,
                pointerEvents: 'none',
              }} />
            ))}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                color: 'white', fontSize: 9, fontWeight: 900, padding: '3px 10px',
                borderRadius: 20, letterSpacing: '0.1em', textTransform: 'uppercase',
                boxShadow: `0 2px 8px rgba(200,75,17,0.4)`,
              }}>🚀 Boosted · Appears 1st</span>
            </div>
            <p style={{ fontSize: isMobile ? 13 : 15, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: '-0.02em' }}>
              Your product shows here — above everyone else
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, lineHeight: 1.6 }}>
              While non-boosted sellers compete below, your listing is what buyers see first every single time they search.
            </p>
          </div>
        </div>

        {/* ── PLAN CARDS ── */}
        <div style={{ marginBottom: isMobile ? 40 : 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 20, height: 3, background: `linear-gradient(90deg,${C.primary},${C.primaryLight})`, borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint }}>
              Choose Your Plan
            </span>
          </div>
          <div className="boost-grid">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} isMobile={isMobile} />
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div style={{ marginBottom: isMobile ? 36 : 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 20, height: 3, background: `linear-gradient(90deg,${C.primary},${C.primaryLight})`, borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint }}>
              How it works
            </span>
          </div>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Boosting is simple
          </h2>
          <div className="how-grid">
            {HOW_STEPS.map((step, i) => (
              <HowStep key={i} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* ── FAQ / NOTES ── */}
        <div style={{
          background: 'white', borderRadius: 20,
          border: `1.5px solid ${C.borderLight}`,
          padding: isMobile ? '22px 18px' : '30px 32px',
          marginBottom: isMobile ? 28 : 40,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Good to know
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {[
              { q: 'Can I boost multiple products?', a: 'Yes! Each plan applies to one product. Contact us to bundle multiple products at a discount.' },
              { q: 'What if I want to cancel early?', a: 'We don\'t offer refunds mid-plan, but your boost will run its full duration — so pick wisely!' },
              { q: 'How quickly does it activate?', a: 'Once payment is confirmed via WhatsApp, your product is boosted within minutes.' },
              { q: 'Will buyers know it\'s boosted?', a: 'Your product gets a "Boosted" badge that builds trust and signals quality to buyers.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: C.surfaceDim, borderRadius: 14,
                padding: '16px 18px', border: `1px solid ${C.borderLight}`,
              }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 6, lineHeight: 1.4 }}>{item.q}</p>
                <p style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 500, lineHeight: 1.65 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHATSAPP SUPPORT BAR ── */}
        <div style={{
          background: `linear-gradient(135deg,#1a0a00,#4a1a06)`,
          borderRadius: 22, padding: isMobile ? '24px 20px' : '28px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap', position: 'relative', overflow: 'hidden',
        }}>
          {/* Dot pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'radial-gradient(circle at 20% 50%,white 1px,transparent 1px)',
            backgroundSize: '24px 24px', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(37,211,102,0.18)', border: '1.5px solid rgba(37,211,102,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WaIcon size={26} color="#4ade80" />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Questions? Chat us on WhatsApp
              </p>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                Mon – Sat · 8AM – 8PM · We usually reply in minutes
              </p>
            </div>
          </div>
          <button onClick={handleWhatsAppSupport} style={{
            position: 'relative', display: 'flex', alignItems: 'center', gap: 9,
            padding: isMobile ? '12px 20px' : '14px 26px',
            background: '#25d366', color: 'white', border: 'none',
            borderRadius: 14, fontWeight: 900, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
            transition: 'all .25s',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(37,211,102,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.4)'; }}
          >
            <WaIcon size={18} color="white" />
            Chat Support Now
          </button>
        </div>

      </div>
    </div>
  );
}