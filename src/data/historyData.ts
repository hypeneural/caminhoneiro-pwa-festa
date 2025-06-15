import { HistoricalMilestone, Testimonial } from '@/types/history';

export const historicalMilestones: HistoricalMilestone[] = [
  {
    id: 'genesis-2003',
    year: 2003,
    title: 'O Gênese de uma Tradição',
    description: 'A 1ª edição da Festa do Caminhoneiro nasce em Tijucas, unindo fé e valorização da profissão.',
    longDescription: 'A 1ª edição da Festa do Caminhoneiro, que viria a se tornar um marco em Tijucas, provavelmente teve início por volta de 2003. Sem registros formais detalhados, acredita-se que a celebração nasceu de forma orgânica, por iniciativa da comunidade local de caminhoneiros e da Igreja de Santa Terezinha, no bairro Universitário. A localização estratégica de Tijucas, próxima à BR-101, foi um fator inspirador para a criação do evento, unindo fé e a valorização da profissão.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=800',
        caption: 'Primeiros caminhões na Igreja Santa Terezinha',
        year: 2003,
        isHistorical: true
      }
    ],
    significance: 'foundation',
    participantsEstimate: '500 participantes',
    keyFigures: [
      {
        name: 'Pe. João Silva',
        role: 'Pároco da Igreja Santa Terezinha',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
      }
    ],
    context: 'Início orgânico na comunidade do bairro Universitário',
    relatedEvents: ['Fundação da tradição religiosa local'],
    sources: ['Relatos da comunidade local']
  },
  {
    id: 'sesquicentenario-2010',
    year: 2010,
    title: 'Festa no Sesquicentenário de Tijucas',
    description: 'A festa ganha destaque ao integrar as comemorações dos 150 anos de Tijucas.',
    longDescription: 'A Festa do Caminhoneiro ganha destaque ao integrar as comemorações do Sesquicentenário de Tijucas. Caminhoneiros, em uma emocionante carreata, carregam a bandeira do município e o selo comemorativo dos 150 anos, solidificando a festa como um evento de relevância cultural e cívica para a cidade.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518877593221-1f28583780b4?auto=format&fit=crop&q=80&w=800',
        caption: 'Carreata com bandeira de Tijucas',
        year: 2010,
        isHistorical: true
      }
    ],
    significance: 'recognition',
    participantsEstimate: '1.5K participantes',
    context: 'Integração com celebrações municipais oficiais',
    relatedEvents: ['Sesquicentenário de Tijucas', 'Reconhecimento municipal']
  },
  {
    id: 'consolidacao-2017',
    year: 2017,
    title: 'Tradição Consolidada: 15 Anos de Celebração',
    description: 'A 15ª edição marca a consolidação definitiva da festa como tradição regional.',
    longDescription: 'A Festa celebra sua 15ª edição, já estabelecida como uma tradição consolidada em Tijucas. O evento atrai grande público e conta com atrações de peso, como o show da dupla Hugo e Thiago, reforçando seu status como um dos maiores encontros de caminhoneiros da região.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&q=80&w=800',
        caption: 'Show da dupla Hugo e Thiago',
        year: 2017,
        isHistorical: false
      }
    ],
    significance: 'growth',
    participantsEstimate: '8K participantes',
    keyFigures: [
      {
        name: 'Hugo e Thiago',
        role: 'Dupla sertaneja - Atração principal',
        photo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=200'
      }
    ],
    context: 'Consolidação como evento regional de grande porte',
    relatedEvents: ['Shows de artistas nacionais', 'Expansão da programação']
  },
  {
    id: 'controversias-2022',
    year: 2022,
    title: 'O Ano das Multas: Um Desafio na Procissão',
    description: 'Controvérsias com multas de trânsito geram preocupações sobre a continuidade.',
    longDescription: 'A festa enfrenta um momento de controvérsia. Durante a tradicional procissão, a aplicação de multas de trânsito (por infrações como uso de celular e falta de cinto de segurança) gera insatisfação entre os caminhoneiros. O incidente levanta preocupações sobre a continuidade do evento, destacando a necessidade de melhor coordenação entre organizadores e autoridades.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=800',
        caption: 'Procissão de caminhões enfrentando desafios',
        year: 2022,
        isHistorical: false
      }
    ],
    significance: 'controversy',
    participantsEstimate: '20K participantes',
    context: 'Tensões entre tradição e regulamentação de trânsito',
    relatedEvents: ['Aplicação de multas na procissão', 'Discussões sobre continuidade']
  },
  {
    id: 'futuro-2025',
    year: 2025,
    title: 'Rumo à 21ª Edição: A Tradição Continua',
    description: 'Preparação para a 21ª edição mantendo a essência e renovando a esperança.',
    longDescription: 'A Festa do Caminhoneiro se prepara para sua 21ª edição, marcada para 19 e 20 de julho de 2025, no pátio da Igreja de Santa Terezinha. Mantendo a tradição de procissões, missas, bênçãos de veículos e atrações culturais, a festa reafirma sua importância para a comunidade e para a valorização da profissão de caminhoneiro.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=800',
        caption: 'Visão futurista da festa mantendo tradições',
        year: 2025,
        isHistorical: false
      }
    ],
    significance: 'future',
    participantsEstimate: '25K+ participantes esperados',
    context: 'Renovação e continuidade para o futuro',
    relatedEvents: ['21ª edição - 19 e 20 de julho', 'Renovação das tradições']
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 'joao-silva-organizador',
    author: {
      name: 'João Silva',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      role: 'Organizador da 1ª Edição',
      yearsParticipating: 22
    },
    quote: 'Quando começamos em 2003, nunca imaginamos que a festa cresceria tanto. Era só um grupo de caminhoneiros que queria celebrar nossa fé.',
    fullTestimonial: 'A ideia nasceu de uma conversa informal após uma missa. Víamos que os caminhoneiros precisavam de um espaço para celebrar sua fé e profissão. O que começou como um encontro simples se transformou na maior festa de caminhoneiros da região.',
    year: 2023,
    category: 'organizer',
    audioUrl: '/audio/joao-silva-depoimento.mp3',
    isHighlighted: true,
    relatedMilestone: 'genesis-2003'
  },
  {
    id: 'maria-santos-caminhoneira',
    author: {
      name: 'Maria Santos',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
      role: 'Caminhoneira Veterana',
      yearsParticipating: 15
    },
    quote: 'São Cristóvão sempre me protegeu nas estradas. Esta festa é nossa forma de agradecer e pedir proteção para mais um ano.',
    fullTestimonial: 'Participo desde 2008. Ver a evolução da festa é emocionante. É aqui que renovo minha fé e encontro outros profissionais que compartilham os mesmos desafios da estrada.',
    year: 2023,
    category: 'trucker',
    isHighlighted: true,
    relatedMilestone: 'consolidacao-2017'
  },
  {
    id: 'pedro-oliveira-familia',
    author: {
      name: 'Pedro Oliveira',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      role: 'Filho de Caminhoneiro',
      yearsParticipating: 18
    },
    quote: 'Cresci vindo à festa com meu pai. Agora trago meus filhos. É uma tradição que passa de geração em geração.',
    fullTestimonial: 'A festa faz parte da minha infância e agora da dos meus filhos. É onde aprendemos sobre a importância do trabalho dos caminhoneiros e a fé em São Cristóvão.',
    year: 2023,
    category: 'family',
    isHighlighted: false,
    relatedMilestone: 'sesquicentenario-2010'
  },
  {
    id: 'ana-costa-autoridade',
    author: {
      name: 'Ana Costa',
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b332e234?auto=format&fit=crop&q=80&w=200',
      role: 'Ex-Secretária de Cultura',
      yearsParticipating: 12
    },
    quote: 'A festa é patrimônio cultural de Tijucas. Precisamos preservar essa tradição que une fé, trabalho e comunidade.',
    fullTestimonial: 'Durante meu mandato, sempre apoiei a festa. É um evento que movimenta a economia local e fortalece nossa identidade cultural.',
    year: 2022,
    category: 'authority',
    isHighlighted: false,
    relatedMilestone: 'consolidacao-2017'
  }
];

export const galleryImages = [
  {
    id: 'img-1',
    url: 'https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=400',
    title: 'Primeiros Caminhões - 2003',
    description: 'Os primeiros caminhões na Igreja Santa Terezinha marcam o início da tradição',
    decade: 2000,
    type: 'photos' as const,
    theme: 'origem',
    isHistorical: true
  },
  {
    id: 'img-2',
    url: 'https://images.unsplash.com/photo-1518877593221-1f28583780b4?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518877593221-1f28583780b4?auto=format&fit=crop&q=80&w=400',
    title: 'Carreata do Sesquicentenário - 2010',
    description: 'Caminhoneiros carregam a bandeira de Tijucas nas comemorações dos 150 anos',
    decade: 2010,
    type: 'photos' as const,
    theme: 'celebracao',
    isHistorical: true
  },
  {
    id: 'img-3',
    url: 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&q=80&w=400',
    title: 'Grande Show - 2017',
    description: 'Hugo e Thiago na 15ª edição marcam a consolidação da festa',
    decade: 2010,
    type: 'photos' as const,
    theme: 'shows',
    isHistorical: false
  },
  {
    id: 'img-4',
    url: 'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=400',
    title: 'Procissão Moderna - 2022',
    description: 'A procissão enfrentando desafios contemporâneos',
    decade: 2020,
    type: 'photos' as const,
    theme: 'procissao',
    isHistorical: false
  },
  {
    id: 'img-5',
    url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=400',
    title: 'Futuro da Tradição - 2025',
    description: 'Visão futurista mantendo a essência das tradições',
    decade: 2020,
    type: 'photos' as const,
    theme: 'futuro',
    isHistorical: false
  }
];