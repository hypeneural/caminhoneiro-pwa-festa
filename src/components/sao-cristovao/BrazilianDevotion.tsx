import { motion } from "framer-motion";
import { Flag, Heart, Handshake, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { devotionPractices } from "@/data/saoChristopher";

export const BrazilianDevotion = () => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'celebration': return 'bg-trucker-red/20 text-trucker-red';
      case 'tradition': return 'bg-trucker-blue/20 text-trucker-blue';
      case 'prayer': return 'bg-trucker-yellow/20 text-trucker-yellow';
      case 'blessing': return 'bg-trucker-green/20 text-trucker-green';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'celebration': return 'Celebração';
      case 'tradition': return 'Tradição';
      case 'prayer': return 'Oração';
      case 'blessing': return 'Bênção';
      default: return type;
    }
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-trucker-green/20 mb-4">
            <Flag className="w-8 h-8 text-trucker-green" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'serif' }}>
            No Coração do Brasil: A Devoção na Estrada
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Como São Cristóvão se tornou o protetor espiritual dos caminhoneiros brasileiros
          </p>
        </motion.div>

        {/* Conexão com Caminhoneiros */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-trucker-red/10 to-trucker-red/5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-trucker-red/20">
                  <Heart className="w-6 h-6 text-trucker-red" />
                </div>
                <div>
                  <CardTitle className="text-2xl">A Conexão Inquebrável</CardTitle>
                  <p className="text-muted-foreground mt-1">O caminhoneiro e seu padroeiro</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    A vida do caminhoneiro no Brasil é marcada por <strong>riscos, solidão e saudade</strong>. 
                    Longas jornadas pelas estradas, separação da família, pressões de prazos e os perigos 
                    constantes da profissão criam uma necessidade profunda de proteção espiritual.
                  </p>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    São Cristóvão preenche essa necessidade de forma única: como um gigante que carregava 
                    o peso do mundo, ele compreende o fardo que os caminhoneiros carregam - não apenas 
                    as cargas materiais, mas também a <strong>responsabilidade de manter o país em movimento</strong>.
                  </p>
                  
                  <div className="bg-trucker-yellow/10 p-4 rounded-lg">
                    <p className="text-sm font-medium text-trucker-yellow mb-2">25 de Julho</p>
                    <p className="text-sm text-muted-foreground">
                      Dia do Caminhoneiro - Data em que se celebra tanto a profissão quanto o padroeiro, 
                      unindo trabalho e fé em uma única celebração.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&q=80&w=600"
                    alt="Caminhão na estrada simbolizando a jornada"
                    className="rounded-lg shadow-lg w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm font-medium">A Jornada Continua</p>
                    <p className="text-xs opacity-90">Sob a proteção de São Cristóvão</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rituais e Manifestações */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-lg bg-trucker-blue/20">
              <Handshake className="w-6 h-6 text-trucker-blue" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Celebrações e Manifestações de Fé</h3>
              <p className="text-muted-foreground">Rituais de uma fé em movimento</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {devotionPractices.map((practice, index) => (
              <motion.div
                key={practice.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <practice.icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(practice.type)}>
                            {getTypeLabel(practice.type)}
                          </Badge>
                          {practice.location && (
                            <span className="text-xs text-muted-foreground">
                              {practice.location}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold mb-2 text-foreground">
                          {practice.title}
                        </h4>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {practice.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Iconografia e Simbolismo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30">
              <CardTitle className="text-xl">Simbolismo das Cores e Vestes</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-trucker-green rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 bg-trucker-green-foreground rounded-full" />
                  </div>
                  <h4 className="font-semibold text-trucker-green mb-2">Túnica Verde</h4>
                  <p className="text-sm text-muted-foreground">Esperança e renovação da fé</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 bg-amber-100 rounded-full" />
                  </div>
                  <h4 className="font-semibold text-amber-700 mb-2">Avental Marrom</h4>
                  <p className="text-sm text-muted-foreground">Serviço humilde e trabalho</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-trucker-red rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 bg-trucker-red-foreground rounded-full" />
                  </div>
                  <h4 className="font-semibold text-trucker-red mb-2">Manto Vermelho</h4>
                  <p className="text-sm text-muted-foreground">Martírio e força da fé</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Santa Catarina e Tijucas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-trucker-blue/10 to-trucker-green/10 border-trucker-blue/30">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-trucker-blue/20">
                  <MapPin className="w-8 h-8 text-trucker-blue" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">
                    A Devoção em Nossas Estradas Catarinenses
                  </h3>
                  
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Santa Catarina, com sua posição estratégica no Sul do Brasil e importante malha rodoviária, 
                      abraçou naturalmente a tradição de São Cristóvão. A <strong>BR-101</strong>, que corta o estado, 
                      é uma das principais rotas de caminhoneiros do país.
                    </p>
                    
                    <p>
                      <strong>Tijucas</strong>, com sua localização privilegiada nesta rodovia, tornou-se um ponto 
                      natural de encontro e celebração. A <strong>Festa do Caminhoneiro de Tijucas</strong> é um 
                      exemplo vibrante dessa piedade popular, unindo fé e valorização profissional em uma 
                      celebração que já se tornou tradição regional.
                    </p>
                    
                    <div className="bg-trucker-green/10 p-4 rounded-lg">
                      <p className="text-sm font-medium text-trucker-green mb-2">Tradição Local</p>
                      <p className="text-sm">
                        "Em Tijucas, a devoção a São Cristóvão une a comunidade local aos caminhoneiros 
                        que passam pela BR-101, criando um encontro único de fé, cultura e hospitalidade catarinense."
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