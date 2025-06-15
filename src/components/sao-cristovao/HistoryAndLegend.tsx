import { motion } from "framer-motion";
import { useState } from "react";
import { BookText, Search, ScrollText, Sword, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { legendComparison } from "@/data/saoChristopher";

export const HistoryAndLegend = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <BookText className="w-8 h-8 text-amber-700 dark:text-amber-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'serif' }}>
            História e Lenda: As Faces de São Cristóvão
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Entre evidências históricas e narrativas populares, descobrimos a complexa identidade do padroeiro dos motoristas
          </p>
        </motion.div>

        <div className="grid gap-8">
          {/* Evidências Históricas */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-600">
                    <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Evidências do Culto Primitivo</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Fatos históricos comprovados</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    A existência histórica de um mártir chamado Cristóvão é confirmada por evidências arqueológicas 
                    e documentais. A <strong>inscrição em pedra de Calcedônia (449-452 d.C.)</strong> é o mais antigo 
                    testemunho do culto ao santo.
                  </p>
                  
                  {expandedSection === 'historical' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 pt-4 border-t"
                    >
                      <p className="text-muted-foreground">
                        Além da inscrição de Calcedônia, temos menções de <strong>São Gregório Magno</strong> e outros 
                        Padres da Igreja, confirmando que a Igreja reconhece a existência histórica do mártir, 
                        distinguindo-a claramente das lendas posteriores.
                      </p>
                      <div className="bg-trucker-blue/10 p-4 rounded-lg">
                        <p className="text-sm font-medium text-trucker-blue mb-2">Evidência Arqueológica</p>
                        <p className="text-sm text-muted-foreground">
                          "A inscrição de Calcedônia representa o testemunho mais antigo do culto cristão a São Cristóvão, 
                          precedendo as lendas medievais em vários séculos."
                        </p>
                      </div>
                    </motion.div>
                  )}
                  
                  <Button
                    variant="ghost"
                    onClick={() => toggleSection('historical')}
                    className="w-full mt-4"
                  >
                    {expandedSection === 'historical' ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Menos detalhes
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Ver evidências completas
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lendas */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-200 dark:bg-emerald-700">
                    <ScrollText className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">As Narrativas que Moldaram a Devoção</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Lendas Ocidental e Oriental</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Lenda Ocidental */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-trucker-blue/20 text-trucker-blue">
                        Lenda Ocidental
                      </Badge>
                      <span className="text-sm text-muted-foreground">Legenda Áurea</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      A história de <strong>Reprobus</strong>, um gigante em busca do mestre mais poderoso do mundo. 
                      Após servir a um rei e depois ao diabo, descobre que Cristo é superior a ambos. 
                      Passa a ajudar viajantes a atravessar um rio perigoso até carregar uma criança que se revela ser Jesus.
                    </p>
                  </div>

                  {/* Tabela Comparativa */}
                  {expandedSection === 'legends' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="pt-4 border-t"
                    >
                      <h4 className="font-semibold mb-4">Comparação entre as Lendas</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border rounded-lg">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="border border-border p-3 text-left font-medium">Aspecto</th>
                              <th className="border border-border p-3 text-left font-medium">Lenda Ocidental</th>
                              <th className="border border-border p-3 text-left font-medium">Lenda Oriental</th>
                            </tr>
                          </thead>
                          <tbody>
                            {legendComparison.map((item, index) => (
                              <tr key={index} className="hover:bg-muted/30">
                                <td className="border border-border p-3 font-medium">{item.attribute}</td>
                                <td className="border border-border p-3 text-sm">{item.western}</td>
                                <td className="border border-border p-3 text-sm">{item.eastern}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => toggleSection('legends')}
                    className="w-full"
                  >
                    {expandedSection === 'legends' ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Ocultar comparação
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Comparar as duas lendas
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Martírio */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-200 dark:bg-red-700">
                    <Sword className="w-5 h-5 text-red-700 dark:text-red-300" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">O Sacrifício que Selou a Santidade</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">O martírio e os milagres</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed">
                  O martírio de Cristóvão incluiu espancamentos, tentativa de morte no fogo (do qual foi preservado), 
                  e finalmente a decapitação. Segundo a tradição, após sua morte, seu cajado floresceu e 
                  o rei Dagno, que ordenara sua execução, foi curado da cegueira, reforçando o <strong>poder protetor do santo</strong>.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};