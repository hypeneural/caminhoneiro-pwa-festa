import { motion } from "framer-motion";
import { Infinity, Sparkles, Heart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const LegacySection = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Infinity className="w-8 h-8 text-trucker-blue" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Preservando o Legado: Rumo ao Futuro
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nossa responsabilidade com as próximas gerações e o compromisso de manter 
            viva uma tradição que transcende o tempo.
          </p>
        </motion.div>

        {/* Legacy Cards */}
        <div className="grid gap-8 mb-12">
          {/* Continuity Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="bg-gradient-to-r from-trucker-blue/10 to-trucker-blue/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-trucker-blue/20">
                    <Heart className="w-8 h-8 text-trucker-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">Compromisso com a Continuidade</h3>
                    <p className="text-muted-foreground mb-4">
                      Há mais de duas décadas, nossa festa vem unindo gerações de caminhoneiros 
                      em torno da fé e da tradição. Cada edição fortalece os laços que conectam 
                      avós, pais e filhos numa celebração que vai além do trabalho - é sobre 
                      identidade, valores e esperança.
                    </p>
                    <div className="bg-white/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-trucker-blue">
                        "O que começou como um encontro simples se tornou patrimônio cultural 
                        de nossa comunidade. Nossa responsabilidade é garantir que as futuras 
                        gerações também tenham este espaço de fé e confraternização."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Adaptation Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-trucker-green/10 to-trucker-green/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-trucker-green/20">
                    <Sparkles className="w-8 h-8 text-trucker-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">Evolução com Essência</h3>
                    <p className="text-muted-foreground mb-4">
                      Os tempos mudam, a tecnologia avança, mas os valores fundamentais permanecem. 
                      Nossa festa evolui para acompanhar as necessidades de cada época, mantendo 
                      sempre viva a essência que a torna especial: a fé, a solidariedade e o 
                      respeito pela profissão de caminhoneiro.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-trucker-green rounded-full"></div>
                        <span>Incorporação de novas tecnologias mantendo tradições</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-trucker-green rounded-full"></div>
                        <span>Adaptação às mudanças sociais e ambientais</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-trucker-green rounded-full"></div>
                        <span>Preservação dos valores espirituais e comunitários</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Future Vision Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-trucker-yellow/10 to-trucker-orange/10">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="p-4 rounded-full bg-trucker-yellow/20 inline-flex mb-4">
                    <Sparkles className="w-10 h-10 text-trucker-yellow" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Visão para o Futuro</h3>
                  <p className="text-muted-foreground mb-6">
                    Olhamos para frente com esperança e determinação. Queremos que nossa festa 
                    continue sendo um farol de fé e união para os caminhoneiros, suas famílias 
                    e toda a comunidade. Que em 2050, quando celebrarmos nossos 47 anos, as 
                    crianças de hoje possam dizer com orgulho: "Esta é nossa tradição".
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-trucker-blue">2030</div>
                      <div className="text-sm text-muted-foreground">25 anos de história</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-trucker-green">2040</div>
                      <div className="text-sm text-muted-foreground">Renovação completa</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-trucker-yellow">2050</div>
                      <div className="text-sm text-muted-foreground">Meio século de tradição</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-trucker-blue to-trucker-yellow">
            <CardContent className="p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Faça Parte da História</h3>
              <p className="mb-6 text-white/90">
                A próxima página da nossa história está sendo escrita agora. 
                Junte-se a nós na 21ª edição e ajude a manter viva esta tradição 
                que é patrimônio de todos nós.
              </p>
              
              <div className="space-y-3">
                <div className="text-lg font-semibold">
                  21ª Festa do Caminhoneiro São Cristóvão
                </div>
                <div className="text-white/90">
                  19 e 20 de Julho de 2025
                </div>
                <div className="text-white/90">
                  Igreja de Santa Terezinha - Tijucas/SC
                </div>
              </div>

              <Button 
                className="mt-6 bg-white text-trucker-blue hover:bg-white/90"
                size="lg"
              >
                Participar da Próxima Edição
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-white/70 mt-4">
                Informações detalhadas sobre programação disponíveis em breve
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};