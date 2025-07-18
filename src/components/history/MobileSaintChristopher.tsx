import { motion } from "framer-motion";
import { useState } from "react";
import { Cross, ChevronDown, ChevronUp, Heart, Users, Church, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const foundingFigures = [
  {
    name: "Padre Davi Antônio Coelho",
    role: "Visionário e Fundador",
    description: "Inspiração inicial em 2003",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    year: "2003"
  },
  {
    name: "Wilson Esgrot",
    role: "TCA - Primeiro Apoiador",
    description: "Doou a imagem de São Cristóvão",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    year: "2004"
  },
  {
    name: "Carlos Borba",
    role: "Líder CAEP",
    description: "Profissionalização do evento",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    year: "2005"
  },
  {
    name: "Arnaldo Peixoto",
    role: "Transportes Peixoto",
    description: "Visionário empresarial",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    year: "2005"
  }
];

const milestones = [
  { year: "2003", title: "Inspiração", icon: Church },
  { year: "2004", title: "Primeira Festa", icon: Heart },
  { year: "2005", title: "Profissionalização", icon: Users },
  { year: "2006", title: "Semana do Transporte", icon: Award }
];

export const MobileSaintChristopher = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-8 px-4"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-trucker-yellow/20">
              <Cross className="w-5 h-5 text-trucker-yellow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                São Cristóvão: A Origem de Uma Tradição
              </h2>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            22 anos de história desde a inspiração do Padre Davi
          </p>
        </div>

        {/* Story Quote */}
        <Card className="mb-6 bg-gradient-to-r from-trucker-blue/5 to-trucker-yellow/5">
          <CardContent className="p-4">
            <blockquote className="text-sm font-medium text-center italic mb-2">
              "Vi em São Cristóvão um 'festeiro' forte para nossa comunidade."
            </blockquote>
            <cite className="text-xs text-muted-foreground text-center block">
              — Padre Davi Antônio Coelho
            </cite>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-center">Primeiros Anos</h3>
          <div className="grid grid-cols-2 gap-3">
            {milestones.map((milestone, index) => {
              const IconComponent = milestone.icon;
              return (
                <Card key={milestone.year} className="text-center">
                  <CardContent className="p-3">
                    <div className="p-2 rounded-full bg-trucker-blue/10 inline-flex mb-2">
                      <IconComponent className="w-4 h-4 text-trucker-blue" />
                    </div>
                    <Badge className="mb-1 text-xs bg-trucker-yellow">{milestone.year}</Badge>
                    <p className="text-xs font-medium">{milestone.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Content with Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-3">
          <AccordionItem value="fundadores" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">Os Fundadores</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pilares que construíram nossa história
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {foundingFigures.map((figure, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={figure.photo} alt={figure.name} />
                      <AvatarFallback className="text-xs">
                        {figure.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-xs font-medium">{figure.name}</p>
                        <Badge variant="outline" className="text-xs h-4">
                          {figure.year}
                        </Badge>
                      </div>
                      <p className="text-xs text-trucker-blue font-medium">{figure.role}</p>
                      <p className="text-xs text-muted-foreground">{figure.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sao-cristovao" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">São Cristóvão</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    O protetor dos caminhoneiros
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Tradição Religiosa</h4>
                  <p>
                    São Cristóvão é conhecido como protetor dos viajantes. Sua devoção 
                    entre caminhoneiros nasceu da missão de proteção nas jornadas.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-1">Na Nossa Festa</h4>
                  <p>
                    Durante a procissão, caminhoneiros baixam o vidro para receber água benta 
                    em documentos e entes queridos, simbolizando a fé na proteção divina.
                  </p>
                </div>

                <div className="p-3 bg-trucker-yellow/10 rounded-md">
                  <h5 className="font-medium text-trucker-blue mb-1">"São Cristóvão da Festa"</h5>
                  <p>
                    Há 16 anos, Neto da NG/Rimátila interpreta São Cristóvão, 
                    uma tradição que envolve até seus netos.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="legado" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">O Legado</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Impacto nas gerações
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  O que começou com a inspiração de um padre se transformou na maior 
                  festa de caminhoneiros da região, unindo fé, família e trabalho.
                </p>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-muted/30 rounded-md">
                    <div className="text-lg font-bold text-trucker-blue">22</div>
                    <div className="text-xs text-muted-foreground">Anos</div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-md">
                    <div className="text-lg font-bold text-trucker-green">25k+</div>
                    <div className="text-xs text-muted-foreground">Pessoas</div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-md">
                    <div className="text-lg font-bold text-trucker-yellow">∞</div>
                    <div className="text-xs text-muted-foreground">Impacto</div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </motion.section>
  );
};