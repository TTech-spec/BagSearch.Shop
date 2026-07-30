import { useEffect, useRef } from 'react';

/**
 * Renders a single Adcash display banner (not AutoTag — no click hijacking,
 * no interstitials, no redirects). Safe, explicit, contained ad placement.
 */
export default function AdcashBanner({ zoneId, style, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let cancelled = false;
    let retryTimer = null;

    const run = () => {
      if (cancelled) return;
      if (typeof window.aclib?.runBanner !== 'function') {
        // SDK object exists but hasn't finished initializing yet — retry briefly.
        retryTimer = setTimeout(run, 200);
        return;
      }
      try {
        el.innerHTML = '';
        window.aclib.runBanner({ zoneId });
      } catch (err) {
        console.error('AdcashBanner failed to render:', err);
      }
    };

    if (window.__aclibReady || window.aclib) {
      run();
    } else {
      window.addEventListener('aclib:ready', run, { once: true });
    }

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener('aclib:ready', run);
    };
  }, [zoneId]);

  return <div ref={containerRef} className={className} style={style} />;
}
