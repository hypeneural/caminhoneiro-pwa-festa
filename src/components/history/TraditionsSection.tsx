import { motion } from "framer-motion";
import { HeartHandshake, Truck, Church, Users, Music, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const traditions = [
  {
    icon: Church,
    title: "Bênção dos Veículos",
    description: "Momento sagrado onde cada caminhão recebe a proteção divina de São Cristóvão",
    details: "Durante a missa especial, os veículos são aspergidos com água benta pelo pároco, que pede a proteção do santo padroeiro para todos os motoristas nas estradas.",
    significance: "Tradição central que une fé e profissão, garantindo proteção divina nas jornadas.",
    color: "text-trucker-blue"
  },
  {
    icon: Truck,
    title: "Procissão dos Caminhões",
    description: "Carreata solene pelas ruas de Tijucas demonstrando fé e união da categoria",
    details: "Centenas de caminhões ornamentados percorrem um trajeto específico pela cidade, levando a imagem de São Cristóvão e demonstrando a força e organização da categoria.",
    significance: "Demonstração pública de fé e orgulho profissional que marca presença na comunidade.",
    color: "text-trucker-yellow"
  },
  {
    icon: Music,
    title: "Cantos e Orações",
    description: "Repertório religioso tradicional que embala as celebrações litúrgicas",
    details: "Cânticos específicos a São Cristóvão, Ave Marias e orações pelos caminhoneiros são entoados durante toda a festa, criando atmosfera de devoção.",
    significance: "Mantém viva a tradição religiosa e fortalece o sentimento de comunidade.",
    color: "text-trucker-green"
  },
  {
    icon: Users,
    title: "Confraternização Familiar",
    description: "Espaço de encontro entre famílias de caminhoneiros de toda região",
    details: "Área dedicada para que as famílias se reencontrem, compartilhem experiências e fortaleçam laços comunitários, incluindo atividades para crianças.",
    significance: "Fortalece os laços familiares e comunitários da categoria caminhoneira.",
    color: "text-trucker-red"
  },
  {
    icon: Gift,
    title: "Troca de Medalhas",
    description: "Costume de presentear com medalhas e santinhos de São Cristóvão",
    details: "Tradição onde participantes trocam medalhas, santinhos e pequenos objetos religiosos como forma de compartilhar proteção e bênçãos.",
    significance: "Simboliza a partilha da fé e a extensão da proteção divina entre os devotos.",
    color: "text-purple-600"
  },
  {
    icon: HeartHandshake,
    title: "Solidariedade na Estrada",
    description: "Renovação dos votos de ajuda mútua entre caminhoneiros",
    details: "Momento de renovar compromissos de ajuda mútua nas estradas, compartilhamento de informações sobre condições de viagem e apoio em emergências.",
    significance: "Fortalece a irmandade da categoria e os valores de solidariedade profissional.",
    color: "text-trucker-orange"
  }
];

export const TraditionsSection = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <HeartHandshake className="w-8 h-8 text-trucker-red" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Nossas Tradições: Fé e Celebração
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ritos e costumes que preservam a essência espiritual e comunitária da festa, 
            conectando passado, presente e futuro em uma celebração única.
          </p>
        </motion.div>

        {/* Traditions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {traditions.map((tradition, index) => (
            <motion.div
              key={tradition.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full group hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="p-3 rounded-full bg-muted inline-flex mb-3">
                      <tradition.icon className={`w-8 h-8 ${tradition.color}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{tradition.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {tradition.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Como acontece:</h4>
                      <p className="text-xs text-muted-foreground">
                        {tradition.details}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-1">Significado:</h4>
                      <p className="text-xs text-muted-foreground">
                        {tradition.significance}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Central Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-trucker-yellow/10 to-trucker-orange/10">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">O Coração de Nossa Festa</h3>
              <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                Cada tradição carrega em si a sabedoria de gerações de caminhoneiros que encontraram 
                em São Cristóvão não apenas um protetor, mas um símbolo de coragem, solidariedade 
                e fé. Essas práticas, transmitidas de pai para filho, mantêm viva a essência 
                espiritual que faz de nossa festa muito mais que um evento: uma celebração da vida, 
                do trabalho e da união.
              </p>
              <blockquote className="text-lg italic text-trucker-yellow font-medium">
                "Tradições não são memórias do passado, são sementes do futuro."
              </blockquote>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};