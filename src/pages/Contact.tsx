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
      <div className="p-4 space-y-4 pb-32">
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
                <p className="text-sm text-muted-foreground">+55 48 96425-287</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => window.open('https://wa.me/554896425287', '_blank')}>
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
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 bg-trucker-blue/20 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-trucker-blue" />
              </div>
              <div className="flex-1 min-w-[180px] break-all">
                <h3 className="font-medium text-foreground">Email</h3>
                <p className="text-sm text-muted-foreground break-all">contato@festacaminhoneiro.com.br</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.open('mailto:contato@festacaminhoneiro.com.br')}>
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
              <Button size="sm" variant="outline" onClick={() => window.open('https://www.google.com/maps/place/Capela+Santa+Terezinha/@-27.2363842,-48.6485797,17z/data=!4m10!1m2!2m1!1sSanta+Terezinha+Tijucas!3m6!1s0x94d8abe724bb480b:0x6ccf8fe95043e90e!8m2!3d-27.2363844!4d-48.6447987!15sChdTYW50YSBUZXJlemluaGEgVGlqdWNhc5IBD2NhdGhvbGljX2NodXJjaKoBVRABKhMiD3NhbnRhIHRlcmV6aW5oYSgMMh8QASIbF9oq7UbKLUAdGIVrKAJaeBNrkVuEzl05nRvLMhsQAiIXc2FudGEgdGVyZXppbmhhIHRpanVjYXPgAQA!16s%2Fg%2F11bytv072k?entry=ttu&g_ep=EgoyMDI1MDcxNi4wIKXMDSoASAFQAw%3D%3D', '_blank')}>
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
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" size="icon" className="bg-gradient-to-br from-purple-600 to-pink-600 border-0 text-white" onClick={() => window.open('https://www.instagram.com/festacaminhoneiros/', '_blank')}>
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-blue-600 text-white border-0" onClick={() => window.open('https://www.facebook.com/festadoscaminhoneiros/', '_blank')}>
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-red-600 text-white border-0" onClick={() => window.open('https://www.youtube.com/@festadoscaminhoneiros', '_blank')}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.386.574A2.994 2.994 0 0 0 .502 6.186C0 8.344 0 12 0 12s0 3.656.502 5.814a2.994 2.994 0 0 0 2.112 2.112C4.772 20.5 12 20.5 12 20.5s7.228 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C24 15.656 24 12 24 12s0-3.656-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </Button>
              <Button variant="outline" size="icon" className="bg-black text-white border-0" onClick={() => window.open('https://www.tiktok.com/@festacaminhoneiros', '_blank')}>
                {/* TikTok SVG mais nítido */}
                <svg className="w-4 h-4" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M28.5 10.5c-2.6 0-4.7-2.1-4.7-4.7V2h-4.1v19.2c0 2.1-1.7 3.8-3.8 3.8s-3.8-1.7-3.8-3.8 1.7-3.8 3.8-3.8c.3 0 .7 0 1 .1v-4.2c-.3 0-.7-.1-1-.1-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8v-7.2c1.3 1 3 1.6 4.7 1.6h.1V10.5h-.1z"/>
                </svg>
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