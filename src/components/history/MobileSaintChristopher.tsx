import { motion } from "framer-motion";
import { useState } from "react";
import { Cross, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-trucker-yellow/20 flex-shrink-0">
            <Cross className="w-5 h-5 text-trucker-yellow" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">
              São Cristóvão: O Padroeiro dos Caminhoneiros
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              A origem da devoção que protege nossos caminhos
            </p>
          </div>
        </div>

        {/* Main Image */}
        <div className="mb-6">
          <img
            src="https://images.unsplash.com/photo-1473177104440-ffee2f376098?auto=format&fit=crop&q=80&w=400"
            alt="São Cristóvão carregando o menino Jesus"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        {/* Content with Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="lenda" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">A Lenda</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    A história de Réprobo e o menino Jesus
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                São Cristóvão era um gigante chamado Réprobo, que decidiu servir ao rei mais poderoso do mundo. 
                Descobrindo que este era Cristo, passou a ajudar pessoas a atravessar um rio perigoso. 
                Um dia, carregou uma criança que se revelou ser o próprio Jesus.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="significado" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">Significado</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    O protetor dos viajantes
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                O nome "Cristóvão" significa "aquele que carrega Cristo". Tornou-se o protetor dos viajantes, 
                motoristas e todos que enfrentam os perigos da estrada, sendo invocado para proteção nas jornadas.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="devocao" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">Devoção no Brasil</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Como chegou a São Cristóvão no país
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                A devoção a São Cristóvão chegou ao Brasil no século XVI com os jesuítas. 
                Com o crescimento do transporte rodoviário no país, especialmente a partir dos anos 1950, 
                os motoristas adotaram o santo como seu protetor especial.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="importancia" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">Importância para Caminhoneiros</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mais que proteção: companhia nas estradas
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para os caminhoneiros, São Cristóvão representa mais que proteção: é companhia nas longas jornadas, 
                força nos momentos difíceis e esperança de retorno seguro ao lar. Sua imagem nos para-brisas 
                é símbolo de fé e responsabilidade.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="santa-catarina" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start text-left">
                <div>
                  <h3 className="text-sm font-semibold text-trucker-yellow">Em Santa Catarina</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por que Tijucas se tornou especial
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                SC, com sua importante malha rodoviária e forte setor logístico, abraçou a tradição. 
                A posição estratégica de Tijucas na BR-101 fez da cidade um local natural para celebrar 
                esta devoção que une fé, trabalho e comunidade.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </motion.section>
  );
};