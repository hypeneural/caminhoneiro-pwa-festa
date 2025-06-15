import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Palette, Volume2, Download, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-trucker-blue text-trucker-blue-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold">Configurações</h1>
        </div>
        <p className="text-sm opacity-90">
          Personalize sua experiência no app
        </p>
      </div>

      {/* Settings Options */}
      <div className="p-4 space-y-6">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-trucker-blue" />
              <h2 className="font-medium text-foreground">Notificações</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Notificações Push</p>
                  <p className="text-xs text-muted-foreground">Receba atualizações importantes</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Programação</p>
                  <p className="text-xs text-muted-foreground">Lembretes de eventos</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Notícias</p>
                  <p className="text-xs text-muted-foreground">Últimas atualizações</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-trucker-green" />
              <h2 className="font-medium text-foreground">Aparência</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Modo Escuro</p>
                  <p className="text-xs text-muted-foreground">Tema escuro automático</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Animações</p>
                  <p className="text-xs text-muted-foreground">Efeitos visuais</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Audio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-trucker-orange" />
              <h2 className="font-medium text-foreground">Áudio</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-play Vídeos</p>
                  <p className="text-xs text-muted-foreground">Reproduzir automaticamente</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Som dos Stories</p>
                  <p className="text-xs text-muted-foreground">Áudio por padrão</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Storage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-5 h-5 text-trucker-red" />
              <h2 className="font-medium text-foreground">Armazenamento</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Cache de Imagens</p>
                  <p className="text-xs text-muted-foreground">Salvar para acesso offline</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Limpar Cache</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Libere espaço removendo arquivos temporários
                </p>
                <Button variant="outline" size="sm">
                  Limpar Cache (2.3 MB)
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-purple-600" />
              <h2 className="font-medium text-foreground">Privacidade</h2>
            </div>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Política de Privacidade
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Termos de Uso
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Sobre o App
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Version */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <Card className="p-4 bg-muted/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Festa do Caminhoneiro PWA
              </p>
              <p className="text-xs text-muted-foreground">
                Versão 1.0.0 - Desenvolvido com ❤️
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}