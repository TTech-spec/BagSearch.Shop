import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { T, EASE_OUT } from '../../theme/luxe';
import { getOptimizedImageUrl, IMG_SIZES } from '../../utils/imageUtils';

const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? T.accent : 'none'} stroke={filled ? T.accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 8.6c0-2.6-2.1-4.6-4.7-4.6-1.8 0-3.3 1-4.1 2.5C11.2 5 9.7 4 7.9 4 5.3 4 3.2 6 3.2 8.6 3.2 15 12 20 12 20s8.8-5 8.8-11.4z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);

const roundBtn = {
  width: 44, height: 44, borderRadius: 999, border: 'none', background: T.surface, color: T.ink,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 10px rgba(28,20,16,0.14)', position: 'relative',
};

// Small burst of dots when a bag is saved.
function HeartBurst() {
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <motion.span key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: Math.cos(a) * 26, y: Math.sin(a) * 26, scale: 0, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ position: 'absolute', left: 19, top: 19, width: 6, height: 6, borderRadius: 999, background: i % 2 ? T.accent : T.accentOnDark }} />
        );
      })}
    </span>
  );
}

export function WishlistButton({ wishlisted, onToggle, style }) {
  const [burstKey, setBurstKey] = useState(0);
  return (
    <motion.button type="button" whileTap={{ scale: 0.85 }}
      aria-label={wishlisted ? 'Remove from saved' : 'Save to wishlist'} aria-pressed={wishlisted}
      onClick={() => { if (!wishlisted) setBurstKey(k => k + 1); onToggle(); }}
      style={{ ...roundBtn, ...style }}>
      <motion.span key={wishlisted ? 'on' : 'off'} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }} style={{ display: 'flex' }}>
        <HeartIcon filled={wishlisted} />
      </motion.span>
      {burstKey > 0 && wishlisted && <HeartBurst key={burstKey} />}
    </motion.button>
  );
}

const slide = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 1.02 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.98 }),
};

export default function ProductGallery({ images, alt, isMobile, wishlisted, onToggleWishlist, onShare, onBack }) {
  const reduce = useReducedMotion();
  const [[index, dir], setPage] = useState([0, 0]);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const count = images.length;

  const go = useCallback((next) => {
    const n = (next + count) % count;
    setPage(([cur]) => [n, n > cur ? 1 : -1]);
  }, [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightbox, index, go]);

  const src = (i) => getOptimizedImageUrl(images[i], IMG_SIZES.detail.width, IMG_SIZES.detail.height);

  const mainImage = (
    <AnimatePresence initial={false} custom={dir} mode="popLayout">
      <motion.div
        key={index}
        custom={dir}
        variants={reduce ? undefined : slide}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.45, ease: EASE_OUT }}
        drag={isMobile && count > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50 || info.velocity.x < -400) go(index + 1);
          else if (info.offset.x > 50 || info.velocity.x > 400) go(index - 1);
        }}
        style={{ position: 'absolute', inset: 0, cursor: isMobile ? 'grab' : 'zoom-in', touchAction: 'pan-y' }}
      >
        <img
          src={src(index)}
          alt={`${alt} — photo ${index + 1} of ${count}`}
          width="800" height="1000"
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchpriority={index === 0 ? 'high' : undefined}
          draggable={false}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none',
            transformOrigin: `${zoom.x}% ${zoom.y}%`,
            transform: zoom.on ? 'scale(1.8)' : 'scale(1)',
            transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );

  const frame = (
    <div
      onMouseMove={isMobile ? undefined : (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseLeave={() => setZoom(z => ({ ...z, on: false }))}
      onClick={() => { if (!isMobile) setLightbox(true); }}
      style={{
        position: 'relative', overflow: 'hidden', background: T.photo,
        aspectRatio: '4 / 5', width: '100%',
        borderRadius: isMobile ? 0 : 18,
      }}>
      {mainImage}

      {isMobile ? (
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
          <motion.button type="button" whileTap={{ scale: 0.9 }} aria-label="Back" onClick={onBack} style={roundBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </motion.button>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button type="button" whileTap={{ scale: 0.9 }} aria-label="Share" onClick={onShare} style={roundBtn}><ShareIcon /></motion.button>
            <WishlistButton wishlisted={wishlisted} onToggle={onToggleWishlist} />
          </div>
        </div>
      ) : (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
          <WishlistButton wishlisted={wishlisted} onToggle={onToggleWishlist} />
          <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }} aria-label="Share" onClick={onShare} style={roundBtn}><ShareIcon /></motion.button>
        </div>
      )}

      {isMobile ? (
        count > 1 && (
          <div role="tablist" aria-label="Photos" style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 2 }}>
            {images.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Photo ${i + 1}`} onClick={() => go(i)}
                style={{ padding: 6, margin: -6, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <motion.span animate={{ width: i === index ? 20 : 6, opacity: i === index ? 1 : 0.35 }} transition={{ duration: 0.3, ease: EASE_OUT }}
                  style={{ display: 'block', height: 6, borderRadius: 999, background: T.ink }} />
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <span style={{ position: 'absolute', left: 16, bottom: 16, padding: '6px 12px', borderRadius: 999, background: 'rgba(28,20,16,0.72)', color: '#fff', fontSize: 12, fontWeight: 700, zIndex: 2 }}>
            {index + 1} / {count}
          </span>
          <AnimatePresence>
            {!zoom.on && (
              <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                style={{ position: 'absolute', right: 16, bottom: 16, padding: '6px 12px', borderRadius: 999, background: T.surface, color: T.ink, fontSize: 12, fontWeight: 700, zIndex: 2, pointerEvents: 'none' }}>
                Hover to zoom · click to expand
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? frame : (
        <div style={{ display: 'flex', gap: 12 }}>
          {count > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 80, flexShrink: 0 }}>
              {images.map((img, i) => (
                <motion.button key={i} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === index}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.4, ease: EASE_OUT }}
                  style={{ position: 'relative', width: 80, height: 100, padding: 0, borderRadius: 10, border: `1px solid ${T.line}`, background: T.photo, cursor: 'pointer', overflow: 'visible' }}>
                  <img src={getOptimizedImageUrl(img, 160, 200)} alt="" loading="lazy" width="80" height="100"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9, display: 'block', opacity: i === index ? 1 : 0.7, transition: 'opacity .2s' }} />
                  {i === index && (
                    <motion.span layoutId="pd-thumb-ring" transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      style={{ position: 'absolute', inset: -3, borderRadius: 12, border: `2px solid ${T.ink}` }} />
                  )}
                </motion.button>
              ))}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>{frame}</div>
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div role="dialog" aria-modal="true" aria-label="Photo viewer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,14,11,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.img key={index} src={getOptimizedImageUrl(images[index], 1400, 1750)} alt={`${alt} — photo ${index + 1}`}
                custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: EASE_OUT }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 'min(90vw, 1000px)', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12 }} />
            </AnimatePresence>
            <button type="button" aria-label="Close" onClick={() => setLightbox(false)}
              style={{ ...roundBtn, position: 'absolute', top: 20, right: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {count > 1 && (
              <>
                <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(index - 1); }} style={{ ...roundBtn, position: 'absolute', left: 20, top: '50%', marginTop: -22 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(index + 1); }} style={{ ...roundBtn, position: 'absolute', right: 20, top: '50%', marginTop: -22 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
