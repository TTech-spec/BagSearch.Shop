import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion as Motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useSEO } from './hooks/useSEO';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import { hasSeenOnboarding, markOnboardingSeen } from './utils/onboardingState';
import LogoIcon from './components/Logo.jsx';

import slide1Img from './assets/images/onboarding/From Klickpin.com- Save this easy pilates flow roundup that make everything look instantly polished with practical inspiration you can use right a.webp';
import slide2Video from './assets/images/onboarding/From Klickpin.com- Bookmark these 33 Refined natural skincare routine ideas that feel fresh elevated and surprisingly easy to recreate at home for.mp4';
import slide3Img from './assets/images/onboarding/From Klickpin.com- 90 Impressive Digital Product Ideas-pin-id-1152217885962599326-story-1.webp';

// Brand tokens (same warm cream + burnt orange as the rest of the app).
const ACCENT = '#B4410E';
const V = { bg: '#FAF6F1', ink: '#1C1410', ink2: '#54443A', line: '#D9CBBB', accentSoft: '#F6E6DA' };
const FONT = "'Manrope',system-ui,-apple-system,sans-serif";
const EASE = [0.22, 1, 0.36, 1];

const SLIDES = [
  {
    id: 'find',
    tag: 'Visual search',
    alt: 'A woman thinking, holding her phone',
    focus: '50% 20%',
    media: slide1Img,
    mediaType: 'image',
    headline: (
      <>
        No Name? No Problem.
        <br />
        <span style={{ fontWeight: 400, opacity: 0.85 }}>Upload &amp; </span>
        Find It.
      </>
    ),
    subtext:
      'No need to know the brand or model. Just snap a picture and let BagSearch do the rest.',
  },
  {
    id: 'connect',
    tag: 'Across Africa',
    alt: 'A map with a location pin',
    focus: '50% 40%',
    media: slide2Video,
    mediaType: 'video',
    headline: (
      <>
        Sellers{' '}
        <span style={{ fontWeight: 400, opacity: 0.85 }}>Near You,</span>
        <br />
        Anywhere in Africa
      </>
    ),
    subtext:
      'BagSearch connects buyers and sellers across Africa, so your next bag is always within reach.',
  },
  {
    id: 'start',
    tag: 'Get started',
    alt: 'A happy shopper holding shopping bags',
    focus: '50% 15%',
    media: slide3Img,
    mediaType: 'image',
    headline: (
      <>
        Join as a <span style={{ color: ACCENT }}>buyer</span> to find your
        next bag, or a <span style={{ color: ACCENT }}>seller</span> to start
        earning from yours.
      </>
    ),
    subtext: null,
  },
];

// Text + buttons in the sheet: each child fades and lifts in after the previous
// one, replaying whenever the slide changes.
const contentStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const contentItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// The signature button: an orange pill with a white circle on the right. The
// icon nudges and the circle pulses a soft ring so it invites a tap.
function CtaButton({ label, onClick, icon, ariaLabel }) {
  const Icon = icon;
  return (
    <Motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.97 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 64, padding: '0 6px 0 26px', border: 0, borderRadius: 999, background: ACCENT, color: '#fff', font: `800 16px ${FONT}`, cursor: 'pointer', boxShadow: '0 12px 26px rgba(180,65,14,.3)' }}
    >
      {label}
      <Motion.span
        animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,.55)', '0 0 0 12px rgba(255,255,255,0)'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 999, background: '#fff', color: ACCENT }}
      >
        <Motion.span animate={{ x: [0, 5, 0, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.6, 1] }} style={{ display: 'flex' }}>
          <Icon size={22} strokeWidth={2.4} aria-hidden="true" />
        </Motion.span>
      </Motion.span>
    </Motion.button>
  );
}

function DesktopFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#fff8f4 0%,#fdf4ee 55%,#ffffff 100%)',
        fontFamily: 'var(--font-display)',
      }}
      className="flex flex-col items-center justify-center px-6 text-center"
    >
      <LogoIcon size={44} />
      <h1 className="mt-6 text-xl font-extrabold tracking-tight text-[#1a0a00]">
        This experience is available on mobile devices only.
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#9a6348]">
        Open bagsearch.shop on your phone to view the BagSearch welcome tour,
        or continue browsing on desktop below.
      </p>
      <a
        href="/products"
        className="mt-7 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
        style={{ backgroundColor: '#C94B2C' }}
      >
        Browse BagSearch on Desktop
      </a>
    </div>
  );
}

export default function Onboarding({ onDone } = {}) {
  // When rendered as an overlay (onDone is set), skip useSEO entirely so
  // Product's index/follow meta stays active. This prevents Googlebot
  // Smartphone (fresh visitor, no localStorage) from seeing noindex on "/".
  useSEO({
    title: 'Welcome | BagSearch',
    description:
      'Find any bag by photo, or reach buyers and sellers across Africa. Get started with BagSearch.',
    noindex: true,
    skip: !!onDone,
  });

  const navigate = useNavigate();
  const isMobile = useIsMobileViewport();
  // Shown once only. Remember whether it had already been seen BEFORE this
  // visit, then mark it seen straight away — so closing the app half-way
  // through still counts, and it never comes back.
  const [seenBefore] = useState(hasSeenOnboarding);
  useEffect(() => { markOnboardingSeen(); }, []);
  useEffect(() => {
    // Opened directly at /onboarding after it was already seen: go to the shop.
    if (!onDone && seenBefore) navigate('/products', { replace: true });
  }, [onDone, seenBefore, navigate]);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const total = SLIDES.length;
  const isLast = index === total - 1;
  const slide = SLIDES[index];

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i;
      setDirection(1);
      return i + 1;
    });
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return i;
      setDirection(-1);
      return i - 1;
    });
  }, []);

  const handleSkip = useCallback(() => {
    markOnboardingSeen();
    if (onDone) { onDone(); } else { navigate('/register'); }
  }, [navigate, onDone]);

  const handleSignUp = useCallback(() => {
    markOnboardingSeen();
    if (onDone) { onDone(); navigate('/register'); } else { navigate('/register'); }
  }, [navigate, onDone]);

  const handleShopNow = useCallback(() => {
    markOnboardingSeen();
    // Flag consumed once by Product.jsx to show the visual-search prompt modal.
    if (onDone) { onDone(); } else { navigate('/products', { state: { promptUpload: true } }); }
  }, [navigate, onDone]);

  // Keyboard support for the swipe gesture (arrow keys, Enter on the final slide).
  useEffect(() => {
    if (!isMobile) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Enter' && isLast) handleShopNow();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobile, isLast, goNext, goPrev, handleShopNow]);

  if (!onDone && seenBefore) return null;

  if (!isMobile) {
    return <DesktopFallback />;
  }

  const handleDragEnd = (_event, info) => {
    const SWIPE_DISTANCE = 60;
    const SWIPE_VELOCITY = 450;
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      goNext();
    } else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) {
      goPrev();
    }
  };

  const mediaStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slide.focus };
  const pill = { background: 'rgba(255,255,255,.92)', borderRadius: 999, color: V.ink, fontFamily: FONT };

  return (
    <MotionConfig reducedMotion="user">
      <Motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#EFE6DC', fontFamily: FONT, color: V.ink, userSelect: 'none', touchAction: 'pan-y' }}
      >
        {/* Photo / video: fills the top, slides and settles in on each change */}
        <AnimatePresence initial={false} custom={direction}>
          <Motion.div
            key={slide.id}
            custom={direction}
            variants={{
              enter: (d) => ({ x: d > 0 ? '40%' : '-40%', opacity: 0, scale: 1.1 }),
              center: { x: 0, opacity: 1, scale: 1 },
              exit: (d) => ({ x: d > 0 ? '-25%' : '25%', opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: EASE }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '66dvh' }}
          >
            {slide.mediaType === 'video' ? (
              <video src={slide.media} autoPlay muted loop playsInline draggable={false} aria-label={slide.alt} style={mediaStyle} />
            ) : (
              <img src={slide.media} alt={slide.alt} draggable={false} style={mediaStyle} />
            )}
          </Motion.div>
        </AnimatePresence>

        {/* Progress bars + brand + skip */}
        <div style={{ position: 'absolute', top: 'max(14px, env(safe-area-inset-top))', left: 16, right: 16, zIndex: 2 }}>
          <div aria-hidden="true" style={{ display: 'flex', gap: 6 }}>
            {SLIDES.map((sl, n) => (
              <span key={sl.id} style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(28,20,16,.28)', overflow: 'hidden' }}>
                <Motion.span initial={false} animate={{ scaleX: n <= index ? 1 : 0 }} transition={{ duration: 0.45, ease: EASE }} style={{ display: 'block', height: '100%', background: '#fff', transformOrigin: 'left center' }} />
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ ...pill, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 6px 8px', fontSize: 16, fontWeight: 800, letterSpacing: '-.03em' }}>
              <LogoIcon size={22} />
              <span>Bag<span style={{ color: ACCENT }}>Search</span></span>
            </span>
            {!isLast && (
              <button type="button" onClick={handleSkip} style={{ ...pill, minHeight: 44, padding: '0 16px', border: 0, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Skip
              </button>
            )}
          </div>
        </div>

        {/* Cream sheet with the words and the button */}
        <Motion.div
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 3, boxSizing: 'border-box', minHeight: '42dvh', padding: '28px 24px max(26px, env(safe-area-inset-bottom))', borderRadius: '32px 32px 0 0', background: V.bg, boxShadow: '0 -14px 40px rgba(28,20,16,.14)', display: 'flex', flexDirection: 'column' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <Motion.div key={slide.id} variants={contentStagger} initial="hidden" animate="visible" exit="exit" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Motion.span variants={contentItem} style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: 999, background: V.accentSoft, color: ACCENT }}>
                {slide.tag}
              </Motion.span>
              <Motion.h1 variants={contentItem} style={{ margin: '14px 0 10px', fontSize: isLast ? 'clamp(21px, 5.9vw, 24px)' : 'clamp(25px, 7.2vw, 29px)', lineHeight: 1.16, fontWeight: 800, letterSpacing: '-.03em' }}>
                {slide.headline}
              </Motion.h1>
              {slide.subtext && (
                <Motion.p variants={contentItem} style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: V.ink2 }}>
                  {slide.subtext}
                </Motion.p>
              )}

              <Motion.div variants={contentItem} style={{ marginTop: 'auto', paddingTop: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {!isLast ? (
                  <CtaButton label="Continue" ariaLabel="Next slide" onClick={goNext} icon={ArrowRight} />
                ) : (
                  <>
                    <CtaButton label="Shop Now" onClick={handleShopNow} icon={ShoppingBag} />
                    <button type="button" onClick={handleSignUp} style={{ minHeight: 48, border: 0, background: 'transparent', font: `700 15px ${FONT}`, color: V.ink, cursor: 'pointer' }}>
                      New here?{' '}
                      <span style={{ color: ACCENT, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }}>Sign Up</span>
                    </button>
                  </>
                )}
              </Motion.div>
            </Motion.div>
          </AnimatePresence>
        </Motion.div>
      </Motion.div>
    </MotionConfig>
  );
}
