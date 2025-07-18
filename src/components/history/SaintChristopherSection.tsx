import { motion } from "framer-motion";
import { useState } from "react";
import { Cross, ChevronDown, ChevronUp, Heart, Users, Church, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const foundingFigures = [
  {
    name: "Padre Davi Antônio Coelho",
    role: "Visionário e Fundador",
    description: "Percebeu o potencial de São Cristóvão como co-padroeiro forte para a comunidade de Santa Terezinha",
    contribution: "Inspiração inicial e estabelecimento da tradição religiosa",
    photo: "https://festadoscaminhoneiros.com.br/assets/images/historia/fundadores/padre-davi-antonio.png",
    year: "2003"
  },
  {
    name: "Uilson Sgrott",
    role: "TCA - Primeiro Apoiador",
    description: "Doou a imagem de São Cristóvão, dando os primeiros passos essenciais",
    contribution: "Doação da imagem sagrada e apoio inicial",
    photo: "https://festadoscaminhoneiros.com.br/assets/images/historia/fundadores/uilson-sgrott.jpg",
    year: "2004"
  },
  {
    name: "Carlos Borba",
    role: "Líder da Nova Gestão CAEP",
    description: "Comandou a profissionalização e organização sistemática do evento",
    contribution: "Transformação organizacional e crescimento",
    photo: "https://festadoscaminhoneiros.com.br/assets/images/historia/fundadores/carlos-borba.jpeg",
    year: "2005"
  },
  {
    name: "Sizenando",
    role: "STR Transportes - Primeiro sorteado para conduzir o santo",
    description: "Primeiro sorteado para conduzir o santo na procissão",
    contribution: "Participação fundamental na tradição",
    photo: "https://festadoscaminhoneiros.com.br/assets/images/historia/fundadores/sizenando.jpg",
    year: "2005"
  },
  {
    name: "Arnaldo Peixoto",
    role: "Transportes Peixoto - Visionário",
    description: "Pilar da organização, respeitado pelas montadoras, via a festa como seu 'troféu'",
    contribution: "Conexão com montadoras e visão empresarial",
    photo: "https://festadoscaminhoneiros.com.br/assets/images/historia/fundadores/arnaldo-peixoto.jpeg",
    year: "2005"
  },
  {
    name: "Carlos Rosa",
    role: "Rodopiso Transportes - Inovador do santo giratório",
    description: "Criador do sistema que fazia a imagem de São Cristóvão girar",
    contribution: "Inovação marcante na festa",
    photo: "https://festadoscaminhoneiros.com.br/assets/images/historia/fundadores/carlos-rosa.jpg",
    year: "2008"
  }
];

const milestones = [
  {
    year: "2003",
    title: "A Inspiração Divina",
    description: "Padre Davi vislumbra São Cristóvão como co-padroeiro",
    icon: Church
  },
  {
    year: "2004",
    title: "Primeiros Passos",
    description: "Primeira festa oficial com Wilson Esgrot doando a imagem",
    icon: Heart
  },
  {
    year: "2005",
    title: "Profissionalização",
    description: "Nova gestão CAEP transforma o evento",
    icon: Users
  },
  {
    year: "2006",
    title: "Semana do Transporte",
    description: "Inovação que elevou a festa a outro patamar",
    icon: Award
  }
];

export const SaintChristopherSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState<number | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-16 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-trucker-yellow/20">
              <Cross className="w-8 h-8 text-trucker-yellow" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                São Cristóvão: A Origem de Uma Tradição
              </h2>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                De uma inspiração divina em 2003 aos fundamentos que construíram 22 anos de fé e união
              </p>
            </div>
          </div>
        </div>

        {/* Story Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-trucker-blue/5 to-trucker-yellow/5">
            <CardContent className="p-8">
              <div className="max-w-4xl mx-auto text-center">
                <blockquote className="text-lg md:text-xl font-medium text-foreground mb-4 italic">
                  "Percebi o crescimento do bairro Santa Terezinha e a forte presença de transportadoras. 
                  Vi em São Cristóvão um 'festeiro' forte para nossa comunidade."
                </blockquote>
                <cite className="text-muted-foreground">
                  — Padre Davi Antônio Coelho, fundador da tradição
                </cite>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline of Origins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h3 className="text-xl font-bold text-center mb-8">Os Primeiros Anos (2003-2006)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => {
              const IconComponent = milestone.icon;
              return (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="p-3 rounded-full bg-trucker-blue/10 inline-flex mb-4">
                        <IconComponent className="w-6 h-6 text-trucker-blue" />
                      </div>
                      <Badge className="mb-2 bg-trucker-yellow">{milestone.year}</Badge>
                      <h4 className="font-semibold mb-2">{milestone.title}</h4>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Founding Figures */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h3 className="text-xl font-bold text-center mb-8">Os Fundadores: Pilares da Nossa História</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {foundingFigures.map((figure, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedFigure(selectedFigure === index ? null : index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={figure.photo} alt={figure.name} />
                        <AvatarFallback>
                          {figure.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{figure.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {figure.year}
                          </Badge>
                        </div>
                        <p className="text-sm text-trucker-blue font-medium mb-2">
                          {figure.role}
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          {figure.description}
                        </p>
                        
                        {selectedFigure === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t pt-3"
                          >
                            <h5 className="font-medium text-xs text-trucker-yellow mb-1">
                              CONTRIBUIÇÃO HISTÓRICA:
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              {figure.contribution}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* São Cristóvão Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-trucker-yellow/10 to-trucker-orange/10">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-4">São Cristóvão: O Protetor dos Caminhoneiros</h3>
                <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Escolhido como co-padroeiro ao lado de Santa Terezinha, São Cristóvão representa 
                  a proteção divina nas estradas do Brasil. Sua imagem, doada por Wilson Esgrot, 
                  tornou-se o símbolo central de nossa festa.
                </p>
              </div>

              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                className="w-full flex items-center gap-2 text-trucker-blue hover:text-trucker-blue/80"
              >
                {isExpanded ? 'Ver menos sobre São Cristóvão' : 'Saiba mais sobre São Cristóvão'}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">A Tradição Religiosa</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        São Cristóvão é conhecido como o protetor dos viajantes. Segundo a tradição, 
                        ele carregava pessoas através de um rio perigoso. Sua devoção entre os 
                        caminhoneiros nasceu dessa missão de proteção nas jornadas.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Na Nossa Festa</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Durante a procissão, os caminhoneiros baixam o vidro para receber a água benta 
                        em seus documentos, chaves e entes queridos. Este ritual simboliza a fé na 
                        proteção do santo para a vida na estrada e para a família em casa.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white/50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-trucker-blue">
                      "São Cristóvão da Festa"
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Há 16 anos, Neto da NG/Rimátila interpreta São Cristóvão na festa, 
                      uma tradição que até seus netos acompanham. Este papel representa 
                      a continuidade e a importância da figura do santo para nossa comunidade.
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Impact Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-trucker-blue/10 to-trucker-green/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">O Legado dos Fundadores</h3>
              <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                O que começou com a inspiração de um padre e a generosidade de poucos 
                se transformou na maior festa de caminhoneiros da região. Cada um dos 
                fundadores plantou uma semente que hoje floresce em uma tradição 
                que une fé, família e trabalho.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-trucker-blue mb-1">22</div>
                  <div className="text-sm text-muted-foreground">Anos de tradição</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-trucker-green mb-1">25k+</div>
                  <div className="text-sm text-muted-foreground">Participantes esperados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-trucker-yellow mb-1">∞</div>
                  <div className="text-sm text-muted-foreground">Impacto nas gerações</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.section>
  );
};