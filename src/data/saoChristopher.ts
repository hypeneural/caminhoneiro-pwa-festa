import { 
  Shield, 
  Cross, 
  Globe, 
  BookText, 
  Search, 
  ScrollText, 
  Sword, 
  Truck, 
  Ship, 
  Car, 
  Church, 
  Flag, 
  Heart, 
  Handshake, 
  MapPin, 
  Sparkles 
} from "lucide-react";
import { SaintChristopherData, LegendComparison, TimelineEvent, DevotionPractice } from "@/types/sao-cristovao";

export const legendComparison: LegendComparison[] = [
  {
    attribute: "Nome Original",
    western: "Reprobus (Réprobo)",
    eastern: "Cristóvão Cinocéfalo"
  },
  {
    attribute: "Aparência Física",
    western: "Gigante humano de força descomunal",
    eastern: "Bárbaro com cabeça de cão"
  },
  {
    attribute: "Busca Inicial",
    western: "Servir ao rei mais poderoso do mundo",
    eastern: "Conversão do paganismo ao cristianismo"
  },
  {
    attribute: "Ato de Fé Central",
    western: "Transportar o menino Jesus através do rio",
    eastern: "Proclamar Cristo mesmo sendo bárbaro"
  },
  {
    attribute: "Simbolismo Primário",
    western: "Serviço humilde e busca pela verdade",
    eastern: "Alcance universal da fé cristã"
  }
];

export const patronageTimeline: TimelineEvent[] = [
  {
    id: "origem-lenda",
    period: "Séc. III-V d.C.",
    title: "As Origens da Lenda",
    description: "Surgimento das narrativas sobre o mártir Cristóvão, com evidências do culto primitivo na inscrição de Calcedônia (449-452 d.C.)",
    icon: Search,
    significance: "origin"
  },
  {
    id: "protetor-viajantes",
    period: "Séc. XIII-XV",
    title: "Protetor dos Viajantes",
    description: "Consolidação como patrono de viajantes na Era Medieval. Popularização do ditado 'Christophorum videas, postea tutus eas'",
    icon: Ship,
    significance: "evolution"
  },
  {
    id: "era-automovel",
    period: "Séc. XX",
    title: "A Era do Automóvel",
    description: "Recontextualização natural do patronato para motoristas e veículos motorizados com o advento da era automotiva",
    icon: Car,
    significance: "modern"
  },
  {
    id: "caminhoneiros-brasil",
    period: "1950-presente",
    title: "Caminhoneiros no Brasil",
    description: "Adoção massiva pelos caminhoneiros brasileiros, tornando-se símbolo de proteção nas estradas do país",
    icon: Truck,
    significance: "brazil"
  }
];

export const devotionPractices: DevotionPractice[] = [
  {
    id: "festas-carreatas",
    title: "Festas e Carreatas",
    description: "Celebrações anuais em 25 de julho com procissões de caminhões e bênçãos coletivas",
    type: "celebration",
    icon: Flag,
    location: "Todo o Brasil"
  },
  {
    id: "cultura-material",
    title: "Adorno dos Caminhões",
    description: "Medalhas, adesivos e imagens do santo decorando cabines como objetos de devoção pessoal",
    type: "tradition",
    icon: Heart,
    location: "Cabines dos caminhões"
  },
  {
    id: "oracao-viagem",
    title: "Oração Antes da Viagem",
    description: "Rezas específicas pedindo proteção antes de iniciar jornadas longas",
    type: "prayer",
    icon: Cross,
    location: "Cabine do caminhão"
  },
  {
    id: "bencao-veiculos",
    title: "Bênção de Veículos",
    description: "Cerimônias religiosas para abençoar caminhões e pedir proteção divina",
    type: "blessing",
    icon: Church,
    location: "Igrejas e eventos"
  }
];

export const saintChristopherData: SaintChristopherData = {
  historicalFacts: [
    {
      id: "evidencias-historicas",
      icon: Search,
      title: "Evidências do Culto Primitivo",
      content: "A existência histórica de um mártir chamado Cristóvão é confirmada por evidências arqueológicas e documentais. A inscrição em pedra encontrada em Calcedônia, datada entre 449-452 d.C., é o mais antigo testemunho do culto ao santo. Além disso, figuras como São Gregório Magno fazem menções ao mártir, confirmando que a Igreja reconhece a existência histórica do santo, distinguindo-a das lendas posteriores.",
      isExpandable: true
    }
  ],
  legends: legendComparison,
  patronageEvolution: patronageTimeline,
  brazilianHistory: [
    {
      id: "chegada-brasil",
      icon: Flag,
      title: "A Chegada ao Brasil",
      content: "A devoção a São Cristóvão chegou ao Brasil no século XVI com os jesuítas, integrando-se rapidamente à religiosidade popular. Com o desenvolvimento do transporte rodoviário brasileiro, especialmente a partir dos anos 1950, os motoristas encontraram no santo um protetor ideal para os desafios das estradas. A localização estratégica de cidades como Tijucas, na BR-101, contribuiu para o fortalecimento dessa tradição.",
      isExpandable: false
    }
  ],
  devotionPractices
};