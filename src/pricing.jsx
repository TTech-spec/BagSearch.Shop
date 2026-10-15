import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import LogoIcon from './components/Logo.jsx';
import { useSEO } from './hooks/useSEO';
import { payForSubscription } from './components/FlutterwavePayment';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  primary:'#c84b11', primaryLight:'#f97316', primaryBg:'#fde8d8',
  success:'#16a34a', successBg:'#dcfce7',
  text:'#1a0a00', textMid:'#5c3317', textMuted:'#9a6348',
  border:'#f0d9cc', borderLight:'#f7ece4',
  surface:'#ffffff', surfaceDim:'#fdf8f5',
};

// ─── Plan definitions ────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Forever',
    description: 'Get started selling on BagSearch',
    badge: null,
    color: C.textMid,
    bg: '#f8f4f1',
    features: [
      { text: '1 video upload per day', included: true },
      { text: '5 product listings', included: true },
      { text: 'Seller profile page', included: true },
      { text: 'WhatsApp integration', included: true },
      { text: 'Search boost', included: false },
      { text: 'Featured badge', included: false },
      { text: 'Priority support', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1000,
    period: '/month',
    description: 'For growing sellers who want more reach',
    badge: 'POPULAR',
    color: C.primary,
    bg: '#fff7f2',
    features: [
      { text: 'Unlimited video uploads', included: true },
      { text: 'Unlimited product listings', included: true },
      { text: 'Seller profile page', included: true },
      { text: 'WhatsApp integration', included: true },
      { text: 'Search boost', included: true },
      { text: 'Featured badge', included: false },
      { text: 'Priority support', included: false },
      { text: 'Basic analytics', included: true },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 5000,
    period: '/month',
    description: 'For top sellers who want maximum visibility',
    badge: 'BEST VALUE',
    color: '#7c3aed',
    bg: '#f5f0ff',
    features: [
      { text: 'Unlimited video uploads', included: true },
      { text: 'Unlimited product listings', included: true },
      { text: 'Seller profile page', included: true },
      { text: 'WhatsApp integration', included: true },
      { text: 'Top search placement', included: true },
      { text: 'Featured seller badge ✨', included: true },
      { text: 'Priority support', included: true },
      { text: 'Full analytics dashboard', included: true },
    ],
  },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
const CheckIcon = ({ color = C.success }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a08a" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

export default function Pricing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [paying, setPaying] = useState(null);

  useSEO({
    title: 'Seller Plans & Pricing | BagSearch Nigeria',
    description: 'Choose a plan to sell bags on BagSearch. Free, Pro (₦1,000/mo), or Premium (₦5,000/mo). Unlimited uploads, search boost, and more.',
    url: '/pricing',
    type: 'website',
  });

  const handleSubscribe = (plan) => {
    if (plan.id === 'free') {
      navigate('/register');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setPaying(plan.id);

    payForSubscription({
      plan: plan.id,
      amount: plan.price,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email || '',
      userId: user.id || '',
      onSuccess: (response) => {
        setPaying(null);
        alert(`🎉 Welcome to BagSearch ${plan.name}! Your subscription is now active.\n\nTransaction ref: ${response.tx_ref}`);
        // TODO: Update user's plan in Supabase
        navigate('/seller-listing');
      },
      onClose: () => { setPaying(null); },
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fdf8f5 0%, #ffffff 40%)',
      fontFamily: "'Plus Jakarta Sans','Outfit',system-ui,-apple-system,sans-serif",
    }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', maxWidth: 1200, margin: '0 auto',
      }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoIcon size={28} />
          <span style={{ fontWeight: 900, fontSize: 18, color: C.text }}>BagSearch</span>
        </div>
        <button onClick={() => navigate(-1)} style={{
          padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`,
          background: 'white', color: C.textMid, fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>← Back</button>
      </header>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '40px 20px 20px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: 20,
          background: C.primaryBg, color: C.primary, fontWeight: 800, fontSize: 12,
          marginBottom: 16, letterSpacing: 0.5,
        }}>
          SELLER PLANS
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: C.text,
          lineHeight: 1.15, margin: '0 0 14px',
        }}>
          Grow Your Bag Business
        </h1>
        <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, margin: 0, maxWidth: 500, marginInline: 'auto' }}>
          Choose the plan that fits your business. Start free, upgrade anytime. All plans include a seller profile and WhatsApp integration.
        </p>
      </div>

      {/* ── Plans Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 960,
        margin: '30px auto 0',
        padding: '0 20px 60px',
      }}>
        {PLANS.map((plan) => {
          const isPro = plan.id === 'pro';
          const isPremium = plan.id === 'premium';
          const highlight = isPro;

          return (
            <div key={plan.id} style={{
              position: 'relative',
              background: 'white',
              borderRadius: 20,
              border: highlight ? `2.5px solid ${C.primary}` : `1.5px solid ${C.borderLight}`,
              padding: '32px 24px 28px',
              display: 'flex', flexDirection: 'column',
              boxShadow: highlight
                ? `0 8px 40px ${C.primary}22, 0 2px 8px ${C.primary}11`
                : '0 4px 20px rgba(200,75,17,0.06)',
              transform: highlight ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 0.3s',
            }}>
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  padding: '5px 16px', borderRadius: 20,
                  background: isPremium
                    ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                    : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                  color: 'white', fontWeight: 800, fontSize: 11, letterSpacing: 0.8,
                  whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <h3 style={{ fontSize: 22, fontWeight: 900, color: plan.color, margin: '0 0 6px' }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: 13, color: C.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
                {plan.description}
              </p>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: plan.price === 0 ? 36 : 32, fontWeight: 900, color: C.text }}>
                  {plan.price === 0 ? 'Free' : `₦${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{plan.period}</span>
                )}
              </div>

              {/* Features */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {f.included ? <CheckIcon color={isPremium ? '#7c3aed' : C.success} /> : <XIcon />}
                    <span style={{
                      fontSize: 13.5, fontWeight: f.included ? 600 : 400,
                      color: f.included ? C.text : '#c4a090',
                    }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={paying === plan.id}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12,
                  border: plan.price === 0 ? `2px solid ${C.border}` : 'none',
                  background: plan.price === 0
                    ? 'white'
                    : isPremium
                      ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                      : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                  color: plan.price === 0 ? C.textMid : 'white',
                  fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  boxShadow: plan.price > 0
                    ? `0 6px 20px ${isPremium ? '#7c3aed' : C.primary}33`
                    : 'none',
                  transition: 'all 0.25s',
                  opacity: paying === plan.id ? 0.6 : 1,
                }}>
                {paying === plan.id
                  ? 'Processing...'
                  : plan.price === 0
                    ? 'Get Started Free'
                    : `Subscribe — ₦${plan.price.toLocaleString()}/mo`}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── FAQ Section ── */}
      <div style={{
        maxWidth: 700, margin: '0 auto', padding: '0 20px 60px',
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, textAlign: 'center', marginBottom: 24 }}>
          Frequently Asked Questions
        </h2>
        {[
          { q: 'Can I upgrade or downgrade anytime?', a: 'Yes! You can change your plan at any time. When you upgrade, you get instant access to new features. When you downgrade, your current plan stays active until the end of the billing period.' },
          { q: 'What payment methods do you accept?', a: 'We accept all major payment methods via Flutterwave — debit/credit cards, bank transfers, USSD, and mobile money. All payments are in Nigerian Naira (₦).' },
          { q: 'Is the Free plan really free?', a: 'Yes! The Free plan is 100% free forever. You can list up to 5 products and upload 1 video per day. No credit card required.' },
          { q: 'What does "Search Boost" mean?', a: 'Search Boost makes your products appear higher in search results, so more buyers see your listings. Premium sellers get top placement — appearing first on the main page and in search.' },
        ].map((faq, i) => (
          <details key={i} style={{
            background: 'white', borderRadius: 14, border: `1.5px solid ${C.borderLight}`,
            padding: '16px 20px', marginBottom: 10,
          }}>
            <summary style={{ fontWeight: 700, fontSize: 14, color: C.text, cursor: 'pointer', listStyle: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {faq.q}
                <span style={{ fontSize: 18, color: C.textMuted, flexShrink: 0, marginLeft: 12 }}>+</span>
              </span>
            </summary>
            <p style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.7, margin: '12px 0 0' }}>
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      {/* ── Footer note ── */}
      <div style={{
        textAlign: 'center', padding: '20px 20px 40px',
        fontSize: 12, color: C.textMuted,
      }}>
        <p style={{ margin: 0 }}>
          Payments are processed securely by{' '}
          <a href="https://flutterwave.com" target="_blank" rel="noopener noreferrer"
            style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
            Flutterwave
          </a>
          . Cancel your subscription anytime.
        </p>
        <p style={{ margin: '8px 0 0' }}>© {new Date().getFullYear()} BagSearch Nigeria. All rights reserved.</p>
      </div>
    </div>
  );
}
