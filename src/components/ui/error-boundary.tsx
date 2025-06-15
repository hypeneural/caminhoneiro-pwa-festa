import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  componentStack?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          componentStack={this.state.errorInfo?.componentStack}
        />
      );
    }

    return this.props.children;
  }
}

export function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Oops! Algo deu errado
          </h2>
          <p className="text-muted-foreground text-sm">
            Ocorreu um erro inesperado. Nossa equipe foi notificada.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="text-left bg-muted p-3 rounded-md">
            <p className="text-xs font-mono text-destructive">
              {error.name}: {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={resetError}
            className="flex-1"
            aria-label="Tentar novamente"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex-1"
            aria-label="Voltar ao início"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir ao Início
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Specialized error fallbacks for different contexts
export function CarouselErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="p-4 text-center space-y-3">
      <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">
          Erro ao carregar conteúdo
        </p>
        <p className="text-xs text-muted-foreground">
          Não foi possível carregar os itens
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={resetError}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  );
}

export function TrackerErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="px-4 py-6">
      <Card className="p-6 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-medium text-foreground">
            Erro no Rastreamento
          </h3>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os dados de localização
          </p>
        </div>
        <Button onClick={resetError} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </Card>
    </div>
  );
}