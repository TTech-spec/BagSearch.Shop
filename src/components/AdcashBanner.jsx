import { useEffect, useRef } from 'react';

/**
 * Renders an Adcash AutoTag ad placement for zone 9o2rprcllc.
 *
 * AutoTag manages its own ad unit selection, so this component just calls
 * aclib.runAutoTag with the zone ID once the SDK is ready.
 *
 * Retry strategy:
 *  - If aclib is already ready, run immediately.
 *  - Otherwise wait for the 'aclib:ready' event dispatched by AdsLoader.
 *  - Retry every 200ms up to 30 times (6 seconds) to handle any async
 *    initialization Adcash does after the script first loads.
 */
export default function AdcashBanner({ zoneId, style, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let cancelled = false;
    let retryTimer = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // 30 × 200ms = 6 seconds max wait

    const run = () => {
      if (cancelled) return;

      // aclib not present yet — keep waiting
      if (!window.aclib) {
        if (attempts++ < MAX_ATTEMPTS) {
          retryTimer = setTimeout(run, 200);
        }
        return;
      }

      // aclib present but not yet fully initialised
      if (typeof window.aclib.runAutoTag !== 'function') {
        if (attempts++ < MAX_ATTEMPTS) {
          retryTimer = setTimeout(run, 200);
        }
        return;
      }

      try {
        window.aclib.runAutoTag({ zoneId: String(zoneId) });
      } catch (err) {
        console.error('[AdcashBanner] runAutoTag failed for zone', zoneId, err);
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
