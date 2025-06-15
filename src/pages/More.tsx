import { motion } from "framer-motion";
import { Menu, Settings, Info, Phone, Share2, Download, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const More = () => {
  const menuItems = [
    {
      icon: Bell,
      title: "Notificações",
      description: "Gerencie suas notificações",
      hasSwitch: true,
      color: "text-trucker-blue"
    },
    {
      icon: Download,
      title: "Download Offline",
      description: "Baixar conteúdo para uso offline",
      hasSwitch: true,
      color: "text-trucker-green"
    },
    {
      icon: Share2,
      title: "Compartilhar App",
      description: "Convide amigos para usar o app",
      color: "text-trucker-red"
    },
    {
      icon: Info,
      title: "Sobre a Festa",
      description: "História e informações do evento",
      color: "text-trucker-yellow"
    },
    {
      icon: Phone,
      title: "Contato",
      description: "Fale com a organização",
      color: "text-trucker-orange"
    },
    {
      icon: Settings,
      title: "Configurações",
      description: "Preferências do aplicativo",
      color: "text-muted-foreground"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border/50 px-4 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <Menu className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Mais</h1>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-16 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="py-4 space-y-4"
        >
          {/* App Info Card */}
          <Card className="p-6 bg-gradient-to-r from-trucker-blue/10 to-trucker-red/10">
            <div className="text-center">
              <div className="w-16 h-16 bg-trucker-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Menu className="w-8 h-8 text-trucker-blue-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Festa do Caminhoneiro</h2>
              <p className="text-sm text-muted-foreground mb-4">
                São Cristóvão 2025 • Tijucas/SC
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>Versão 1.0.0</span>
                <span>•</span>
                <span>19-20 Julho</span>
              </div>
            </div>
          </Card>

          {/* Menu Items */}
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-card-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    {item.hasSwitch ? (
                      <Switch />
                    ) : (
                      <Button variant="ghost" size="sm">
                        <span className="sr-only">Abrir {item.title}</span>
                        →
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center pt-6"
          >
            <p className="text-xs text-muted-foreground mb-2">
              Desenvolvido com ❤️ para a comunidade caminhoneira
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 Festa do Caminhoneiro - Tijucas/SC
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default More;