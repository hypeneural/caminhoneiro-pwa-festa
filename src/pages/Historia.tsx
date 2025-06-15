import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookText, Calendar, Users, MapPin, Trophy } from "lucide-react";

const Historia = () => {
  const timelineEvents = [
    {
      year: "2019",
      title: "Primeira Edição",
      description: "Nasceu a ideia de criar uma festa dedicada aos caminhoneiros",
      highlight: "500 participantes"
    },
    {
      year: "2020",
      title: "Crescimento",
      description: "A festa ganhou reconhecimento regional",
      highlight: "1.2K participantes"
    },
    {
      year: "2021",
      title: "Expansão",
      description: "Primeiros shows nacionais e patrocinadores",
      highlight: "3K participantes"
    },
    {
      year: "2022",
      title: "Consolidação",
      description: "Evento se tornou referência no estado",
      highlight: "8K participantes"
    },
    {
      year: "2023",
      title: "Nacional",
      description: "Festa ganhou projeção nacional",
      highlight: "15K participantes"
    },
    {
      year: "2024",
      title: "Recorde",
      description: "Maior edição da história",
      highlight: "25K participantes"
    }
  ];

  const stats = [
    { icon: Users, label: "Participantes", value: "25K+", color: "text-trucker-blue" },
    { icon: Calendar, label: "Anos de História", value: "6", color: "text-trucker-green" },
    { icon: MapPin, label: "Estados Presentes", value: "12", color: "text-trucker-yellow" },
    { icon: Trophy, label: "Prêmios Recebidos", value: "5", color: "text-trucker-red" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <BookText className="w-8 h-8 text-trucker-yellow" />
              <h1 className="text-2xl font-bold text-foreground">Nossa História</h1>
            </div>
            <p className="text-muted-foreground">
              A jornada da maior festa caminhoneira do Sul
            </p>
          </div>

          {/* Hero Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-trucker-yellow/10 to-trucker-orange/10 p-6 text-center">
                <h2 className="text-xl font-bold mb-3">Festa do Caminhoneiro</h2>
                <p className="text-muted-foreground mb-4">
                  Desde 2019, celebrando a força e a paixão dos caminhoneiros brasileiros. 
                  O que começou como um encontro local, hoje é o maior evento caminhoneiro da região Sul.
                </p>
                <Badge className="bg-trucker-yellow text-trucker-yellow-foreground">
                  Tijucas/SC - Tradicional desde 2019
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card>
                  <CardContent className="p-4 text-center">
                    <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Linha do Tempo
            </h2>
            
            <div className="space-y-4">
              {timelineEvents.map((event, index) => (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-trucker-blue/20 rounded-full flex items-center justify-center">
                            <span className="text-trucker-blue font-bold text-sm">
                              {event.year}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{event.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">
                            {event.description}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {event.highlight}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mission */}
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-3">Nossa Missão</h3>
              <p className="text-muted-foreground">
                Valorizar e celebrar os profissionais que movem o Brasil, criando um espaço 
                de confraternização, cultura e reconhecimento para toda a categoria caminhoneira.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Historia;