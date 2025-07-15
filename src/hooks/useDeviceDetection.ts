import { useState, useEffect } from 'react';

export function useDeviceDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
      setHasTouch(touch);
    };

    checkDevice();

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const handleChange = () => checkDevice();

    // Modern browsers
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleChange);
      tabletQuery.addEventListener('change', handleChange);
      desktopQuery.addEventListener('change', handleChange);
    }
    // Safari < 14
    else if (mobileQuery.addListener) {
      mobileQuery.addListener(handleChange);
      tabletQuery.addListener(handleChange);
      desktopQuery.addListener(handleChange);
    }

    return () => {
      // Modern browsers
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', handleChange);
        tabletQuery.removeEventListener('change', handleChange);
        desktopQuery.removeEventListener('change', handleChange);
      }
      // Safari < 14
      else if (mobileQuery.removeListener) {
        mobileQuery.removeListener(handleChange);
        tabletQuery.removeListener(handleChange);
        desktopQuery.removeListener(handleChange);
      }
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    hasTouch
  };
}