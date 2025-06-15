import { MenuItem, MenuReview, Promotion } from "@/types/menu";

export const mockMenuItems: MenuItem[] = [
  // Pratos Principais
  {
    id: "1",
    name: "Costela no Bafo",
    description: "Costela bovina cozida lentamente com temperos especiais",
    longDescription: "Nossa famosa costela é cozida por mais de 8 horas em fogo baixo, temperada com ervas regionais e servida com farofa especial da casa. Uma tradição que passa de geração em geração.",
    price: 28.90,
    currency: "BRL",
    category: "main",
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop"
    ],
    ingredients: ["Costela bovina", "Alho", "Cebola", "Pimentão", "Temperos especiais", "Farofa"],
    allergens: ["Glúten"],
    nutritionalInfo: {
      calories: 650,
      protein: 45,
      carbs: 25,
      fat: 35
    },
    tags: ["popular", "large-portion"],
    preparationTime: 25,
    rating: {
      average: 4.8,
      count: 142
    },
    vendor: {
      name: "Churrascaria do João",
      location: "Praça Principal",
      type: "food-court"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "11:00",
        end: "22:00"
      }
    },
    promotions: [
      {
        type: "combo",
        description: "Costela + Bebida + Sobremesa por R$ 35,90"
      }
    ]
  },
  {
    id: "2",
    name: "Frango Caipira Assado",
    description: "Frango caipira temperado e assado na brasa",
    longDescription: "Frango criado solto, temperado com ervas frescas e assado lentamente na brasa. Servido com batata doce e vinagrete especial.",
    price: 22.50,
    currency: "BRL",
    category: "main",
    images: [
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop"
    ],
    ingredients: ["Frango caipira", "Batata doce", "Alecrim", "Alho", "Limão", "Pimenta"],
    tags: ["gluten-free", "popular"],
    preparationTime: 30,
    rating: {
      average: 4.6,
      count: 89
    },
    vendor: {
      name: "Galinheiro da Vovó",
      location: "Food Truck 3",
      type: "food-truck"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "10:00",
        end: "21:00"
      }
    }
  },

  // Comidas Regionais
  {
    id: "3",
    name: "Feijão Tropeiro Mineiro",
    description: "Feijão com farinha, linguiça, bacon e couve",
    longDescription: "Receita tradicional mineira com feijão carioca, farinha de mandioca torrada, linguiça artesanal, bacon defumado e couve refogada.",
    price: 18.90,
    currency: "BRL",
    category: "regional",
    images: [
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop"
    ],
    ingredients: ["Feijão carioca", "Farinha de mandioca", "Linguiça", "Bacon", "Couve", "Alho"],
    allergens: ["Glúten"],
    tags: ["popular", "large-portion"],
    preparationTime: 20,
    rating: {
      average: 4.7,
      count: 156
    },
    vendor: {
      name: "Casa Mineira",
      location: "Barraca Regional 1",
      type: "regional-stand"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "09:00",
        end: "20:00"
      }
    }
  },
  {
    id: "4",
    name: "Pamonha Doce",
    description: "Pamonha cremosa com leite de coco",
    longDescription: "Pamonha artesanal feita com milho verde fresco, leite de coco e açúcar cristal. Cozida na própria palha para preservar todo o sabor.",
    price: 8.50,
    currency: "BRL",
    category: "regional",
    images: [
      "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop"
    ],
    ingredients: ["Milho verde", "Leite de coco", "Açúcar", "Canela"],
    tags: ["vegetarian", "gluten-free", "new"],
    preparationTime: 15,
    rating: {
      average: 4.4,
      count: 67
    },
    vendor: {
      name: "Cantinho da Roça",
      location: "Barraca Regional 2",
      type: "regional-stand"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "08:00",
        end: "18:00"
      }
    }
  },

  // Petiscos
  {
    id: "5",
    name: "Linguiça Calabresa na Brasa",
    description: "Linguiça artesanal grelhada com pimentões",
    longDescription: "Linguiça calabresa artesanal grelhada na brasa, servida com pimentões coloridos e pão francês quentinho.",
    price: 15.90,
    currency: "BRL",
    category: "snacks",
    images: [
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop"
    ],
    ingredients: ["Linguiça calabresa", "Pimentão vermelho", "Pimentão amarelo", "Cebola", "Pão francês"],
    tags: ["spicy", "popular"],
    preparationTime: 12,
    rating: {
      average: 4.5,
      count: 98
    },
    vendor: {
      name: "Churrascaria do João",
      location: "Praça Principal",
      type: "food-court"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "16:00",
        end: "23:00"
      }
    },
    promotions: [
      {
        type: "happy-hour",
        description: "Happy Hour: 2 por R$ 25,00 das 16h às 18h"
      }
    ]
  },

  // Bebidas
  {
    id: "6",
    name: "Cerveja Artesanal IPA",
    description: "Cerveja artesanal lupulada gelada",
    longDescription: "Cerveja IPA artesanal produzida localmente, com notas cítricas e amargor equilibrado. Servida sempre gelada.",
    price: 12.00,
    currency: "BRL",
    category: "drinks",
    images: [
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop"
    ],
    ingredients: ["Malte", "Lúpulo", "Levedura", "Água"],
    tags: ["popular", "new"],
    preparationTime: 2,
    rating: {
      average: 4.3,
      count: 203
    },
    vendor: {
      name: "Cervejaria Local",
      location: "Bar da Festa",
      type: "food-court"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "12:00",
        end: "24:00"
      }
    }
  },

  // Sobremesas
  {
    id: "7",
    name: "Pudim de Leite Condensado",
    description: "Pudim cremoso com calda de açúcar queimado",
    longDescription: "Pudim tradicional feito com leite condensado, ovos frescos e calda de açúcar queimado. Uma sobremesa que derrete na boca.",
    price: 9.90,
    currency: "BRL",
    category: "desserts",
    images: [
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop"
    ],
    ingredients: ["Leite condensado", "Ovos", "Açúcar", "Leite"],
    tags: ["vegetarian", "gluten-free", "popular"],
    preparationTime: 5,
    rating: {
      average: 4.9,
      count: 87
    },
    vendor: {
      name: "Doces da Vovó",
      location: "Praça das Sobremesas",
      type: "food-court"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "10:00",
        end: "22:00"
      }
    }
  },

  // Lanches Rápidos
  {
    id: "8",
    name: "X-Tudo Caminhoneiro",
    description: "Hambúrguer gigante com todos os acompanhamentos",
    longDescription: "Hambúrguer artesanal de 200g, queijo, presunto, bacon, ovo, alface, tomate, milho, ervilha, batata palha e molho especial.",
    price: 19.90,
    currency: "BRL",
    category: "fast",
    images: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop"
    ],
    ingredients: ["Hambúrguer 200g", "Queijo", "Presunto", "Bacon", "Ovo", "Vegetais", "Molho especial"],
    tags: ["large-portion", "popular"],
    preparationTime: 15,
    rating: {
      average: 4.4,
      count: 234
    },
    vendor: {
      name: "Lanchonete da Estrada",
      location: "Food Truck 1",
      type: "food-truck"
    },
    availability: {
      days: ["saturday", "sunday"],
      hours: {
        start: "18:00",
        end: "02:00"
      }
    }
  }
];

export const mockReviews: MenuReview[] = [
  {
    id: "r1",
    menuItemId: "1",
    author: {
      name: "Carlos Silva",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
    },
    rating: 5,
    comment: "Melhor costela que já comi! Derrete na boca, tempero perfeito. Vale cada centavo!",
    date: new Date('2024-01-15'),
    likes: 23,
    verified: true
  },
  {
    id: "r2",
    menuItemId: "1",
    author: {
      name: "Maria Santos",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b332c5cd?w=50&h=50&fit=crop&crop=face"
    },
    rating: 4,
    comment: "Muito boa, mas achei um pouco salgada. A farofa estava deliciosa!",
    photos: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=150&fit=crop"],
    date: new Date('2024-01-14'),
    likes: 12,
    verified: true
  },
  {
    id: "r3",
    menuItemId: "3",
    author: {
      name: "João Pereira",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face"
    },
    rating: 5,
    comment: "Igualzinho ao da minha vó! Sabor autêntico de Minas. Recomendo demais!",
    date: new Date('2024-01-13'),
    likes: 18,
    verified: true
  }
];

export const mockPromotions: Promotion[] = [
  {
    id: "p1",
    title: "Combo Caminhoneiro",
    description: "Prato Principal + Bebida + Sobremesa",
    type: "combo",
    validUntil: new Date('2024-02-29'),
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=200&fit=crop",
    items: ["1", "6", "7"],
    originalPrice: 50.80,
    promotionalPrice: 39.90
  },
  {
    id: "p2",
    title: "Happy Hour das Bebidas",
    description: "Todas as bebidas com 20% de desconto",
    type: "happy-hour",
    validUntil: new Date('2024-01-31'),
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=200&fit=crop",
    discountPercentage: 20
  },
  {
    id: "p3",
    title: "Família Tradicional",
    description: "4 Pratos Regionais + 4 Bebidas",
    type: "special",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=200&fit=crop",
    items: ["3", "4"],
    originalPrice: 120.00,
    promotionalPrice: 89.90
  }
];