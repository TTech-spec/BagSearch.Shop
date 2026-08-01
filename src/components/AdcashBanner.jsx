import { useRef } from 'react';

/**
 * Placeholder slot for an Adcash ad placement.
 *
 * AutoTag (see AdsLoader) is a page-wide tag activated exactly once per
 * page load — it must not be re-triggered here per instance, or Adcash's
 * SDK silently ignores the repeat calls and nothing renders. This div is
 * kept as a layout placeholder for when explicit per-placement banners
 * (aclib.runBanner) are reintroduced.
 */
export default function AdcashBanner({ style, className }) {
  const containerRef = useRef(null);
  return <div ref={containerRef} className={className} style={style} />;
}
