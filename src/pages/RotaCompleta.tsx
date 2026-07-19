import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTraccarData } from '@/hooks/useTraccarData';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { TrackerSkeleton } from '@/components/tracker/TrackerSkeleton';
import { TrackerError } from '@/components/tracker/TrackerError';
import { TrackerDisabledState } from '@/components/tracker/TrackerDisabledState';
import { BannerCarousel } from '@/components/sponsors/BannerCarousel';
import { useAdvertisements } from '@/hooks/useAdvertisements';

const FullRouteMap = lazy(() => import('@/components/map/FullRouteMap'));

const RotaCompleta: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isTrackerEnabled } = useTraccarData();
  const { banners } = useAdvertisements({ position: 'home' });

  if (!isTrackerEnabled) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden bg-background">
        <div className="flex-none bg-background/92 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl border-b px-4 pb-4 pt-safe">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <MapPin className="w-5 h-5 text-trucker-blue" />
            <h1 className="text-lg font-bold">Rota da Procissao</h1>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto pb-app-nav">
          <TrackerDisabledState />
        </main>

        <BottomNavigation />
      </div>
    );
  }

  if (isLoading) {
    return <TrackerSkeleton />;
  }

  if (isError || !data) {
    return <TrackerError onRetry={() => refetch()} />;
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-none bg-background/92 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl border-b px-4 pb-4 pt-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <MapPin className="w-5 h-5 text-trucker-blue" />
          <h1 className="text-lg font-bold">Rota Completa da Procissão</h1>
        </div>
      </div>

      {/* Banner de Anúncios */}
      {banners.length > 0 && (
        <div className="flex-none px-4 py-2 bg-muted/20">
          <BannerCarousel
            banners={banners}
            showControls={true}
            showDots={true}
            className="rounded-lg shadow-md"
            autoplayDelay={5000}
            compact={true}
          />
        </div>
      )}

      {/* Mapa em tela cheia */}
      <div className="flex-1 min-h-0 relative">
        <div className="w-full h-full">
          <Suspense fallback={<TrackerSkeleton />}>
            <FullRouteMap
              data={data}
              height="h-full"
            />
          </Suspense>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default RotaCompleta;
