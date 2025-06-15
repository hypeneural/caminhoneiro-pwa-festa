import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';

export const PWAPrompt = () => {
  const { 
    isInstallable, 
    isOffline, 
    needRefresh, 
    updateServiceWorker, 
    installPWA 
  } = usePWA();
  const { toast } = useToast();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInstallable && !dismissed) {
      // Mostrar prompt de instalação após 30 segundos
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed]);

  useEffect(() => {
    if (isOffline) {
      toast({
        title: "Modo Offline",
        description: "Você está navegando offline. Algumas funcionalidades podem estar limitadas.",
        variant: "destructive",
      });
    }
  }, [isOffline, toast]);

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: "Atualização Disponível",
        description: "Nova versão do app disponível!",
        action: (
          <Button size="sm" onClick={() => updateServiceWorker()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker, toast]);

  const handleInstall = async () => {
    try {
      await installPWA();
      setShowInstallPrompt(false);
      toast({
        title: "App Instalado!",
        description: "O Festa do Caminhoneiro foi instalado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na Instalação",
        description: "Não foi possível instalar o app. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <>
      {/* Status de Conectividade */}
      <div className="fixed top-16 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          {isOffline ? (
            <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm">
              <WifiOff className="h-4 w-4" />
              Offline
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-success text-success-foreground px-3 py-1 rounded-full text-sm">
              <Wifi className="h-4 w-4" />
              Online
            </div>
          )}
        </motion.div>
      </div>

      {/* Prompt de Instalação */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <Card className="p-4 bg-card/95 backdrop-blur-sm border-primary/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground">
                    Instalar App
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Instale o app para acesso rápido e notificações da festa!
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={handleInstall}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Instalar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleDismiss}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};