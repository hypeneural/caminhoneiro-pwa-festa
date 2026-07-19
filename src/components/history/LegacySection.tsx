import { motion } from "framer-motion";
import { Infinity, Sparkles, Heart, ArrowRight, Smartphone, Archive, Users2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const LegacySection = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
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
              Preservando o Legado: Rumo ao Futuro Digital
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Nossa responsabilidade com as próximas gerações vai além da tradição. 
            Através da tecnologia, garantimos que 22 anos de história sejam preservados 
            e acessíveis para sempre.
          </p>
        </motion.div>

        {/* Legacy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-trucker-blue/10">
                    <Archive className="w-6 h-6 text-trucker-blue" />
                  </div>
                  <h3 className="font-semibold">Preservação Digital</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Digitalização de fotos históricas, recuperação de áudios e vídeos antigos 
                  usando inteligência artificial para preservar cada momento.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• E-book/Livro impresso com toda a história</li>
                  <li>• Acervo digital completo</li>
                  <li>• Restauração de mídias antigas</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-trucker-yellow/10">
                    <Smartphone className="w-6 h-6 text-trucker-yellow" />
                  </div>
                  <h3 className="font-semibold">Tecnologia Inovadora</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Plataforma festadoscaminhoneiros.com.br com recursos avançados 
                  para conectar e servir a comunidade transportadora.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• IA para busca de fotos por placa/cor</li>
                  <li>• Tracking em tempo real da procissão</li>
                  <li>• Rádio 24h e guia de serviços</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-trucker-green/10">
                    <Users2 className="w-6 h-6 text-trucker-green" />
                  </div>
                  <h3 className="font-semibold">Engajamento Jovem</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Garantir que as novas gerações assumam a liderança e mantenham 
                  viva essa importante tradição comunitária.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Programas educacionais</li>
                  <li>• Participação ativa dos jovens</li>
                  <li>• Transmissão de conhecimento</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Building2 className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold">Expansão Física</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Sonho da comunidade: criar um "Parque de Eventos Multiuso" 
                  em Tijucas para comportar a grandiosidade da festa.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Espaço para Semana do Transporte</li>
                  <li>• Área para montadoras</li>
                  <li>• Infraestrutura adequada</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Current Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4 text-center">Desafios e Oportunidades Atuais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-amber-700 dark:text-amber-300">Desafios</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Falta de espaço físico para a grandiosidade atual</li>
                    <li>• Custos crescentes de combustível e manutenção</li>
                    <li>• Necessidade de engajamento das novas gerações</li>
                    <li>• Adaptação às mudanças tecnológicas do setor</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Oportunidades</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Projeto digital preservando a história</li>
                    <li>• Conexão global através da tecnologia</li>
                    <li>• Parcerias com novas empresas como Júlio Seguros</li>
                    <li>• Expansão do impacto social e econômico</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vision for Future */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-trucker-blue/10 to-trucker-yellow/10">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4 justify-center">
                <Sparkles className="w-6 h-6 text-trucker-yellow" />
                <h3 className="text-xl font-bold">Visão para o Futuro</h3>
              </div>
              <p className="text-muted-foreground text-center mb-6 max-w-3xl mx-auto">
                A festa dos próximos 22 anos será uma síntese perfeita entre tradição e inovação. 
                Mantendo a essência espiritual e comunitária, abraçamos a tecnologia para 
                amplificar nosso alcance e preservar nossa história para as futuras gerações.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <Heart className="w-8 h-8 text-trucker-red mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Tradição Preservada</h4>
                  <p className="text-xs text-muted-foreground">
                    Mantendo a fé, o voluntariado e o espírito de união
                  </p>
                </div>
                <div className="p-4">
                  <Smartphone className="w-8 h-8 text-trucker-blue mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Inovação Digital</h4>
                  <p className="text-xs text-muted-foreground">
                    Conectando comunidades através da tecnologia
                  </p>
                </div>
                <div className="p-4">
                  <Users2 className="w-8 h-8 text-trucker-green mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Legado Duradouro</h4>
                  <p className="text-xs text-muted-foreground">
                    Educando e inspirando as próximas gerações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
              <p className="mb-6 text-white/90 max-w-2xl mx-auto">
                A próxima página da nossa história está sendo escrita agora. 
                Junte-se a nós na 22ª edição e ajude a manter viva esta tradição
                que é patrimônio de Tijucas e de todo o setor de transportes brasileiro.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="text-lg font-semibold">
                  22ª Festa de São Cristóvão
                </div>
                <div className="text-white/90">
                  18 e 19 de Julho de 2026
                </div>
                <div className="text-white/90">
                  Capela Santa Teresinha - Bairro Universitário, Tijucas/SC
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="bg-white text-trucker-blue hover:bg-white/90"
                  size="lg"
                >
                  Participar da Próxima Edição
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <div className="text-sm text-white/80">
                  <p>🌐 Acompanhe o projeto digital: festadoscaminhoneiros.com.br</p>
                  <p>📱 Tecnologia preservando nossa história para o futuro</p>
                </div>
              </div>

              <p className="text-xs text-white/70 mt-4">
                "A tradição continua, a história se renova, o futuro nos aguarda"
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
