import { useState, useEffect, useCallback } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallerState {
  isInstallable: boolean;
  isInstalled: boolean;
  showIOSInstructions: boolean;
  canPromptInstall: boolean;
  installPWA: () => Promise<void>;
  showIOSModal: () => void;
  hideIOSModal: () => void;
  dismissForever: () => void;
}

const STORAGE_KEYS = {
  DISMISSED_FOREVER: 'pwa-dismissed-forever',
  IOS_MODAL_SHOWN: 'pwa-ios-modal-shown',
  INSTALL_ATTEMPTS: 'pwa-install-attempts'
};

export function usePWAInstaller(): PWAInstallerState {
  const deviceInfo = useDeviceDetection();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  const isDismissedForever = localStorage.getItem(STORAGE_KEYS.DISMISSED_FOREVER) === 'true';
  const iosModalShown = localStorage.getItem(STORAGE_KEYS.IOS_MODAL_SHOWN) === 'true';

  useEffect(() => {
    // Android install prompt listener
    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissedForever) {
        setIsInstallable(true);
      }
    };

    // App installed listener
    const appInstalledHandler = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_FOREVER);
      
      // Track successful installation
      const attempts = parseInt(localStorage.getItem(STORAGE_KEYS.INSTALL_ATTEMPTS) || '0');
      localStorage.setItem(STORAGE_KEYS.INSTALL_ATTEMPTS, (attempts + 1).toString());
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.addEventListener('appinstalled', appInstalledHandler);

    // iOS detection and auto-show logic
    if (deviceInfo.isIOS && deviceInfo.isSafari && !deviceInfo.isStandalone && 
        !isDismissedForever && !iosModalShown) {
      // Show iOS instructions after user has been on site for a bit
      const timer = setTimeout(() => {
        setIsInstallable(true);
      }, 15000); // 15 seconds delay

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
        window.removeEventListener('appinstalled', appInstalledHandler);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, [deviceInfo, isDismissedForever, iosModalShown]);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  }, [deferredPrompt]);

  const showIOSModal = useCallback(() => {
    setShowIOSInstructions(true);
    localStorage.setItem(STORAGE_KEYS.IOS_MODAL_SHOWN, 'true');
  }, []);

  const hideIOSModal = useCallback(() => {
    setShowIOSInstructions(false);
  }, []);

  const dismissForever = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_FOREVER, 'true');
    setIsInstallable(false);
    setShowIOSInstructions(false);
  }, []);

  return {
    isInstallable: isInstallable && !isDismissedForever,
    isInstalled: deviceInfo.isStandalone,
    showIOSInstructions,
    canPromptInstall: !!deferredPrompt,
    installPWA,
    showIOSModal,
    hideIOSModal,
    dismissForever
  };
}