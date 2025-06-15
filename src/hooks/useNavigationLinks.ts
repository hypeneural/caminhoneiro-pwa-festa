import { useState, useEffect } from 'react';

export type OSType = 'iOS' | 'Android' | 'Other';

export interface NavigationLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const useNavigationLinks = (coordinates?: Coordinates) => {
  const [osType, setOSType] = useState<OSType>('Other');
  
  useEffect(() => {
    const detectOS = (): OSType => {
      const userAgent = navigator.userAgent;
      
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        return 'iOS';
      }
      
      if (/Android/.test(userAgent)) {
        return 'Android';
      }
      
      return 'Other';
    };
    
    setOSType(detectOS());
  }, []);

  const generateLinks = (coords: Coordinates): NavigationLink[] => {
    const { latitude, longitude } = coords;
    
    const links: Record<OSType, NavigationLink[]> = {
      iOS: [
        {
          id: 'google_maps',
          name: 'Google Maps',
          url: `comgooglemaps://?q=${latitude},${longitude}`,
          icon: 'map',
          color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
          id: 'apple_maps',
          name: 'Apple Maps',
          url: `maps://maps.apple.com/?q=${latitude},${longitude}`,
          icon: 'navigation',
          color: 'bg-gray-500 hover:bg-gray-600'
        },
        {
          id: 'waze',
          name: 'Waze',
          url: `waze://?ll=${latitude},${longitude}&navigate=yes`,
          icon: 'navigation-2',
          color: 'bg-blue-400 hover:bg-blue-500'
        },
        {
          id: 'uber',
          name: 'Uber',
          url: `uber://?action=setPickup&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}`,
          icon: 'car',
          color: 'bg-black hover:bg-gray-800'
        }
      ],
      Android: [
        {
          id: 'google_maps',
          name: 'Google Maps',
          url: `geo:0,0?q=${latitude},${longitude}`,
          icon: 'map',
          color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
          id: 'waze',
          name: 'Waze',
          url: `waze://?ll=${latitude},${longitude}&navigate=yes`,
          icon: 'navigation-2',
          color: 'bg-blue-400 hover:bg-blue-500'
        },
        {
          id: 'uber',
          name: 'Uber',
          url: `uber://?action=setPickup&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}`,
          icon: 'car',
          color: 'bg-black hover:bg-gray-800'
        }
      ],
      Other: [
        {
          id: 'google_maps',
          name: 'Google Maps',
          url: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
          icon: 'map',
          color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
          id: 'waze',
          name: 'Waze',
          url: `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
          icon: 'navigation-2',
          color: 'bg-blue-400 hover:bg-blue-500'
        },
        {
          id: 'uber',
          name: 'Uber',
          url: `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}`,
          icon: 'car',
          color: 'bg-black hover:bg-gray-800'
        }
      ]
    };
    
    return links[osType] || links.Other;
  };

  const navigationLinks = coordinates ? generateLinks(coordinates) : [];

  const openNavigation = (link: NavigationLink) => {
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Try to open the app-specific URL first
    if (osType !== 'Other') {
      const fallbackTimeout = setTimeout(() => {
        // If the app didn't open after 2 seconds, open web version
        const webLink = generateWebFallback(coordinates!);
        window.open(webLink, '_blank');
      }, 2000);

      // Try to open the app
      window.location.href = link.url;
      
      // Clear timeout if page changes (app opened)
      window.addEventListener('blur', () => {
        clearTimeout(fallbackTimeout);
      });
    } else {
      // Desktop: open in new tab
      window.open(link.url, '_blank');
    }
  };

  const generateWebFallback = (coords: Coordinates): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
  };

  return {
    osType,
    navigationLinks,
    openNavigation
  };
};