import { motion } from "framer-motion";
import { Truck, Church } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { patronageTimeline } from "@/data/saoChristopher";

export const PatronageEvolution = () => {
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'origin': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'evolution': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'modern': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'brazil': return 'bg-trucker-green/20 text-trucker-green dark:bg-trucker-green/10';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-trucker-blue/20 mb-4">
            <Truck className="w-8 h-8 text-trucker-blue" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'serif' }}>
            Do Rio à Estrada: A Proteção que Evolui
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A evolução natural do patronato: das travessias fluviais medievais às rodovias modernas
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-trucker-blue via-trucker-green to-trucker-yellow transform md:-translate-x-1/2" />

          <div className="space-y-12">
            {patronageTimeline.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-background border-4 border-trucker-blue transform md:-translate-x-1/2 z-10">
                  <div className="absolute inset-1 rounded-full bg-trucker-blue" />
                </div>

                {/* Content */}
                <div className={`flex-1 ml-12 md:ml-0 ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <event.icon className="w-6 h-6 text-foreground" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSignificanceColor(event.significance)}>
                              {event.period}
                            </Badge>
                          </div>
                          
                          <h3 className="text-xl font-bold mb-3 text-foreground">
                            {event.title}
                          </h3>
                          
                          <p className="text-muted-foreground leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Status Litúrgico */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-trucker-yellow/10 to-trucker-orange/10 border-trucker-yellow/30">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-trucker-yellow/20">
                  <Church className="w-8 h-8 text-trucker-yellow" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">
                    São Cristóvão na Igreja: Sem "Descanonização"
                  </h3>
                  
                  <div className="prose prose-lg max-w-none text-muted-foreground">
                    <p className="mb-4">
                      <strong>Esclarecimento importante:</strong> São Cristóvão nunca foi "descanonizado" pela Igreja Católica. 
                      A reforma do Calendário Romano Geral de 1969 removeu sua festa do calendário universal, 
                      mas <strong>manteve-o no Martirológio Romano</strong> e permitiu sua celebração em calendários particulares.
                    </p>
                    
                    <p className="mb-4">
                      Esta reforma foi de natureza <strong>pastoral, não dogmática</strong>, e não diminuiu a legitimidade 
                      de seu culto. A Igreja reconhece que, independentemente das lendas, existiu um mártir histórico 
                      chamado Cristóvão, e sua veneração como protetor dos viajantes permanece válida.
                    </p>
                    
                    <div className="bg-trucker-blue/10 p-4 rounded-lg mt-4">
                      <p className="text-sm font-medium text-trucker-blue mb-2">Posição Oficial da Igreja</p>
                      <p className="text-sm">
                        "O culto a São Cristóvão permanece legítimo e é encorajado, especialmente entre 
                        profissionais do transporte que encontram nele um modelo de serviço cristão e proteção divina."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};