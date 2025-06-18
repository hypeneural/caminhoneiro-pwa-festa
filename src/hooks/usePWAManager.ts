import { useState, useEffect, useCallback } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  needRefresh: boolean;
  showInstallPrompt: boolean;
  showIOSInstructions: boolean;
  canPromptInstall: boolean;
  installationAttempts: number;
  lastPromptTime: number | null;
  userEngagement: number;
  isScrolled: boolean;
}

interface PWAActions {
  installPWA: () => Promise<void>;
  showIOSModal: () => void;
  hideIOSModal: () => void;
  dismissForever: () => void;
  dismissTemporary: () => void;
  updateServiceWorker: () => void;
  incrementEngagement: () => void;
  resetPrompts: () => void;
}

type PWAManager = PWAState & PWAActions;

const STORAGE_KEYS = {
  DISMISSED_FOREVER: 'pwa-dismissed-forever-v2',
  LAST_PROMPT: 'pwa-last-prompt-v2',
  INSTALL_ATTEMPTS: 'pwa-install-attempts-v2',
  USER_ENGAGEMENT: 'pwa-user-engagement-v2',
  IOS_MODAL_SHOWN: 'pwa-ios-modal-shown-v2'
} as const;

const CONFIG = {
  MIN_ENGAGEMENT_SCORE: 3,
  PROMPT_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours
  IOS_PROMPT_DELAY: 5000, // 5 seconds
  ANDROID_PROMPT_DELAY: 3000, // 3 seconds
  MAX_INSTALL_ATTEMPTS: 3
} as const;

export function usePWAManager(): PWAManager {
  const deviceInfo = useDeviceDetection();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // Core state
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    needRefresh: false,
    showInstallPrompt: false,
    showIOSInstructions: false,
    canPromptInstall: false,
    installationAttempts: 0,
    lastPromptTime: null,
    userEngagement: 0,
    isScrolled: false
  });

  // Load persisted data
  useEffect(() => {
    const loadPersistedData = () => {
      const installationAttempts = parseInt(
        localStorage.getItem(STORAGE_KEYS.INSTALL_ATTEMPTS) || '0'
      );
      const lastPromptTime = parseInt(
        localStorage.getItem(STORAGE_KEYS.LAST_PROMPT) || '0'
      ) || null;
      const userEngagement = parseInt(
        localStorage.getItem(STORAGE_KEYS.USER_ENGAGEMENT) || '0'
      );

      setState(prev => ({
        ...prev,
        installationAttempts,
        lastPromptTime,
        userEngagement,
        isInstalled: deviceInfo.isStandalone
      }));
    };

    loadPersistedData();
  }, [deviceInfo.isStandalone]);

  // Service Worker and update detection
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, needRefresh: true }));
              }
            });
          }
        });
      });
    }
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install prompt detection
  useEffect(() => {
    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, canPromptInstall: true }));
    };

    const appInstalledHandler = () => {
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false,
        showInstallPrompt: false,
        showIOSInstructions: false
      }));
      setDeferredPrompt(null);
      
      // Clear dismissal flags on successful install
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_FOREVER);
      localStorage.removeItem(STORAGE_KEYS.LAST_PROMPT);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  // Smart prompting logic
  useEffect(() => {
    if (!deviceInfo.canShowInstallPrompt || state.isInstalled || state.showInstallPrompt) return;

    const isDismissedForever = localStorage.getItem(STORAGE_KEYS.DISMISSED_FOREVER) === 'true';
    if (isDismissedForever) return;

    const now = Date.now();
    const cooldownActive = state.lastPromptTime && 
                          (now - state.lastPromptTime) < CONFIG.PROMPT_COOLDOWN;
    if (cooldownActive) return;

    const hasMinEngagement = state.userEngagement >= CONFIG.MIN_ENGAGEMENT_SCORE;
    const maxAttemptsReached = state.installationAttempts >= CONFIG.MAX_INSTALL_ATTEMPTS;
    
    if (!hasMinEngagement || maxAttemptsReached) return;

    const delay = deviceInfo.isIOS ? CONFIG.IOS_PROMPT_DELAY : CONFIG.ANDROID_PROMPT_DELAY;
    
    const timer = setTimeout(() => {
      setState(prev => {
        if (prev.showInstallPrompt || prev.showIOSInstructions) return prev;
        return { 
          ...prev, 
          isInstallable: true,
          showInstallPrompt: !deviceInfo.isIOS,
          showIOSInstructions: deviceInfo.isIOS && deviceInfo.isSafari
        };
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [
    deviceInfo.canShowInstallPrompt, 
    deviceInfo.isIOS, 
    deviceInfo.isSafari,
    state.isInstalled,
    state.userEngagement,
    state.installationAttempts,
    state.lastPromptTime,
    state.showInstallPrompt,
    state.showIOSInstructions
  ]);

  // Actions
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      const attempts = state.installationAttempts + 1;
      localStorage.setItem(STORAGE_KEYS.INSTALL_ATTEMPTS, attempts.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_PROMPT, Date.now().toString());
      
      if (outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstallable: false,
          showInstallPrompt: false,
          installationAttempts: attempts
        }));
        setDeferredPrompt(null);
      } else {
        setState(prev => ({ 
          ...prev, 
          showInstallPrompt: false,
          installationAttempts: attempts
        }));
      }
    } catch (error) {
      console.error('PWA installation error:', error);
    }
  }, [deferredPrompt, state.installationAttempts]);

  const showIOSModal = useCallback(() => {
    setState(prev => ({ ...prev, showIOSInstructions: true }));
    localStorage.setItem(STORAGE_KEYS.IOS_MODAL_SHOWN, 'true');
    localStorage.setItem(STORAGE_KEYS.LAST_PROMPT, Date.now().toString());
  }, []);

  const hideIOSModal = useCallback(() => {
    setState(prev => ({ ...prev, showIOSInstructions: false }));
  }, []);

  const dismissForever = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_FOREVER, 'true');
    setState(prev => ({ 
      ...prev, 
      isInstallable: false,
      showInstallPrompt: false,
      showIOSInstructions: false
    }));
  }, []);

  const dismissTemporary = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.LAST_PROMPT, Date.now().toString());
    setState(prev => ({ 
      ...prev, 
      showInstallPrompt: false,
      showIOSInstructions: false
    }));
  }, []);

  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }, []);

  const incrementEngagement = useCallback(() => {
    const newEngagement = state.userEngagement + 1;
    localStorage.setItem(STORAGE_KEYS.USER_ENGAGEMENT, newEngagement.toString());
    setState(prev => ({ ...prev, userEngagement: newEngagement }));
  }, [state.userEngagement]);

  const resetPrompts = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    setState(prev => ({
      ...prev,
      installationAttempts: 0,
      lastPromptTime: null,
      userEngagement: 0,
      showInstallPrompt: false,
      showIOSInstructions: false
    }));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      if (scrolled !== state.isScrolled) {
        setState(prev => ({ ...prev, isScrolled: scrolled }));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [state.isScrolled]);

  return {
    ...state,
    installPWA,
    showIOSModal,
    hideIOSModal,
    dismissForever,
    dismissTemporary,
    updateServiceWorker,
    incrementEngagement,
    resetPrompts
  };
}