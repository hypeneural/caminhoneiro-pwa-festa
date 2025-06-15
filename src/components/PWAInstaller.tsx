import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { usePWAInstaller } from '@/hooks/usePWAInstaller';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useToast } from '@/hooks/use-toast';

export const PWAInstaller = () => {
  const { 
    isInstallable, 
    isInstalled, 
    showIOSInstructions, 
    canPromptInstall,
    installPWA, 
    showIOSModal, 
    hideIOSModal, 
    dismissForever 
  } = usePWAInstaller();
  
  const deviceInfo = useDeviceDetection();
  const { toast } = useToast();
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return null; // Don't show anything if already installed
  }

  const handleInstall = async () => {
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      showIOSModal();
      return;
    }

    if (canPromptInstall) {
      setIsInstalling(true);
      try {
        await installPWA();
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

  if (!isInstallable) {
    return null;
  }

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

      {/* iOS Installation Instructions Modal */}
      <Dialog open={showIOSInstructions} onOpenChange={hideIOSModal}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center">
              <Smartphone className="h-5 w-5 text-trucker-blue" />
              Instalar App no iPhone
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Para adicionar este app à sua tela inicial:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
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
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
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
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-trucker-green text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-sm">Confirme tocando em <strong>"Adicionar"</strong></span>
              </div>
            </div>
            
            <div className="bg-trucker-yellow/10 border border-trucker-yellow/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground text-center">
                💡 <strong>Dica:</strong> O app aparecerá na sua tela inicial como um app nativo!
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={dismissForever}
                className="flex-1"
              >
                Não mostrar novamente
              </Button>
              <Button
                onClick={hideIOSModal}
                size="sm"
                className="flex-1"
              >
                Entendi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Install Prompt Card (Alternative display) */}
      {deviceInfo.platform === 'android' && canPromptInstall && (
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
                    onClick={dismissForever}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TouchFeedback>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </>
  );
};