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

    const run = () => {
      el.innerHTML = '';
      if (!window.aclib) return;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.text = `aclib.runBanner({ zoneId: '${zoneId}' });`;
      el.appendChild(script);
    };

    if (window.__aclibReady || window.aclib) {
      run();
      return undefined;
    }

    window.addEventListener('aclib:ready', run, { once: true });
    return () => window.removeEventListener('aclib:ready', run);
  }, [zoneId]);

  return <div ref={containerRef} className={className} style={style} />;
}
