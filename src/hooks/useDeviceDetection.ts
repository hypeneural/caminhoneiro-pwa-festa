import { useState, useEffect } from 'react';

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isStandalone: boolean;
  isMobile: boolean;
  supportsInstall: boolean;
  platform: 'ios' | 'android' | 'desktop';
  iosVersion: number | null;
  safariVersion: number | null;
  isInAppBrowser: boolean;
  canShowInstallPrompt: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isStandalone: false,
    isMobile: false,
    supportsInstall: false,
    platform: 'desktop',
    iosVersion: null,
    safariVersion: null,
    isInAppBrowser: false,
    canShowInstallPrompt: false
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    
    // Enhanced iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // iOS version detection
    let iosVersion: number | null = null;
    if (isIOS) {
      const match = userAgent.match(/OS (\d+)_(\d+)/);
      if (match) {
        iosVersion = parseInt(match[1]);
      }
    }
    
    // Enhanced Android detection
    const isAndroid = /Android/.test(userAgent);
    
    // Enhanced Safari detection (excluding in-app browsers)
    const isSafari = /Safari/.test(userAgent) && 
                     !/Chrome/.test(userAgent) && 
                     !/CriOS/.test(userAgent) &&
                     !/FxiOS/.test(userAgent) &&
                     !/EdgiOS/.test(userAgent);
    
    // Safari version detection
    let safariVersion: number | null = null;
    if (isSafari) {
      const match = userAgent.match(/Version\/(\d+)/);
      if (match) {
        safariVersion = parseInt(match[1]);
      }
    }
    
    // In-app browser detection
    const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line|WeChat|QQ/.test(userAgent);
    
    // Standalone detection with multiple methods
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true ||
                        window.matchMedia('(display-mode: fullscreen)').matches ||
                        window.matchMedia('(display-mode: minimal-ui)').matches;
    
    const isMobile = isIOS || isAndroid;
    
    // Enhanced install support detection
    const supportsInstall = 'serviceWorker' in navigator && 
                           (('BeforeInstallPromptEvent' in window) || 
                            (isIOS && isSafari && !isInAppBrowser));
    
    // Can show install prompt logic
    const canShowInstallPrompt = !isStandalone && 
                                !isInAppBrowser && 
                                supportsInstall &&
                                ((isIOS && isSafari && (iosVersion === null || iosVersion >= 16)) ||
                                 (isAndroid && !isSafari));

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
      platform,
      iosVersion,
      safariVersion,
      isInAppBrowser,
      canShowInstallPrompt
    });
  }, []);

  return deviceInfo;
}