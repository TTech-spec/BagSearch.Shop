import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ADSENSE_CLIENT_ID = 'ca-pub-6332230508786505';

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
 * Loads third-party ad scripts (Adcash lib + Google AdSense) everywhere
 * except the onboarding welcome tour, so a visitor's first impression of the
 * app is never interrupted by an ad.
 *
 * NOTE: this only loads the Adcash library (aclib.js). It deliberately does
 * NOT call `aclib.runAutoTag(...)` — AutoTag is the "hijack any click on the
 * page and fire an interstitial/redirect" product, which is what was sending
 * visitors to gambling sites. Actual ad placements are rendered explicitly
 * via <AdcashBanner /> wherever we choose to show one.
 */
export default function AdsLoader() {
  const location = useLocation();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    if (location.pathname.startsWith('/onboarding')) return;

    loadedRef.current = true;

    injectScript({
      id: 'aclib',
      src: '//acscdn.com/script/aclib.js',
      onLoad: () => {
        window.__aclibReady = true;
        window.dispatchEvent(new Event('aclib:ready'));
      },
    });

    injectScript({
      id: 'adsbygoogle-loader',
      src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`,
      attrs: { crossorigin: 'anonymous' },
    });
  }, [location.pathname]);

  return null;
}
