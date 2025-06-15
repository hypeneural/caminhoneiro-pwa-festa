import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Map from "./pages/Map";
import Schedule from "./pages/Schedule";
import More from "./pages/More";
import Radio from "./pages/Radio";
import Videos from "./pages/Videos";
import Historia from "./pages/Historia";
import Noticias from "./pages/Noticias";
import RotaCompleta from "./pages/RotaCompleta";
import NotFound from "./pages/NotFound";
import { OfflineFallback } from "./components/OfflineFallback";
import { ErrorBoundary } from "react-error-boundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <ErrorBoundary FallbackComponent={OfflineFallback}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/mapa" element={<Map />} />
              <Route path="/programacao" element={<Schedule />} />
              <Route path="/radio" element={<Radio />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/historia" element={<Historia />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/rota-completa" element={<RotaCompleta />} />
              <Route path="/mais" element={<More />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
