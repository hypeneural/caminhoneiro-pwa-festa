import { motion } from "framer-motion";
import { Heart, Users, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-trucker-blue text-trucker-blue-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-6 h-6" />
          <h1 className="text-xl font-bold">Sobre a Festa</h1>
        </div>
        <p className="text-sm opacity-90">
          Conheça a história e tradição da Festa do Caminhoneiro
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Main Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Uma Tradição que Une Fé e Estrada
            </h2>
            <div className="prose prose-sm text-muted-foreground space-y-4">
              <p>
                A Festa do Caminhoneiro é uma celebração anual que reúne milhares de 
                caminhoneiros e suas famílias em devoção a São Cristóvão, o padroeiro 
                dos motoristas e viajantes.
              </p>
              <p>
                Com mais de 30 anos de tradição, nosso evento combina fé, música, 
                gastronomia e muita confraternização, criando momentos inesquecíveis 
                para toda a família dos trabalhadores da estrada.
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
              <Users className="w-8 h-8 text-trucker-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">10mil+</div>
              <div className="text-xs text-muted-foreground">Visitantes</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="p-4 text-center">
              <Calendar className="w-8 h-8 text-trucker-green mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">30+</div>
              <div className="text-xs text-muted-foreground">Anos de Tradição</div>
            </Card>
          </motion.div>
        </div>

        {/* Event Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-trucker-red" />
              Informações do Evento
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">25 e 26 de Julho</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local:</span>
                <span className="font-medium">Praça Central</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium">08h às 22h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrada:</span>
                <span className="font-medium text-trucker-green">Gratuita</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="p-6 bg-muted/50">
            <h3 className="font-bold text-foreground mb-3">Nossa Missão</h3>
            <p className="text-sm text-muted-foreground">
              Promover um espaço de fé, união e celebração para os caminhoneiros 
              e suas famílias, valorizando o trabalho e a dedicação desses 
              profissionais essenciais para o nosso país.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}