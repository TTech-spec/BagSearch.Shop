import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, UserPlus } from 'lucide-react';
import { useSEO } from './hooks/useSEO';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import { markOnboardingSeen } from './utils/onboardingState';
import LogoIcon from './components/Logo.jsx';
import OnboardingDots from './components/OnboardingDots.jsx';

import slide1Img from './assets/images/onboarding/From Klickpin.com- Save this easy pilates flow roundup that make everything look instantly polished with practical inspiration you can use right a.jpg';
import slide2Video from './assets/images/onboarding/From Klickpin.com- Bookmark these 33 Refined natural skincare routine ideas that feel fresh elevated and surprisingly easy to recreate at home for.mp4';
import slide3Img from './assets/images/onboarding/From Klickpin.com- 90 Impressive Digital Product Ideas-pin-id-1152217885962599326-story-1.jpg';

// Brand accent — rhymes with the terracotta/orange used everywhere else on
// BagSearch (login, register, products), instead of a mismatched violet.
const ACCENT = '#f97316';

const SLIDES = [
  {
    id: 'find',
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

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0.5 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0.5 }),
};

// Staggered reveal for the text/controls stack — each child fades and lifts
// in slightly after the previous one, replaying every time the slide (and
// therefore its `key`) changes.
const contentStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const contentItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

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
  useSEO({
    title: 'Welcome | BagSearch',
    description:
      'Find any bag by photo, or reach buyers and sellers across Africa. Get started with BagSearch.',
    noindex: true,
  });

  const navigate = useNavigate();
  const isMobile = useIsMobileViewport();
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

  return (
    <div
      className="relative w-screen overflow-hidden bg-black select-none"
      style={{ height: '100dvh' }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.65}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
        >
          {slide.mediaType === 'video' ? (
            <video
              src={slide.media}
              autoPlay
              muted
              loop
              playsInline
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img
              src={slide.media}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Scrim: transparent at ~50% height, fading to ~90% black at the bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 20%, rgba(0,0,0,0.32) 42%, rgba(0,0,0,0) 55%)',
            }}
          />

          <motion.div
            variants={contentStagger}
            initial="hidden"
            animate="visible"
            className="absolute inset-x-0 bottom-0 flex flex-col gap-6 px-6 pt-10"
            style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}
          >
            <div>
              <motion.h1
                variants={contentItem}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(26px, 7.2vw, 30px)',
                  lineHeight: 1.15,
                  fontWeight: 800,
                }}
                className="text-white tracking-tight"
              >
                {slide.headline}
              </motion.h1>
              {slide.subtext && (
                <motion.p
                  variants={contentItem}
                  className="mt-3 max-w-[320px] text-[14.5px] leading-[1.4] text-white/80"
                >
                  {slide.subtext}
                </motion.p>
              )}
            </div>

            <motion.div variants={contentItem} className="flex items-center justify-center">
              <OnboardingDots count={total} activeIndex={index} accent={ACCENT} />
            </motion.div>

            {!isLast ? (
              <motion.div variants={contentItem} className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="-ml-1 rounded py-3 pr-4 text-[15px] font-medium text-white/70 transition-opacity active:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next slide"
                  style={{ backgroundColor: ACCENT }}
                  className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/40 transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ArrowRight className="h-6 w-6 text-white" strokeWidth={2.5} />
                </button>
              </motion.div>
            ) : (
              <motion.div variants={contentItem} className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleShopNow}
                  style={{ backgroundColor: ACCENT }}
                  className="flex h-16 w-full items-center justify-center gap-2.5 rounded-full shadow-xl shadow-black/50 transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ShoppingBag className="h-5 w-5 text-white" strokeWidth={2.5} />
                  <span className="text-[16px] font-bold text-white">Shop Now</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <UserPlus className="h-4 w-4 text-white" strokeWidth={2.5} />
                  <span className="text-[15px] font-semibold text-white">Sign Up</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
