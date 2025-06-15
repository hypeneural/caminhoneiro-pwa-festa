import { motion } from "framer-motion";
import { BarChart, Users, TrendingUp, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const statisticsData = [
  {
    icon: Users,
    label: "Participantes Totais",
    value: "25K+",
    change: "+150% desde 2017",
    color: "text-trucker-green"
  },
  {
    icon: Calendar,
    label: "Anos de Tradição",
    value: "22",
    change: "Desde 2003",
    color: "text-trucker-blue"
  },
  {
    icon: TrendingUp,
    label: "Crescimento Anual",
    value: "15%",
    change: "Média dos últimos 5 anos",
    color: "text-trucker-yellow"
  },
  {
    icon: MapPin,
    label: "Estados Representados",
    value: "12",
    change: "SC, PR, RS e mais",
    color: "text-trucker-red"
  }
];

const evolutionData = [
  { year: 2003, participants: 500, trucks: 150 },
  { year: 2010, participants: 1500, trucks: 400 },
  { year: 2017, participants: 8000, trucks: 2200 },
  { year: 2022, participants: 20000, trucks: 5500 },
  { year: 2025, participants: 25000, trucks: 7000 }
];

export const StatisticsSection = () => {
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
            <BarChart className="w-8 h-8 text-trucker-green" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Números da Nossa História
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dados que mostram o crescimento e a evolução da festa ao longo dos anos, 
            refletindo o impacto na comunidade e região.
          </p>
        </motion.div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statisticsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="text-center group hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <stat.icon className={`w-12 h-12 mx-auto ${stat.color}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-xs text-trucker-green">{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Evolution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6 text-center">Evolução da Participação</h3>
              
              <div className="space-y-6">
                {evolutionData.map((data, index) => (
                  <motion.div
                    key={data.year}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-trucker-blue">{data.year}</span>
                      <div className="text-sm text-muted-foreground">
                        <span className="mr-4">{data.participants.toLocaleString()} participantes</span>
                        <span>{data.trucks.toLocaleString()} caminhões</span>
                      </div>
                    </div>
                    
                    {/* Participants Bar */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-trucker-green" />
                        <span className="text-sm">Participantes</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(data.participants / 25000) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className="bg-trucker-green h-3 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Trucks Bar */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-trucker-yellow" />
                        <span className="text-sm">Caminhões</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(data.trucks / 7000) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 + 0.2 }}
                          className="bg-trucker-yellow h-3 rounded-full"
                        />
                      </div>
                    </div>

                    {index < evolutionData.length - 1 && (
                      <div className="absolute left-8 bottom-0 w-px h-6 bg-border" />
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Impact Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-trucker-blue/10 to-trucker-blue/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-bold mb-2 text-trucker-blue">Impacto Econômico</h3>
              <p className="text-2xl font-bold mb-2">R$ 2M+</p>
              <p className="text-sm text-muted-foreground">
                Movimentação anual estimada na economia local durante a festa
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-trucker-green/10 to-trucker-green/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-bold mb-2 text-trucker-green">Empregos Gerados</h3>
              <p className="text-2xl font-bold mb-2">500+</p>
              <p className="text-sm text-muted-foreground">
                Postos de trabalho temporários criados durante o evento
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-trucker-yellow/10 to-trucker-yellow/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-bold mb-2 text-trucker-yellow">Mídia Regional</h3>
              <p className="text-2xl font-bold mb-2">15+</p>
              <p className="text-sm text-muted-foreground">
                Veículos de comunicação que cobrem anualmente a festa
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};