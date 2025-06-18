import { motion } from "framer-motion";
import { History, Users, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-trucker-blue text-trucker-blue-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <History className="w-6 h-6" />
          <h1 className="text-xl font-bold">Nossa História</h1>
        </div>
        <p className="text-sm opacity-90">
          A tradição e fé da Festa do Caminhoneiro de Tijucas
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* História Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              As Origens da Nossa Festa
            </h2>
            <div className="prose prose-sm text-muted-foreground space-y-4">
              <p>
                A Festa do Caminhoneiro surgiu pela iniciativa do Padre Darci Antônio Celli 
                no ano de 2004. Com São Cristóvão como protetor do motorista e sendo Tijucas 
                berço de muitas transportadoras, a comissão (CPC) da Capela Santa Teresinha 
                do Menino Jesus abraçou esta causa.
              </p>
              <p>
                A iniciativa ganhou força após visitas e contatos com empresários do ramo 
                de transporte de cargas da cidade, que se uniram para instituir a Grande 
                Festa do Caminhoneiro.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="p-4 text-center">
              <Calendar className="w-8 h-8 text-trucker-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">XXI</div>
              <div className="text-xs text-muted-foreground">Anos de Festa</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="p-4 text-center">
              <Users className="w-8 h-8 text-trucker-green mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">2004</div>
              <div className="text-xs text-muted-foreground">Ano de Início</div>
            </Card>
          </motion.div>
        </div>

        {/* Informações da Procissão */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-trucker-red" />
              Procissão e Devoção
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                A imagem de São Cristóvão que sai em procissão pela cidade foi uma 
                generosa doação do empresário Uilson Sgrott e outros colaboradores.
              </p>
              <p>
                Em 2025, celebramos com grande alegria a XXIª Festa de São Cristóvão, 
                protetor dos motoristas, mantendo viva esta importante tradição de 
                fé e comunidade.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Evento Atual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="p-6 bg-muted/50">
            <h3 className="font-bold text-foreground mb-3">Edição 2025</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">25 e 26 de Julho</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local:</span>
                <span className="font-medium">Capela Santa Teresinha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrada:</span>
                <span className="font-medium text-trucker-green">Gratuita</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}