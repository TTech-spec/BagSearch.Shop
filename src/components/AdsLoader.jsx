import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function injectScript({ id, src, attrs = {}, onLoad }) {
  const existing = document.getElementById(id);
  if (existing) {
    if (onLoad) onLoad();
    return existing;
  }
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
  if (onLoad) script.addEventListener('load', onLoad);
  document.head.appendChild(script);
  return script;
}

/**
 * Loads the Adcash library and activates the AutoTag zone (9o2rprcllc).
 *
 * AutoTag is skipped on the /onboarding welcome tour so the first-run
 * experience is never interrupted by an ad.
 *
 * The zone ID comes from the new approved account for https://bagsearch.shop.
 */
export default function AdsLoader() {
  const location = useLocation();
  const loadedRef = useRef(false);

  useEffect(() => {
    // Never run ads on the onboarding welcome tour
    if (location.pathname.startsWith('/onboarding')) return;

    // Only inject + activate once per page session
    if (loadedRef.current) return;
    loadedRef.current = true;

    injectScript({
      id: 'aclib',
      src: 'https://acscdn.com/script/aclib.js',
      onLoad: () => {
        window.__aclibReady = true;
        window.dispatchEvent(new Event('aclib:ready'));

        // Activate AutoTag zone for the new approved account
        try {
          window.aclib.runAutoTag({ zoneId: '9o2rprcllc' });
        } catch (err) {
          console.error('[AdsLoader] runAutoTag failed:', err);
        }
      },
    });
  }, [location.pathname]);

  return null;
}
