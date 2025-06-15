import { motion } from "framer-motion";
import { useState } from "react";
import { Cross, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const SaintChristopherSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-16 px-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-full bg-trucker-yellow/20">
            <Cross className="w-8 h-8 text-trucker-yellow" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              São Cristóvão: O Padroeiro dos Caminhoneiros
            </h2>
            <p className="text-muted-foreground mt-1">
              A origem da devoção que protege nossos caminhos
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="md:w-1/3">
                <img
                  src="https://images.unsplash.com/photo-1473177104440-ffee2f376098?auto=format&fit=crop&q=80&w=400"
                  alt="São Cristóvão carregando o menino Jesus"
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="md:w-2/3 p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-trucker-yellow mb-2">A Lenda</h3>
                    <p className="text-muted-foreground">
                      São Cristóvão era um gigante chamado Réprobo, que decidiu servir ao rei mais poderoso do mundo. 
                      Descobrindo que este era Cristo, passou a ajudar pessoas a atravessar um rio perigoso. 
                      Um dia, carregou uma criança que se revelou ser o próprio Jesus.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-trucker-yellow mb-2">Significado</h3>
                    <p className="text-muted-foreground">
                      O nome "Cristóvão" significa "aquele que carrega Cristo". Tornou-se o protetor dos viajantes, 
                      motoristas e todos que enfrentam os perigos da estrada, sendo invocado para proteção nas jornadas.
                    </p>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-trucker-yellow mb-2">Devoção no Brasil</h3>
                        <p className="text-muted-foreground">
                          A devoção a São Cristóvão chegou ao Brasil no século XVI com os jesuítas. 
                          Com o crescimento do transporte rodoviário no país, especialmente a partir dos anos 1950, 
                          os motoristas adotaram o santo como seu protetor especial.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-trucker-yellow mb-2">Importância</h3>
                        <p className="text-muted-foreground">
                          Para os caminhoneiros, São Cristóvão representa mais que proteção: é companhia nas longas jornadas, 
                          força nos momentos difíceis e esperança de retorno seguro ao lar. Sua imagem nos para-brisas 
                          é símbolo de fé e responsabilidade.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-trucker-yellow mb-2">Em Santa Catarina</h3>
                        <p className="text-muted-foreground">
                          SC, com sua importante malha rodoviária e forte setor logístico, abraçou a tradição. 
                          A posição estratégica de Tijucas na BR-101 fez da cidade um local natural para celebrar 
                          esta devoção que une fé, trabalho e comunidade.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  variant="outline"
                  className="w-full mt-4"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Menos detalhes
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Saiba mais sobre a devoção
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
};