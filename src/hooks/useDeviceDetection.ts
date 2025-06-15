import { useState, useEffect } from 'react';

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isStandalone: boolean;
  isMobile: boolean;
  supportsInstall: boolean;
  platform: 'ios' | 'android' | 'desktop';
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isStandalone: false,
    isMobile: false,
    supportsInstall: false,
    platform: 'desktop'
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/CriOS/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    const isMobile = isIOS || isAndroid;
    const supportsInstall = 'serviceWorker' in navigator && 
                           ('BeforeInstallPromptEvent' in window || isIOS);

    let platform: 'ios' | 'android' | 'desktop' = 'desktop';
    if (isIOS) platform = 'ios';
    else if (isAndroid) platform = 'android';

    setDeviceInfo({
      isIOS,
      isAndroid,
      isSafari,
      isStandalone,
      isMobile,
      supportsInstall,
      platform
    });
  }, []);

  return deviceInfo;
}