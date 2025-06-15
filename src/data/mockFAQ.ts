import { FAQItem, FAQCategory } from '@/types/faq';

export const mockFAQCategories: FAQCategory[] = [
  {
    id: 'all',
    name: 'Todas',
    slug: 'all',
    icon: 'HelpCircle',
    color: 'bg-gray-500',
    count: 0,
    description: 'Todas as perguntas frequentes'
  },
  {
    id: 'programacao',
    name: 'Programação',
    slug: 'programacao',
    icon: 'Calendar',
    color: 'bg-trucker-blue',
    count: 8,
    description: 'Horários e atividades do evento'
  },
  {
    id: 'localizacao',
    name: 'Localização',
    slug: 'localizacao',
    icon: 'MapPin',
    color: 'bg-trucker-green',
    count: 6,
    description: 'Como chegar e onde fica'
  },
  {
    id: 'inscricoes',
    name: 'Inscrições',
    slug: 'inscricoes',
    icon: 'Ticket',
    color: 'bg-orange-500',
    count: 5,
    description: 'Como se inscrever e participar'
  },
  {
    id: 'participacao',
    name: 'Participação',
    slug: 'participacao',
    icon: 'Users',
    color: 'bg-purple-500',
    count: 7,
    description: 'Regras e requisitos'
  },
  {
    id: 'tecnico',
    name: 'App & Técnico',
    slug: 'tecnico',
    icon: 'Smartphone',
    color: 'bg-blue-500',
    count: 4,
    description: 'Ajuda com o aplicativo'
  },
  {
    id: 'geral',
    name: 'Geral',
    slug: 'geral',
    icon: 'Info',
    color: 'bg-gray-600',
    count: 6,
    description: 'Informações gerais'
  }
];

export const mockFAQs: FAQItem[] = [
  // Programação
  {
    id: '1',
    question: 'Quais são os horários da festa?',
    answer: 'A Festa do Caminhoneiro acontece nos dias 25 e 26 de julho, das 8h às 22h. As atividades começam pela manhã com café da manhã gratuito para os caminhoneiros, seguido de shows, competições e atividades durante todo o dia.',
    category: 'programacao',
    tags: ['horario', 'cronograma', 'atividades'],
    popular: true,
    order: 1,
    lastUpdated: new Date('2024-06-01')
  },
  {
    id: '2',
    question: 'Haverá shows musicais? Quais artistas se apresentarão?',
    answer: 'Sim! Teremos shows de música sertaneja e popular brasileira. A programação completa dos artistas será divulgada em breve nas nossas redes sociais e aqui no app.',
    category: 'programacao',
    tags: ['shows', 'musica', 'artistas', 'sertanejo'],
    popular: true,
    order: 2,
    lastUpdated: new Date('2024-06-10')
  },
  {
    id: '3',
    question: 'Onde posso ver a programação completa?',
    answer: 'A programação completa está disponível na aba "Programação" do nosso app. Você também pode acessar pelo menu principal ou pelos ícones de acesso rápido na tela inicial.',
    category: 'programacao',
    tags: ['programacao', 'cronograma', 'app'],
    popular: false,
    order: 3,
    lastUpdated: new Date('2024-06-05')
  },

  // Localização
  {
    id: '4',
    question: 'Onde acontece a festa?',
    answer: 'A festa acontece na Praça Central da cidade. Você pode ver a localização exata na aba "Mapa" do aplicativo, que mostra também rotas de acesso e pontos de referência.',
    category: 'localizacao',
    tags: ['local', 'endereco', 'praca', 'mapa'],
    popular: true,
    order: 1,
    lastUpdated: new Date('2024-06-01')
  },
  {
    id: '5',
    question: 'Como chegar ao local da festa?',
    answer: 'Acesse a aba "Mapa" do app para ver rotas detalhadas. O local fica próximo ao centro da cidade, com acesso fácil pelas principais rodovias. Haverá sinalização especial durante o evento.',
    category: 'localizacao',
    tags: ['rota', 'acesso', 'como chegar', 'direcoes'],
    popular: true,
    order: 2,
    lastUpdated: new Date('2024-06-01')
  },
  {
    id: '6',
    question: 'Há estacionamento disponível?',
    answer: 'Sim, haverá estacionamento gratuito para caminhões e veículos de passeio. O estacionamento para caminhões fica em área específica com segurança 24h.',
    category: 'localizacao',
    tags: ['estacionamento', 'caminhao', 'veiculo', 'seguranca'],
    popular: false,
    order: 3,
    lastUpdated: new Date('2024-06-05')
  },

  // Inscrições
  {
    id: '7',
    question: 'Preciso me inscrever para participar?',
    answer: 'A participação na festa é gratuita e não requer inscrição prévia. Apenas algumas atividades específicas como competições podem ter inscrições no local.',
    category: 'inscricoes',
    tags: ['inscricao', 'gratuito', 'participacao'],
    popular: true,
    order: 1,
    lastUpdated: new Date('2024-06-01')
  },
  {
    id: '8',
    question: 'Como me inscrever nas competições?',
    answer: 'As inscrições para competições (como melhor caminhão decorado) são feitas no local, no dia do evento. Procure a tenda de inscrições na entrada principal.',
    category: 'inscricoes',
    tags: ['competicao', 'inscricao', 'caminhao decorado'],
    popular: false,
    order: 2,
    lastUpdated: new Date('2024-06-05')
  },

  // Participação
  {
    id: '9',
    question: 'A festa é só para caminhoneiros?',
    answer: 'Não! A festa é aberta para toda a família. Embora seja uma homenagem aos caminhoneiros, todos são bem-vindos para participar das atividades.',
    category: 'participacao',
    tags: ['familia', 'publico', 'caminhoneiros'],
    popular: true,
    order: 1,
    lastUpdated: new Date('2024-06-01')
  },
  {
    id: '10',
    question: 'Posso levar comida e bebida?',
    answer: 'Comidas caseiras são permitidas. Bebidas alcoólicas não são permitidas por questões de segurança. Haverá praça de alimentação no local.',
    category: 'participacao',
    tags: ['comida', 'bebida', 'alimentacao', 'regras'],
    popular: false,
    order: 2,
    lastUpdated: new Date('2024-06-05')
  },

  // Técnico
  {
    id: '11',
    question: 'Como baixar o aplicativo da festa?',
    answer: 'Este aplicativo pode ser instalado como um app nativo em seu celular. Procure pela opção "Instalar" ou "Adicionar à tela inicial" no menu do seu navegador.',
    category: 'tecnico',
    tags: ['app', 'instalacao', 'celular', 'pwa'],
    popular: true,
    order: 1,
    lastUpdated: new Date('2024-06-01')
  },
  {
    id: '12',
    question: 'O app funciona offline?',
    answer: 'Sim! O app funciona offline para informações básicas como programação e FAQ. Funcionalidades que dependem de internet (como mapa ao vivo) precisam de conexão.',
    category: 'tecnico',
    tags: ['offline', 'internet', 'funcionalidade'],
    popular: false,
    order: 2,
    lastUpdated: new Date('2024-06-05')
  },

  // Geral
  {
    id: '13',
    question: 'Qual é a história da Festa do Caminhoneiro?',
    answer: 'A festa é uma tradição que celebra São Cristóvão, padroeiro dos caminhoneiros. Começou como uma pequena celebração local e cresceu ao longo dos anos. Veja mais na aba "História".',
    category: 'geral',
    tags: ['historia', 'tradicao', 'sao cristovao'],
    popular: false,
    order: 1,
    lastUpdated: new Date('2024-06-01')
  },
  {
    id: '14',
    question: 'Haverá bênção dos caminhões?',
    answer: 'Sim! A tradicional bênção dos caminhões acontece no domingo às 16h, na praça principal. É um dos momentos mais emocionantes da festa.',
    category: 'geral',
    tags: ['bencao', 'caminhoes', 'tradicao', 'religioso'],
    popular: true,
    order: 2,
    lastUpdated: new Date('2024-06-01')
  }
];

// Update category counts
mockFAQCategories.forEach(category => {
  if (category.id === 'all') {
    category.count = mockFAQs.length;
  } else {
    category.count = mockFAQs.filter(faq => faq.category === category.id).length;
  }
});