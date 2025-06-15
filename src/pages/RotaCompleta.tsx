import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTraccarData } from '@/hooks/useTraccarData';
import TruckerMap from '@/components/tracker/TruckerMap';

const RotaCompleta = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useTraccarData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-bold mb-2">Rota Indisponível</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados da rota.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Card>
      </div>
    );
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
          <div style={{ height: 'calc(100vh - 80px)' }}>
            <TruckerMap data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RotaCompleta;