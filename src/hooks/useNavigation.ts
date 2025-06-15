import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES, RouteValue } from '@/constants/routes';

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigate to route
  const navigateTo = useCallback((route: RouteValue, options?: { replace?: boolean; state?: any }) => {
    navigate(route, options);
  }, [navigate]);

  // Go back
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.HOME);
    }
  }, [navigate]);

  // Go forward
  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  // Replace current route
  const replaceTo = useCallback((route: RouteValue, state?: any) => {
    navigate(route, { replace: true, state });
  }, [navigate]);

  // Check if current route matches
  const isCurrentRoute = useCallback((route: RouteValue) => {
    return location.pathname === route;
  }, [location.pathname]);

  // Check if route is active (for navigation highlighting)
  const isActiveRoute = useCallback((route: RouteValue) => {
    if (route === ROUTES.HOME) {
      return location.pathname === route;
    }
    return location.pathname.startsWith(route);
  }, [location.pathname]);

  // Get current route info
  const getCurrentRoute = useCallback(() => {
    const currentPath = location.pathname;
    const routeEntry = Object.entries(ROUTES).find(([_, path]) => path === currentPath);
    
    return {
      path: currentPath,
      key: routeEntry?.[0] || 'UNKNOWN',
      params: new URLSearchParams(location.search),
      state: location.state,
      hash: location.hash
    };
  }, [location]);

  // Navigate with tracking (for analytics)
  const navigateWithTracking = useCallback((
    route: RouteValue, 
    trackingData?: { category?: string; action?: string; label?: string }
  ) => {
    // Here you could integrate with analytics
    console.log('Navigation tracking:', { route, ...trackingData });
    navigateTo(route);
  }, [navigateTo]);

  // External navigation (opens in new tab)
  const navigateExternal = useCallback((url: string, target: '_blank' | '_self' = '_blank') => {
    window.open(url, target, target === '_blank' ? 'noopener,noreferrer' : undefined);
  }, []);

  // Deep link navigation (with fallback)
  const navigateDeepLink = useCallback((route: RouteValue, fallbackRoute?: RouteValue) => {
    try {
      navigateTo(route);
    } catch (error) {
      console.error('Deep link navigation failed:', error);
      if (fallbackRoute) {
        navigateTo(fallbackRoute);
      } else {
        navigateTo(ROUTES.HOME);
      }
    }
  }, [navigateTo]);

  // Conditional navigation
  const navigateIf = useCallback((
    condition: boolean | (() => boolean), 
    route: RouteValue, 
    fallbackRoute?: RouteValue
  ) => {
    const shouldNavigate = typeof condition === 'function' ? condition() : condition;
    
    if (shouldNavigate) {
      navigateTo(route);
    } else if (fallbackRoute) {
      navigateTo(fallbackRoute);
    }
  }, [navigateTo]);

  // Prefetch route (for performance)
  const prefetchRoute = useCallback((route: RouteValue) => {
    // In a real app, this would prefetch the route's code and data
    console.log('Prefetching route:', route);
  }, []);

  return {
    // Basic navigation
    navigateTo,
    goBack,
    goForward,
    replaceTo,
    
    // Route checking
    isCurrentRoute,
    isActiveRoute,
    getCurrentRoute,
    
    // Advanced navigation
    navigateWithTracking,
    navigateExternal,
    navigateDeepLink,
    navigateIf,
    prefetchRoute,
    
    // Utilities
    location,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state
  };
}