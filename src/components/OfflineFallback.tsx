import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const OfflineFallback = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    // Use window.location instead of useNavigate since this might be outside Router context
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Você está offline
          </h1>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Parece que você perdeu a conexão com a internet. 
            Verifique sua conexão e tente novamente.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh} 
              className="w-full"
              size="lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              onClick={handleGoHome} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <Home className="h-5 w-5 mr-2" />
              Ir para Início
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Algumas partes do app funcionam offline. 
              Volte à página inicial para acessar o conteúdo salvo.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};