import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MapErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export function MapErrorFallback({ error, resetError }: MapErrorFallbackProps) {
  console.error('[MapErrorBoundary] Map error caught:', error);
  
  const handleReset = () => {
    console.log('[MapErrorBoundary] Resetting map error');
    resetError?.();
  };

  const handleReload = () => {
    console.log('[MapErrorBoundary] Reloading page');
    window.location.reload();
  };

  return (
    <div className="w-full h-[50vh] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
      <Card className="max-w-sm w-full mx-4 p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">
            Erro no Mapa
          </h3>
          <p className="text-muted-foreground text-sm">
            Não foi possível carregar o mapa. Verifique sua conexão e tente novamente.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="text-left bg-muted p-3 rounded-md">
            <p className="text-xs font-mono text-destructive break-words">
              {error.name}: {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button
            onClick={handleReload}
            className="flex-1"
            size="sm"
          >
            Recarregar Página
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface MapErrorBoundaryProps {
  children: React.ReactNode;
}

export function MapErrorBoundary({ children }: MapErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={MapErrorFallback}
      onError={(error, errorInfo) => {
        console.error('[MapErrorBoundary] Error caught:', error);
        console.error('[MapErrorBoundary] Error info:', errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}