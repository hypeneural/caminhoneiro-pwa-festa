import { motion } from "framer-motion";
import { Sparkles, Cross, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const ConclusionSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-trucker-yellow/20 mb-6">
            <Sparkles className="w-10 h-10 text-trucker-yellow" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'serif' }}>
            Legado e Inspiração: A Jornada Continua
          </h2>
          <p className="text-xl text-muted-foreground">
            O peso do mundo nos ombros, a fé no coração
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          <Card className="overflow-hidden border-0 shadow-2xl">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Image */}
                <div className="lg:w-2/5">
                  <img
                    src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&q=80&w=600"
                    alt="Estrada ao horizonte simbolizando a jornada contínua"
                    className="w-full h-64 lg:h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="lg:w-3/5 p-8 lg:p-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Cross className="w-8 h-8 text-trucker-yellow" />
                      <h3 className="text-2xl font-bold text-foreground">
                        Um Simbolismo Eterno
                      </h3>
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Da lenda medieval à realidade das rodovias brasileiras, São Cristóvão representa 
                      algo que transcende o tempo: <strong>a proteção divina para aqueles que carregam 
                      fardos pesados</strong>.
                    </p>

                    <p className="text-muted-foreground leading-relaxed">
                      Como o gigante que carregou Cristo, os caminhoneiros modernos carregam muito mais 
                      que mercadorias. Eles carregam o <strong>peso da economia</strong>, a responsabilidade 
                      de abastecer o país, a <strong>saudade da família</strong> e os sonhos de um futuro melhor.
                    </p>

                    <div className="bg-gradient-to-r from-trucker-blue/10 to-trucker-green/10 p-6 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Heart className="w-6 h-6 text-trucker-red mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-trucker-red mb-2">
                            "São Cristóvão, protegei-nos!"
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            "Que vossos braços fortes nos sustentem nas curvas perigosas, 
                            que vossa fé nos guie nos momentos de solidão, e que vossa proteção 
                            nos traga de volta ao lar, seguros e em paz."
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      Em cada viagem, em cada amuleto no para-brisa, em cada oração antes de partir, 
                      São Cristóvão continua cumprindo sua missão: <strong>ser companhia na longa 
                      estrada da vida</strong>, oferecendo proteção, coragem e esperança a todos os 
                      que fazem das estradas seu local de trabalho e suas jornadas um ato de fé.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center pt-8"
          >
            <div className="space-y-4">
              <p className="text-lg font-medium text-foreground">
                Participe da Festa do Caminhoneiro em Tijucas
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Venha celebrar a fé, a tradição e a valorização dos profissionais da estrada 
                na maior festa de caminhoneiros de Santa Catarina.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  className="bg-trucker-yellow hover:bg-trucker-yellow/90 text-black font-semibold"
                >
                  Ver Programação 2025
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-trucker-blue text-trucker-blue hover:bg-trucker-blue hover:text-white"
                >
                  História da Festa
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};