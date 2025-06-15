import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const Schedule = () => {
  const scheduleItems = [
    {
      id: 1,
      time: "08:00",
      title: "Concentração dos Caminhoneiros",
      location: "Centro de Tijucas",
      type: "concentracao",
      date: "19/07/2025"
    },
    {
      id: 2,
      time: "09:00",
      title: "Bênção dos Veículos",
      location: "Igreja Matriz",
      type: "religioso",
      date: "19/07/2025"
    },
    {
      id: 3,
      time: "10:00",
      title: "Saída da Procissão",
      location: "Centro",
      type: "procissao",
      date: "19/07/2025"
    },
    {
      id: 4,
      time: "14:00",
      title: "Show com Banda Regional",
      location: "Palco Principal",
      type: "entretenimento",
      date: "19/07/2025"
    },
    {
      id: 5,
      time: "18:00",
      title: "Jantar Comunitário",
      location: "Área de Alimentação",
      type: "alimentacao",
      date: "19/07/2025"
    },
    {
      id: 6,
      time: "20:00",
      title: "Show Nacional",
      location: "Palco Principal",
      type: "entretenimento",
      date: "19/07/2025"
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'religioso': return 'bg-trucker-yellow/10 text-trucker-yellow border-trucker-yellow';
      case 'procissao': return 'bg-trucker-blue/10 text-trucker-blue border-trucker-blue';
      case 'entretenimento': return 'bg-trucker-red/10 text-trucker-red border-trucker-red';
      case 'alimentacao': return 'bg-trucker-green/10 text-trucker-green border-trucker-green';
      default: return 'bg-trucker-orange/10 text-trucker-orange border-trucker-orange';
    }
  };

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
            <CalendarIcon className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Programação</h1>
        </div>
        
        <Badge variant="outline" className="text-trucker-blue border-trucker-blue">
          19-20 Jul
        </Badge>
      </motion.header>

      {/* Main content */}
      <main className="pt-16 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="py-4"
        >
          {/* Date Header */}
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="w-5 h-5 text-trucker-blue" />
            <h2 className="text-xl font-bold">Sábado, 19 de Julho</h2>
          </div>

          {/* Schedule Timeline */}
          <div className="space-y-4">
            {scheduleItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 shadow-md">
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className="w-12 h-12 bg-trucker-blue rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-trucker-blue-foreground" />
                      </div>
                      <span className="text-sm font-bold text-trucker-blue mt-1">
                        {item.time}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-card-foreground leading-tight">
                          {item.title}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(item.type)}`}
                        >
                          {item.type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        📍 {item.location}
                      </p>

                      {/* Progress indicator for current/upcoming events */}
                      {index < 2 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-trucker-green rounded-full animate-pulse" />
                          <span className="text-xs text-trucker-green font-medium">
                            {index === 0 ? 'Em andamento' : 'Próximo'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Day 2 Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 mb-4"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-trucker-red" />
              <h2 className="text-xl font-bold">Domingo, 20 de Julho</h2>
            </div>
          </motion.div>

          {/* Day 2 Schedule Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-4 shadow-md bg-muted/30">
              <div className="text-center">
                <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Programação do segundo dia
                </p>
                <Badge variant="secondary">
                  Em breve
                </Badge>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Schedule;