// src/components/VideoLoader.jsx
// Full-screen loading screen: a spinner with the BagSearch wordmark, shown on
// every screen size while auth is checked and lazy route chunks load.
import { useEffect, useState } from 'react';

/**
 * @param duration  ms to stay up before fading out and calling onDone.
 *                  Omit it to keep the loader up until the parent unmounts it.
 * @param onDone    called once the fade-out has finished
 * @param fixed     overlay the page (true) or render in normal flow (false)
 */
export default function VideoLoader({ duration, onDone, fixed = true }) {
  const [leaving, setLeaving] = useState(false);

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
        background: '#ffffff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.45s ease',
        pointerEvents: leaving ? 'none' : 'all',
      }}
    >
      <style>{`@keyframes bsLoaderSpin{to{transform:rotate(360deg)}}`}</style>
      <span
        aria-hidden="true"
        style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3.5px solid #F4E6DC', borderTopColor: '#C84B11',
          animation: 'bsLoaderSpin 0.8s linear infinite',
        }}
      />
      <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: '#1E1A17' }}>
        Bag<span style={{ color: '#C84B11' }}>Search</span>
      </span>
    </div>
  );
}
