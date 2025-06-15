import { NewsItem } from '@/types/news';

export const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Inscrições abertas para a bênção dos caminhões",
    summary: "Caminhoneiros podem se inscrever gratuitamente para participar da tradicional bênção que acontecerá no primeiro dia do evento.",
    imageUrl: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=400",
    publishedAt: new Date('2025-06-10'),
    category: "Inscrições",
    categoryColor: "bg-trucker-green",
    author: "Equipe de Organização",
    slug: "inscricoes-bencao-caminhoes",
    views: 234,
    likes: 45,
    tags: ["bênção", "inscrições", "caminhões"],
    featured: true
  },
  {
    id: "2",
    title: "Shows confirmados para os dois dias de festa",
    summary: "Lineup completo foi divulgado com artistas sertanejos e bandas locais que vão animar a festa dos caminhoneiros.",
    imageUrl: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?auto=format&fit=crop&q=80&w=400",
    publishedAt: new Date('2025-06-08'),
    category: "Programação",
    categoryColor: "bg-trucker-orange",
    author: "Equipe Cultural",
    slug: "shows-confirmados-festa",
    views: 189,
    likes: 67,
    tags: ["shows", "música", "programação"],
    featured: true
  },
  {
    id: "3",
    title: "Rota da procissão de São Cristóvão definida",
    summary: "O percurso tradicional será mantido, passando pelos principais pontos da cidade com paradas estratégicas para bênçãos.",
    imageUrl: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?auto=format&fit=crop&q=80&w=400",
    publishedAt: new Date('2025-06-05'),
    category: "Religioso",
    categoryColor: "bg-trucker-blue",
    author: "Comissão Religiosa",
    slug: "rota-procissao-definida",
    views: 156,
    likes: 89,
    tags: ["procissão", "rota", "religioso"],
    featured: false
  },
  {
    id: "4",
    title: "Expectativa de público recorde em 2025",
    summary: "Organização espera receber mais de 10 mil visitantes nos dois dias de festa, superando números dos anos anteriores.",
    imageUrl: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=400",
    publishedAt: new Date('2025-06-03'),
    category: "Evento",
    categoryColor: "bg-trucker-red",
    author: "Coordenação Geral",
    slug: "expectativa-publico-recorde",
    views: 298,
    likes: 123,
    tags: ["público", "expectativa", "números"],
    featured: false
  }
];