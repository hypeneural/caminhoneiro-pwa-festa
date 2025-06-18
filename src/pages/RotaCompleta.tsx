import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTraccarData } from '@/hooks/useTraccarData';
import FullRouteMap from '@/components/map/FullRouteMap';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { TrackerSkeleton } from '@/components/tracker/TrackerSkeleton';
import { TrackerError } from '@/components/tracker/TrackerError';

const RotaCompleta: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTraccarData();

  if (isLoading) {
    return <TrackerSkeleton />;
  }

  if (isError || !data) {
    return <TrackerError onRetry={() => refetch()} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-4">
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

      {/* Mapa em tela cheia */}
      <div className="h-[calc(100vh-80px)]">
        <div className="relative w-full h-full">
          <FullRouteMap 
            data={data} 
            height="h-full"
          />
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default RotaCompleta;