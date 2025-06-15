import { motion } from "framer-motion";
import { 
  Phone, 
  MessageCircle, 
  Clock, 
  MapPin, 
  X,
  Calendar,
  Heart,
  Sparkles
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface ContatoIgrejaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getCurrentTime = () => new Date();

const isParoquiaAberta = () => {
  const now = getCurrentTime();
  const day = now.getDay(); // 0 = domingo, 1 = segunda, etc.
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;
  
  // Segunda a sexta: 8h às 12h e 13:30 às 17:30
  if (day >= 1 && day <= 5) {
    return (currentTime >= 8 * 60 && currentTime < 12 * 60) || 
           (currentTime >= 13.5 * 60 && currentTime < 17.5 * 60);
  }
  
  return false; // Fechado nos fins de semana
};

const getProximoHorario = () => {
  const now = getCurrentTime();
  const day = now.getDay();
  const hour = now.getHours();
  
  if (day >= 1 && day <= 5) {
    if (hour < 8) return "Abre hoje às 08:00";
    if (hour >= 8 && hour < 12) return "Fecha às 12:00";
    if (hour >= 12 && hour < 13.5) return "Reabre às 13:30";
    if (hour >= 13.5 && hour < 17.5) return "Fecha às 17:30";
  }
  
  // Se for fim de semana ou fora do horário
  const diasParaSegunda = day === 0 ? 1 : (7 - day + 1);
  return day === 6 || day === 0 ? "Abre segunda às 08:00" : "Abre segunda às 08:00";
};

export function ContatoIgrejaModal({ open, onOpenChange }: ContatoIgrejaModalProps) {
  const [isAberta, setIsAberta] = useState(false);
  const [proximoHorario, setProximoHorario] = useState("");

  useEffect(() => {
    const updateStatus = () => {
      setIsAberta(isParoquiaAberta());
      setProximoHorario(getProximoHorario());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Olá! Gostaria de informações sobre a Festa do Divino Espírito Santo em Tijucas.");
    const whatsappUrl = `https://wa.me/5548999999999?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const handleCallClick = () => {
    window.location.href = "tel:+554833334444";
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
  };

  const handleMapClick = () => {
    const address = "Rua Coronel Lara Ribas, 123, Tijucas, SC";
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe max-h-[90vh]">
        <DrawerHeader className="text-center pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-trucker-blue to-trucker-blue/80 rounded-xl flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Phone className="w-6 h-6 text-white" />
              </motion.div>
              <div className="text-left">
                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-trucker-blue to-trucker-blue/80 bg-clip-text text-transparent">
                  Contato da Igreja
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Paróquia São Sebastião - Tijucas/SC
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-6 overflow-y-auto">
          {/* Status da Paróquia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-gradient-to-br from-background to-muted/20 border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-trucker-blue" />
                  <div>
                    <p className="font-semibold text-card-foreground">Status atual</p>
                    <p className="text-sm text-muted-foreground">{proximoHorario}</p>
                  </div>
                </div>
                <Badge 
                  variant={isAberta ? "default" : "secondary"}
                  className={`${isAberta 
                    ? "bg-emerald-500 text-white animate-pulse" 
                    : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isAberta ? "ABERTO" : "FECHADO"}
                </Badge>
              </div>
            </Card>
          </motion.div>

          {/* Horários de Funcionamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">Horário de Atendimento</h3>
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Segunda à Sexta</span>
                <span className="font-medium text-card-foreground">08:00 - 12:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground"></span>
                <span className="font-medium text-card-foreground">13:30 - 17:30</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Fins de semana</span>
                <span className="font-medium text-amber-600">Fechado</span>
              </div>
            </Card>
          </motion.div>

          {/* Botões de Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">Entre em Contato</h3>
            <div className="grid grid-cols-1 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleWhatsAppClick}
                  className="w-full h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Falar pelo WhatsApp</div>
                      <div className="text-xs opacity-90">Resposta mais rápida</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleCallClick}
                  className="w-full h-16 bg-gradient-to-r from-trucker-blue to-trucker-blue/80 hover:from-trucker-blue/90 hover:to-trucker-blue text-white shadow-lg"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Ligar Agora</div>
                      <div className="text-xs opacity-90">(48) 3333-4444</div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Localização */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">Localização</h3>
            <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleMapClick}>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-trucker-red" />
                <div>
                  <p className="font-medium text-card-foreground">Igreja São Sebastião</p>
                  <p className="text-sm text-muted-foreground">Rua Coronel Lara Ribas, 123</p>
                  <p className="text-sm text-muted-foreground">Centro - Tijucas/SC</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Informações sobre a Festa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-4 bg-gradient-to-br from-trucker-orange/10 to-trucker-yellow/10 border-trucker-orange/20">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-trucker-orange" />
                <h4 className="font-semibold text-card-foreground">Festa do Divino 2025</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Entre em contato para mais informações sobre a programação, missas especiais e eventos da festa.
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-trucker-blue" />
                <span className="text-sm font-medium text-trucker-blue">19 e 20 de Julho • Tijucas/SC</span>
              </div>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center pt-4 border-t border-border/30"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-trucker-red" />
              <p className="text-sm font-medium text-card-foreground">Bem-vindos à nossa comunidade</p>
            </div>
            <p className="text-xs text-muted-foreground">
              "Vinde Espírito Santo, enchei os corações dos vossos fiéis"
            </p>
          </motion.div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}