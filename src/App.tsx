
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { appShell } from "@/services/app-shell";
import { cacheManager } from "@/services/advanced-cache";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Stories from "./pages/Stories";
import Map from "./pages/Map";
import Schedule from "./pages/Schedule";
import More from "./pages/More";
import Radio from "./pages/Radio";
import Videos from "./pages/Videos";
import Historia from "./pages/Historia";
import Noticias from "./pages/Noticias";
import Podcast from "./pages/Podcast";
import RotaCompleta from "./pages/RotaCompleta";
import Cameras from "./pages/Cameras";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";
import FAQ from "./pages/FAQ";
import SaoCristovao from "./pages/SaoCristovao";
import Menu from "./pages/Menu";
import Apoio from "./pages/Apoio";
import NotFound from "./pages/NotFound";
import { OfflineFallback } from "./components/OfflineFallback";
import { ErrorBoundary } from "react-error-boundary";
import { DefaultErrorFallback } from "./components/ui/error-boundary";
import { PWAInstaller } from "@/components/PWAInstaller";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && 'status' in error && typeof error.status === 'number') {
          return error.status >= 500 && failureCount < 2;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    }
  }
});

const App = () => {
  useEffect(() => {
    // Initialize App Shell and advanced caching
    const initializeApp = async () => {
      await appShell.initialize();
      
      // Process any queued background syncs
      const isOnline = navigator.onLine;
      if (isOnline) {
        await cacheManager.processSyncQueue();
      }

      // Monitor storage quota
      cacheManager.checkStorageQuota();
    };

    initializeApp();

    // Setup online/offline handlers
    const handleOnline = () => cacheManager.processSyncQueue();
    const handleOffline = () => console.log('📴 App went offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <ErrorBoundary 
        FallbackComponent={DefaultErrorFallback}
        onError={(error, errorInfo) => {
          console.error('App Error:', error, errorInfo);
        }}
      >
        <Toaster />
        <Sonner />
        <PWAInstaller />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/mapa" element={<Map />} />
          <Route path="/programacao" element={<Schedule />} />
          <Route path="/radio" element={<Radio />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/historia" element={<Historia />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="/rota-completa" element={<RotaCompleta />} />
          <Route path="/rota" element={<RotaCompleta />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/sao-cristovao" element={<SaoCristovao />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/mais" element={<More />} />
          <Route path="/apoio" element={<Apoio />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
};

export default App;
