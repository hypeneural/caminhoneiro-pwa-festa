/**
 * Advanced State Management Hook
 * Combines global state, caching, and intelligent syncing
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { cacheManager, CACHE_STRATEGIES } from '@/services/advanced-cache';

export interface StateConfig<T> {
  key: string;
  initialValue: T;
  persist?: boolean;
  cacheDuration?: number;
  backgroundSync?: boolean;
  validator?: (value: unknown) => value is T;
}

type StateAction<T> = 
  | { type: 'SET'; payload: T }
  | { type: 'UPDATE'; payload: Partial<T> }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; payload: T };

interface StateState<T> {
  value: T;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  isDirty: boolean;
}

function stateReducer<T>(state: StateState<T>, action: StateAction<T>): StateState<T> {
  switch (action.type) {
    case 'SET':
      return {
        ...state,
        value: action.payload,
        lastUpdated: Date.now(),
        isDirty: true,
        error: null
      };
    case 'UPDATE':
      return {
        ...state,
        value: { ...state.value, ...action.payload },
        lastUpdated: Date.now(),
        isDirty: true,
        error: null
      };
    case 'RESET':
      return {
        ...state,
        loading: false,
        error: null,
        isDirty: false
      };
    case 'HYDRATE':
      return {
        ...state,
        value: action.payload,
        loading: false,
        lastUpdated: Date.now(),
        isDirty: false
      };
    default:
      return state;
  }
}

export function useAdvancedState<T>(config: StateConfig<T>) {
  const { state: appState, addToSyncQueue } = useApp();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  const [state, dispatch] = useReducer(stateReducer<T>, {
    value: config.initialValue,
    loading: false,
    error: null,
    lastUpdated: 0,
    isDirty: false
  });

  // Hydrate from cache on mount
  useEffect(() => {
    const hydrateFromCache = async () => {
      if (!config.persist) return;

      try {
        const cacheKey = `state_${config.key}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const parsed = JSON.parse(cached);
          
          // Validate cached data if validator provided
          if (config.validator) {
            if (config.validator(parsed.value)) {
              dispatch({ type: 'HYDRATE', payload: parsed.value });
            }
          } else {
            dispatch({ type: 'HYDRATE', payload: parsed.value });
          }
        }
      } catch (error) {
        console.warn(`Failed to hydrate state for ${config.key}:`, error);
      }
    };

    hydrateFromCache();
  }, [config.key, config.persist, config.validator]);

  // Intelligent sync mechanism
  useEffect(() => {
    if (!state.isDirty || !config.persist) return;

    // Debounce sync operations
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      try {
        const cacheKey = `state_${config.key}`;
        const dataToCache = {
          value: state.value,
          lastUpdated: state.lastUpdated
        };

        localStorage.setItem(cacheKey, JSON.stringify(dataToCache));

        // Add to background sync if configured
        if (config.backgroundSync && !appState.isOnline) {
          addToSyncQueue('state_sync', dataToCache);
        }

        dispatch({ type: 'RESET' });
      } catch (error) {
        console.error(`Failed to sync state for ${config.key}:`, error);
      }
    }, 1000); // 1 second debounce

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state.isDirty, state.value, state.lastUpdated, config.persist, config.backgroundSync, config.key, appState.isOnline, addToSyncQueue]);

  const setValue = useCallback((newValue: T) => {
    dispatch({ type: 'SET', payload: newValue });
  }, []);

  const updateValue = useCallback((updates: Partial<T>) => {
    dispatch({ type: 'UPDATE', payload: updates });
  }, []);

  const resetValue = useCallback(() => {
    setValue(config.initialValue);
  }, [setValue, config.initialValue]);

  // Smart fetch with cache integration
  const fetchWithCache = useCallback(async (
    url: string, 
    options?: RequestInit
  ): Promise<T | null> => {
    try {
      const strategy = url.includes('/api/tracker') 
        ? CACHE_STRATEGIES.tracker 
        : CACHE_STRATEGIES.api;

      const response = await cacheManager.get(url, strategy);
      
      if (response && response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET', payload: data });
        return data;
      }
      
      return null;
    } catch (error) {
      console.error(`Fetch failed for ${url}:`, error);
      
      // Add to background sync queue if offline
      if (!appState.isOnline && config.backgroundSync) {
        cacheManager.addToSyncQueue(url, options?.method || 'GET', options?.body);
      }
      
      return null;
    }
  }, [appState.isOnline, config.backgroundSync]);

  // Optimistic updates
  const optimisticUpdate = useCallback((
    updateFn: (current: T) => T,
    rollbackValue?: T
  ) => {
    const originalValue = state.value;
    const optimisticValue = updateFn(originalValue);
    
    dispatch({ type: 'SET', payload: optimisticValue });

    return {
      rollback: () => {
        dispatch({ type: 'SET', payload: rollbackValue || originalValue });
      }
    };
  }, [state.value]);

  return {
    value: state.value,
    loading: state.loading,
    error: state.error,
    isDirty: state.isDirty,
    lastUpdated: state.lastUpdated,
    setValue,
    updateValue,
    resetValue,
    fetchWithCache,
    optimisticUpdate
  };
}

// Specialized hooks for common patterns
export function useTrackerState() {
  return useAdvancedState({
    key: 'tracker',
    initialValue: { latitude: 0, longitude: 0, speed: 0, heading: 0 },
    persist: true,
    backgroundSync: true,
    cacheDuration: 30000, // 30 seconds
    validator: (value): value is any => {
      return typeof value === 'object' && 
             value !== null && 
             'latitude' in value && 
             'longitude' in value;
    }
  });
}

export function useNewsState() {
  return useAdvancedState({
    key: 'news',
    initialValue: [],
    persist: true,
    backgroundSync: true,
    cacheDuration: 300000, // 5 minutes
    validator: (value): value is any[] => Array.isArray(value)
  });
}

export function usePhotosState() {
  return useAdvancedState({
    key: 'photos',
    initialValue: [],
    persist: true,
    backgroundSync: false,
    cacheDuration: 600000, // 10 minutes
    validator: (value): value is any[] => Array.isArray(value)
  });
}