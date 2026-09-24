// src/components/VideoLoader.jsx
// Full-screen branded loading screen that plays /videos/loading-screen.mp4.
// The video is landscape, so it is shown whole (contain) on top of a blurred,
// zoomed copy of itself that fills the rest of the screen on any aspect ratio.
import { useEffect, useState } from 'react';

export const LOADER_VIDEO_SRC = '/videos/loading-screen.mp4';

/**
 * @param duration  ms to stay up before fading out and calling onDone.
 *                  Omit it to keep the loader up until the parent unmounts it.
 * @param onDone    called once the fade-out has finished
 * @param fixed     overlay the page (true) or render in normal flow (false)
 */
export default function VideoLoader({ duration, onDone, fixed = true }) {
  const [leaving, setLeaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!duration) return;
    const fade = setTimeout(() => setLeaving(true), duration);
    const done = setTimeout(() => onDone && onDone(), duration + 450);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, [duration, onDone]);

  return (
    <div
      role="status"
      aria-label="Loading BagSearch"
      style={{
        position: fixed ? 'fixed' : 'relative',
        inset: fixed ? 0 : undefined,
        minHeight: fixed ? undefined : '100dvh',
        zIndex: 99999,
        background: '#140C08',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.45s ease',
        pointerEvents: leaving ? 'none' : 'all',
      }}
    >
      {!failed && (
        <>
          <video
            src={LOADER_VIDEO_SRC}
            autoPlay muted loop playsInline preload="auto"
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'blur(28px) brightness(0.7)', transform: 'scale(1.15)',
            }}
          />
          <video
            src={LOADER_VIDEO_SRC}
            autoPlay muted loop playsInline preload="auto"
            onError={() => setFailed(true)}
            style={{ position: 'relative', width: '100%', height: '100%', maxHeight: '100dvh', objectFit: 'contain' }}
          />
        </>
      )}
      {failed && (
        <span style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>
          Bag<span style={{ color: '#F08A5D' }}>Search</span>
        </span>
      )}
    </div>
  );
}
