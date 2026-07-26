import { useEffect, useState } from 'react';

export const MOBILE_MAX_WIDTH = 600;

export function useIsMobileViewport(maxWidth = MOBILE_MAX_WIDTH) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth <= maxWidth
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= maxWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [maxWidth]);

  return isMobile;
}
