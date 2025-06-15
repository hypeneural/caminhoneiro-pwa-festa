import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { usePWAManager } from '@/hooks/usePWAManager';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useToast } from '@/hooks/use-toast';

export const PWAInstaller = () => {
  const pwa = usePWAManager();
  const deviceInfo = useDeviceDetection();
  const { toast } = useToast();
  const [isInstalling, setIsInstalling] = useState(false);

  // Track user engagement
  useEffect(() => {
    const handleScroll = () => pwa.incrementEngagement();
    const handleClick = () => pwa.incrementEngagement();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
    };
  }, [pwa]);

  // Early returns for conditions where we shouldn't show installer
  if (pwa.isInstalled || !pwa.isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      pwa.showIOSModal();
      return;
    }

    if (pwa.canPromptInstall) {
      setIsInstalling(true);
      try {
        await pwa.installPWA();
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
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <>
      {/* Floating Install Button */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-24 right-4 z-40"
        >
          <TouchFeedback scale={0.9}>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-trucker-blue to-trucker-red shadow-lg hover:shadow-xl transition-all duration-300 group"
              size="icon"
            >
              <motion.div
                animate={isInstalling ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: isInstalling ? Infinity : 0, ease: "linear" }}
              >
                <Download className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </motion.div>
            </Button>
          </TouchFeedback>
          
          {/* Pulse animation around button */}
          <motion.div
            className="absolute inset-0 rounded-full bg-trucker-blue opacity-20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Offline Status Indicator */}
      {pwa.isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 right-4 z-50"
        >
          <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm">
            <WifiOff className="h-4 w-4" />
            Offline
          </div>
        </motion.div>
      )}

      {/* Update Available Banner */}
      {pwa.needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 left-4 right-4 z-50"
        >
          <Card className="p-4 bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold">Atualização Disponível</h3>
                <p className="text-sm text-muted-foreground">Nova versão do app disponível!</p>
              </div>
              <Button size="sm" onClick={pwa.updateServiceWorker}>
                Atualizar
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* iOS Installation Instructions Modal */}
      <Dialog open={pwa.showIOSInstructions} onOpenChange={pwa.hideIOSModal}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center">
              <Smartphone className="h-5 w-5 text-trucker-blue" />
              Instalar App no iPhone
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Para adicionar este app à sua tela inicial:
              </p>
              {deviceInfo.iosVersion && (
                <p className="text-xs text-muted-foreground mt-1">
                  iOS {deviceInfo.iosVersion} • Safari {deviceInfo.safariVersion}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-trucker-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Toque no botão</span>
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <Share className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm">no Safari</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-trucker-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Escolha</span>
                  <div className="flex items-center gap-1 px-2 py-1 bg-background rounded border">
                    <Plus className="h-3 w-3" />
                    <span className="text-xs">Adicionar à Tela de Início</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-trucker-green text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-sm">Confirme tocando em <strong>"Adicionar"</strong></span>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-trucker-yellow/10 border border-trucker-yellow/20 rounded-lg p-3"
            >
              <p className="text-xs text-muted-foreground text-center">
                💡 <strong>Dica:</strong> O app aparecerá na sua tela inicial como um app nativo!
              </p>
            </motion.div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pwa.dismissForever}
                className="flex-1"
              >
                Não mostrar novamente
              </Button>
              <Button
                onClick={pwa.hideIOSModal}
                size="sm"
                className="flex-1"
              >
                Entendi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Install Prompt Card for Android */}
      {pwa.showInstallPrompt && deviceInfo.platform === 'android' && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 z-30"
        >
          <Card className="p-4 bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-trucker-blue to-trucker-red rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-card-foreground">
                  Instalar App
                </h3>
                <p className="text-sm text-muted-foreground">
                  Acesso rápido e notificações da festa!
                </p>
                <p className="text-xs text-muted-foreground">
                  Tentativas: {pwa.installationAttempts}/3 • Engajamento: {pwa.userEngagement}
                </p>
              </div>
              
              <div className="flex gap-2">
                <TouchFeedback>
                  <Button 
                    size="sm" 
                    onClick={handleInstall}
                    disabled={isInstalling}
                  >
                    {isInstalling ? 'Instalando...' : 'Instalar'}
                  </Button>
                </TouchFeedback>
                <TouchFeedback>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={pwa.dismissTemporary}
                  >
                    Mais tarde
                  </Button>
                </TouchFeedback>
                <TouchFeedback>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={pwa.dismissForever}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TouchFeedback>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Debug Panel for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <div>Platform: {deviceInfo.platform}</div>
          <div>iOS: {deviceInfo.isIOS ? 'Yes' : 'No'} {deviceInfo.iosVersion && `v${deviceInfo.iosVersion}`}</div>
          <div>Safari: {deviceInfo.isSafari ? 'Yes' : 'No'} {deviceInfo.safariVersion && `v${deviceInfo.safariVersion}`}</div>
          <div>Standalone: {deviceInfo.isStandalone ? 'Yes' : 'No'}</div>
          <div>In-App: {deviceInfo.isInAppBrowser ? 'Yes' : 'No'}</div>
          <div>Can Prompt: {deviceInfo.canShowInstallPrompt ? 'Yes' : 'No'}</div>
          <div>PWA Installable: {pwa.isInstallable ? 'Yes' : 'No'}</div>
          <div>PWA Installed: {pwa.isInstalled ? 'Yes' : 'No'}</div>
          <div>Show Prompt: {pwa.showInstallPrompt ? 'Yes' : 'No'}</div>
          <div>Engagement: {pwa.userEngagement}</div>
          <div>Attempts: {pwa.installationAttempts}</div>
          <Button size="sm" onClick={pwa.resetPrompts} className="mt-2">Reset PWA</Button>
        </div>
      )}
    </>
  );
};