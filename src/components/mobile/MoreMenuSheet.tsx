import { motion } from "framer-motion";
import { 
  Camera, 
  Map, 
  Calendar, 
  Radio, 
  Sparkles, 
  Bell,
  Download,
  Share2,
  Info,
  Phone,
  Settings,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface MoreMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = {
  navegacao: [
    { icon: Camera, label: "Galeria", route: "/galeria", color: "text-trucker-blue" },
    { icon: Map, label: "Mapa em Tempo Real", route: "/mapa", color: "text-trucker-green" },
    { icon: Calendar, label: "Programação", route: "/programacao", color: "text-trucker-yellow" },
  ],
  funcionalidades: [
    { icon: Radio, label: "Rádio Ao Vivo", route: "/radio", color: "text-trucker-red" },
    { icon: Sparkles, label: "Stories", route: "/stories", color: "text-trucker-orange" },
    { icon: Bell, label: "Notificações", hasSwitch: true, color: "text-trucker-blue" },
    { icon: Download, label: "Download Offline", hasSwitch: true, color: "text-trucker-green" },
  ],
  app: [
    { icon: Share2, label: "Compartilhar App", route: "/share", color: "text-trucker-red" },
    { icon: Info, label: "Sobre a Festa", route: "/about", color: "text-trucker-yellow" },
    { icon: Phone, label: "Contato", route: "/contact", color: "text-trucker-orange" },
    { icon: Settings, label: "Configurações", route: "/settings", color: "text-muted-foreground" },
  ]
};

export function MoreMenuSheet({ open, onOpenChange }: MoreMenuSheetProps) {
  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe max-h-[85vh]">
        <DrawerHeader className="text-center pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-trucker-blue-foreground" />
              </div>
              <div className="text-left">
                <DrawerTitle className="text-lg font-bold">Mais Opções</DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Explore todas as funcionalidades
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

        <div className="px-4 pb-6 overflow-y-auto">
          {/* Navegação Principal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
              Navegação
            </h3>
            <div className="space-y-2">
              {menuItems.navegacao.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    to={item.route}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors active:scale-95"
                  >
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="font-medium text-card-foreground">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Funcionalidades */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
              Funcionalidades
            </h3>
            <div className="space-y-2">
              {menuItems.funcionalidades.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="font-medium text-card-foreground flex-1">{item.label}</span>
                  {item.hasSwitch ? (
                    <Switch />
                  ) : item.route ? (
                    <Link to={item.route} onClick={handleLinkClick}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        →
                      </Button>
                    </Link>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Configurações do App */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
              Aplicativo
            </h3>
            <div className="space-y-2">
              {menuItems.app.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Link
                    to={item.route}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors active:scale-95"
                  >
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="font-medium text-card-foreground">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center pt-6 border-t border-border/50 mt-6"
          >
            <p className="text-xs text-muted-foreground mb-1">
              Festa do Caminhoneiro - São Cristóvão 2025
            </p>
            <p className="text-xs text-muted-foreground">
              Tijucas/SC • 19-20 de Julho
            </p>
          </motion.div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}