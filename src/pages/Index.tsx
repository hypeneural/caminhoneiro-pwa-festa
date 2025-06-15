import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { Stories } from "@/components/mobile/Stories";
import { SaoCristovaoTracker } from "@/components/mobile/SaoCristovaoTracker";
import { CountdownTimer } from "@/components/mobile/CountdownTimer";
import { NewsCarousel } from "@/components/mobile/NewsCarousel";
import { PhotoCarousel } from "@/components/mobile/PhotoCarousel";
import { QuickAccess } from "@/components/mobile/QuickAccess";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { PWAInstaller } from "@/components/PWAInstaller";
import { ProgramPreview } from "@/components/mobile/ProgramPreview";
import { usePrefetch } from "@/hooks/usePrefetch";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useMemoryManager } from "@/hooks/useMemoryManager";
import { useEffect } from "react";

const Index = () => {
  const { recordVisit, prefetchPredicted } = usePrefetch();
  const { metrics, isViolatingBudget } = usePerformanceMonitor('IndexPage');
  const { stats } = useMemoryManager();

  // Record page visit and prefetch predicted routes
  useEffect(() => {
    recordVisit('/');
    
    // Prefetch likely next routes after a delay
    const timer = setTimeout(() => {
      prefetchPredicted();
    }, 2000);

    return () => clearTimeout(timer);
  }, [recordVisit, prefetchPredicted]);


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Main content with proper spacing for fixed elements */}
      <main className="pt-16 pb-20">
        {/* Stories Section - First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stories />
        </motion.div>

        {/* Countdown Timer - Second */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CountdownTimer />
        </motion.div>

        {/* Program Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ProgramPreview />
        </motion.div>

        {/* São Cristóvão Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SaoCristovaoTracker />
        </motion.div>

        {/* News Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <NewsCarousel />
        </motion.div>

        {/* Photo Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <PhotoCarousel />
        </motion.div>

        {/* Quick Access Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <QuickAccess />
        </motion.div>

        {/* Bottom spacing for safe area */}
        <div className="h-8" />
      </main>

      {/* Fixed Navigation Elements */}
      <BottomNavigation />
      
      {/* PWA Features */}
      <PWAInstaller />

      {/* Performance Debug Panel (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-24 right-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <div>FPS: {metrics?.currentFPS?.toFixed(1) || 'N/A'}</div>
          <div>Memory: {((stats?.usedHeapSize || 0) / 1024 / 1024).toFixed(1)}MB</div>
          {isViolatingBudget && <div className="text-red-400">⚠️ Budget Violation</div>}
        </div>
      )}
    </div>
  );
};

export default Index;
