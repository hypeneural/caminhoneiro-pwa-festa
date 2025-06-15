import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-trucker-blue text-trucker-blue-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-6 h-6" />
          <h1 className="text-xl font-bold">Contato</h1>
        </div>
        <p className="text-sm opacity-90">
          Entre em contato conosco para mais informações
        </p>
      </div>

      {/* Contact Cards */}
      <div className="p-4 space-y-4">
        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-trucker-green/20 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-trucker-green" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Telefone</h3>
                <p className="text-sm text-muted-foreground">(11) 98765-4321</p>
              </div>
              <Button size="sm" variant="outline">
                Ligar
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* WhatsApp */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">(11) 98765-4321</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Mensagem
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-trucker-blue/20 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-trucker-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Email</h3>
                <p className="text-sm text-muted-foreground">contato@festacaminhoneiro.com.br</p>
              </div>
              <Button size="sm" variant="outline">
                Enviar
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-trucker-red/20 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-trucker-red" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Endereço</h3>
                <p className="text-sm text-muted-foreground">
                  Praça Central da Festa<br />
                  Cidade dos Caminhoneiros<br />
                  CEP: 01234-567
                </p>
              </div>
              <Button size="sm" variant="outline">
                Ver Mapa
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Social Media */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card className="p-4">
            <h3 className="font-medium text-foreground mb-4">Redes Sociais</h3>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="bg-gradient-to-br from-purple-600 to-pink-600 border-0 text-white">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-blue-600 text-white border-0">
                <Facebook className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium text-foreground mb-3">Horário de Atendimento</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Segunda à Sexta:</span>
                <span>08h às 18h</span>
              </div>
              <div className="flex justify-between">
                <span>Sábado:</span>
                <span>08h às 14h</span>
              </div>
              <div className="flex justify-between">
                <span>Domingo:</span>
                <span>Fechado</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}