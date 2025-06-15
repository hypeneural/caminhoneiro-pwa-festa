import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Navigation, Navigation2, Car, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigationLinks, type Coordinates } from '@/hooks/useNavigationLinks';
import { useToast } from '@/hooks/use-toast';

interface NavigationActionsProps {
  coordinates: Coordinates;
  children?: React.ReactNode;
  address?: string;
  title?: string;
}

const iconMap = {
  map: Map,
  navigation: Navigation,
  'navigation-2': Navigation2,
  car: Car,
};

export const NavigationActions: React.FC<NavigationActionsProps> = ({
  coordinates,
  children,
  address,
  title = "Escolha o app de navegação"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { navigationLinks, openNavigation, osType } = useNavigationLinks(coordinates);
  const { toast } = useToast();

  const handleNavigationClick = (link: any) => {
    try {
      openNavigation(link);
      setIsOpen(false);
      
      toast({
        title: "🗺️ Abrindo navegação",
        description: `Direcionando para ${link.name}...`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível abrir o aplicativo de navegação.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full">
            <Navigation className="w-4 h-4 mr-2" />
            Ver Rota
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-trucker-blue" />
            {title}
          </DialogTitle>
          {address && (
            <p className="text-sm text-muted-foreground mt-2">
              📍 {address}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* OS Detection Info */}
          <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded-lg">
            Detectado: {osType === 'iOS' ? '📱 iOS' : osType === 'Android' ? '🤖 Android' : '💻 Desktop'}
          </div>

          {/* Navigation Apps Grid */}
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {navigationLinks.map((link, index) => {
                const IconComponent = iconMap[link.icon as keyof typeof iconMap] || Map;
                
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-14 flex items-center justify-start gap-4 p-4 hover:bg-accent/50 transition-all duration-200"
                        onClick={() => handleNavigationClick(link)}
                      >
                        <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-foreground">{link.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {osType === 'Other' ? 'Abrir no navegador' : 'Abrir aplicativo'}
                          </span>
                        </div>
                      </Button>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Fallback Web Option */}
          {osType !== 'Other' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="pt-3 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
                    window.open(webUrl, '_blank');
                    setIsOpen(false);
                  }}
                >
                  <Map className="w-4 h-4 mr-2" />
                  Abrir no Google Maps (Web)
                </Button>
              </div>
            </motion.div>
          )}

          {/* Coordinates Info */}
          <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
            📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};