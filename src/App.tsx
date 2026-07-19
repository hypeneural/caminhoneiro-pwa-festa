import React, { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { ErrorBoundary } from "react-error-boundary";
import { DefaultErrorFallback } from "./components/ui/error-boundary";

const Index = lazy(() => import("./pages/Index"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Stories = lazy(() => import("./pages/Stories"));
const Map = lazy(() => import("./pages/Map"));
const Schedule = lazy(() => import("./pages/Schedule"));
const More = lazy(() => import("./pages/More"));
const Historia = lazy(() => import("./pages/Historia"));
const Podcast = lazy(() => import("./pages/Podcast"));
const RotaCompleta = lazy(() => import("./pages/RotaCompleta"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const SaoCristovao = lazy(() => import("./pages/SaoCristovao"));
const Menu = lazy(() => import("./pages/Menu"));
const Apoio = lazy(() => import("./pages/Apoio"));
const VoceSabia = lazy(() => import("./pages/VoceSabia"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LazyPWAInstaller = lazy(() =>
  import("@/components/PWAInstaller").then((module) => ({ default: module.PWAInstaller }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error && "status" in error && typeof error.status === "number") {
          return error.status >= 500 && failureCount < 2;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
  },
});

const AppRouteFallback = () => (
  <div className="flex min-h-dvh items-center justify-center bg-background px-6">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-sm font-medium text-muted-foreground">Abrindo...</p>
    </div>
  </div>
);

const DeferredPWAInstaller = () => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const scheduleInstaller = () => setShouldRender(true);
    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);

    if (requestIdle && cancelIdle) {
      const idleId = requestIdle(scheduleInstaller, { timeout: 2500 });
      return () => cancelIdle(idleId);
    }

    const timeoutId = window.setTimeout(scheduleInstaller, 1800);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!shouldRender) return null;

  return (
    <Suspense fallback={null}>
      <LazyPWAInstaller />
    </Suspense>
  );
};

const App = () => {
  useEffect(() => {
    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);
    const initializeApp = () => {
      import("@/services/app-shell")
        .then(({ appShell }) => appShell.initialize())
        .catch((error) => {
          console.error("App initialization failed:", error);
        });
    };

    let idleCleanup: () => void;

    if (requestIdle && cancelIdle) {
      const idleId = requestIdle(initializeApp, { timeout: 2000 });
      idleCleanup = () => cancelIdle(idleId);
    } else {
      const timeoutId = window.setTimeout(initializeApp, 900);
      idleCleanup = () => window.clearTimeout(timeoutId);
    }

    const handleOnline = () => {
      import("@/services/advanced-cache")
        .then(({ cacheManager }) => cacheManager.processSyncQueue())
        .catch(() => undefined);
    };
    const handleOffline = () => undefined;

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      idleCleanup();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={DefaultErrorFallback}
      onError={(error, errorInfo) => {
        console.error("App Error:", error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DeferredPWAInstaller />
            <Suspense fallback={<AppRouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/galeria" element={<Gallery />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/mapa" element={<Map />} />
                <Route path="/programacao" element={<Schedule />} />
                <Route path="/historia" element={<Historia />} />
                <Route path="/podcast" element={<Podcast />} />
                <Route path="/rota-completa" element={<RotaCompleta />} />
                <Route path="/rota" element={<RotaCompleta />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/sao-cristovao" element={<SaoCristovao />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/mais" element={<More />} />
                <Route path="/apoio" element={<Apoio />} />
                <Route path="/vocesabia" element={<VoceSabia />} />
                <Route path="*" element={<NotFound />} />
                <Route path={'/galeria/:sponsorSlug'} element={<Gallery />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
