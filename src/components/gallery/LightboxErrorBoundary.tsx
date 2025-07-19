import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LightboxErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Lightbox Error:', error);
    console.error('Error Info:', errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleClose = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onClose?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">
              Erro na Galeria
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6">
              Ocorreu um erro inesperado ao exibir a imagem. 
              Tente novamente ou feche a galeria.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
              
              <button
                onClick={this.handleClose}
                className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Detalhes do erro (dev)
                </summary>
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LightboxErrorBoundary; 