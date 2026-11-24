import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import gsap from 'gsap';
import { useSEO } from './hooks/useSEO';

// Placeholder for /reels while video reels are rebuilt.
// GSAP runs the looping ambient motion; Framer Motion handles entrance + taps.
const ink = '#1C1410', muted = '#75625A', accent = '#B4410E', line = '#E7DCD1';

export default function ReelsComingSoon() {
  const navigate = useNavigate();
  const stage = useRef(null);

  useSEO({ title: 'Reels — Coming soon | BagSearch', description: 'Short bag videos from sellers are coming soon to BagSearch.', noindex: true });

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.to('.rc-card', {
        y: (i) => [-10, 8, -6][i], rotate: (i) => [-8, 0, 8][i] * 1.15,
        duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.35,
      });
      gsap.fromTo('.rc-play', { scale: 0.9, opacity: 0.6 }, { scale: 1.08, opacity: 1, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.rc-bar', { scaleX: 1, duration: 3.2, ease: 'none', repeat: -1, transformOrigin: 'left center' });
    }, stage);
    return () => ctx.revert();
  }, []);

  const rise = (d) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] } });

  return (
    <main ref={stage} style={{ minHeight: '100dvh', background: '#FAF6F1', color: ink, fontFamily: "'Manrope',system-ui,sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px 120px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div aria-hidden="true" style={{ position: 'relative', width: 240, height: 230, marginBottom: 28 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="rc-card" style={{
              position: 'absolute', top: 10, left: 80 + (i - 1) * 62, width: 84, height: 150, borderRadius: 18,
              background: ['#EFE6DC', '#1C1410', '#F6E6DA'][i], border: i === 1 ? 'none' : `1px solid ${line}`,
              transform: `rotate(${(i - 1) * 9}deg)`, zIndex: i === 1 ? 2 : 1,
              boxShadow: i === 1 ? '0 18px 40px rgba(28,20,16,.25)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {i === 1 && (
                <>
                  <span className="rc-play" style={{ width: 40, height: 40, borderRadius: 999, background: accent, display: 'grid', placeItems: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  <span style={{ position: 'absolute', left: 10, right: 10, bottom: 12, height: 3, borderRadius: 3, background: 'rgba(255,255,255,.2)' }}>
                    <span className="rc-bar" style={{ display: 'block', height: '100%', borderRadius: 3, background: '#fff', transform: 'scaleX(0)' }} />
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        <Motion.span {...rise(0.05)} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: accent, background: '#F6E6DA', padding: '5px 12px', borderRadius: 999 }}>Coming soon</Motion.span>
        <Motion.h1 {...rise(0.12)} style={{ margin: '16px 0 10px', fontSize: 'clamp(28px,7vw,36px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1 }}>Reels are on the way</Motion.h1>
        <Motion.p {...rise(0.2)} style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: muted, maxWidth: 320 }}>
          Short videos of real bags, straight from sellers and factories. We're polishing it now.
        </Motion.p>
        <Motion.div {...rise(0.28)} style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/products')} style={{ minHeight: 48, padding: '0 24px', borderRadius: 999, border: 0, background: accent, color: '#fff', font: "800 14px 'Manrope',sans-serif", cursor: 'pointer', boxShadow: '0 8px 22px rgba(180,65,14,.28)' }}>Browse bags</Motion.button>
          <Motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/factory')} style={{ minHeight: 48, padding: '0 24px', borderRadius: 999, border: `1px solid ${line}`, background: '#fff', color: ink, font: "800 14px 'Manrope',sans-serif", cursor: 'pointer' }}>Factory Direct</Motion.button>
        </Motion.div>
      </div>
    </main>
  );
}
