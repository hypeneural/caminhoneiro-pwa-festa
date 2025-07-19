// Types baseados na API real
export interface Photo {
  id: string; // Convertido de id_foto para compatibilidade
  id_foto: number; // ID real da API
  url: string; // URL da variant full_1x para compatibilidade
  thumbnailUrl: string; // URL da variant thumbnail para compatibilidade
  title?: string; // Derivado da descrição
  description?: string; // Mapeado de descricao
  category: 'caminhoes' | 'carretas' | 'familia' | 'shows' | 'religioso' | 'geral'; // Inferido do grupo
  vehiclePlate?: string; // Mapeado de vehicle.plate
  timestamp: Date; // Convertido de data_envio
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  photographer?: string;
  views: number; // Mapeado de visualizacoes
  likes: number; // Placeholder para compatibilidade
  tags: string[]; // Derivado dos dados disponíveis
  fileSize: number; // Derivado das variants
  dimensions: {
    width: number;
    height: number;
  };
  
  // Dados reais da API
  descricao: string;
  data_envio: string;
  periodo_dia: 'MANHA' | 'TARDE' | 'NOITE' | 'MADRUGADA';
  destaque: boolean;
  visualizacoes: number;
  orientation: 'landscape' | 'portrait';
  aspect_ratio: number;
  dominant_color: string;
  blur_hash: string;
  mime_type: string;
  
  group: {
    id: number;
    nome: string;
    icone: string;
    cor: string;
  };
  
  vehicle: {
    plate: string | null;
    brand: string | null;
    model: string | null;
    category: string | null;
    year: number | null;
    color: string | null;
  };
  
  variants: {
    thumbnail?: PhotoVariant;
    preview?: PhotoVariant;
    full_1x?: PhotoVariant;
    full_2x?: PhotoVariant;
  };
  
  // Campos legados para compatibilidade
  brand?: string;
  model?: string;
  modelYear?: string;
  manufacturingYear?: string;
  color?: string;
  city?: string;
  fuelType?: string;
  vehicleType?: string;
  featured?: boolean;
  tagCategory?: string;
}

export interface PhotoVariant {
  w: number;
  h: number;
  size: number;
  avif: string | null;
  webp: string;
  jpg: string;
  placeholder: string | null;
}

export interface GalleryFilters {
  // Filtros da API
  page?: number;
  limit?: number;
  ordenar_por?: 'data_desc' | 'data_asc' | 'views_desc' | 'destaque_desc';
  destaque?: boolean;
  periodo_dia?: 'MANHA' | 'TARDE' | 'NOITE' | 'MADRUGADA';
  id_grupo_whatsapp?: number;
  data_evento?: string;
  data_inicio?: string;
  data_fim?: string;
  vehicle_plate?: string;
  vehicle_brand_id?: number;
  vehicle_model_id?: number;
  vehicle_category_id?: number;
  vehicle_year?: number;
  vehicle_color?: string;
  
  // Filtros legados para compatibilidade
  category?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'all';
  sortBy?: 'newest' | 'oldest' | 'mostViewed' | 'mostLiked';
  searchQuery?: string;
  vehiclePlate?: string;
  brand?: string;
  model?: string;
  modelYear?: string;
  manufacturingYear?: string;
  color?: string;
  city?: string;
  fuelType?: string;
  vehicleType?: string;
  specificDate?: Date;
  timeRange?: {
    start?: string;
    end?: string;
  };
  showFeaturedOnly?: boolean;
  tagCategory?: string;
}

export interface GalleryState {
  photos: Photo[];
  filteredPhotos: Photo[];
  loading: boolean;
  error: string | null;
  selectedPhoto: Photo | null;
  lightboxOpen: boolean;
  filters: GalleryFilters;
  favorites: string[];
  viewMode: 'grid' | 'masonry';
  hasMore: boolean;
  page: number;
  totalPhotos: number; // Total de fotos da API (total_registros_filtrados)
  
  // Estados adicionais para performance
  isRefreshing: boolean;
  isLoadingMore: boolean;
  networkQuality: 'slow' | 'medium' | 'fast';
  cacheStatus: 'cold' | 'warm' | 'hot';
}

export interface APIGalleryResponse {
  status: 'success' | 'error';
  message?: string;
  meta?: any[];
  data: {
    photos: Photo[];
    pagination: {
      total_registros_filtrados: number;
      pagina_atual: number;
      registros_por_pagina: number;
      total_paginas: number;
      filtros_aplicados: Record<string, string>;
      links: {
        self: string;
        proxima_pagina: string | null;
      };
    };
  };
}

export interface FilterOptions {
  datas: string[];
  tags: Array<{
    id: number;
    nome: string;
    icone: string;
    cor: string;
  }>;
  marcas: Array<{
    id: number;
    name: string;
  }>;
  categorias: Array<{
    id: number;
    name: string;
  }>;
  modelos: Array<{
    id: number;
    name: string;
  }>;
  placas: string[];
}

export type CategoryType = 'Todos' | 'Caminhões' | 'Carretas' | 'Família' | 'Shows' | 'Momentos Religiosos';

// Utilities para converter entre formatos
export const convertAPIPhotoToPhoto = (apiPhoto: any): Photo => {
  const baseUrl = apiPhoto.variants?.thumbnail?.webp || '';
  const fullUrl = apiPhoto.variants?.full_1x?.webp || apiPhoto.variants?.preview?.webp || baseUrl;
  
  return {
    // Campos de compatibilidade
    id: String(apiPhoto.id_foto),
    url: fullUrl,
    thumbnailUrl: baseUrl,
    title: apiPhoto.descricao || `Foto ${apiPhoto.id_foto}`,
    description: apiPhoto.descricao,
    category: inferCategoryFromGroup(apiPhoto.group?.nome),
    vehiclePlate: apiPhoto.vehicle?.plate || undefined,
    timestamp: new Date(apiPhoto.data_envio),
    views: apiPhoto.visualizacoes || 0,
    likes: 0, // Placeholder
    tags: generateTags(apiPhoto),
    fileSize: apiPhoto.variants?.full_1x?.size || apiPhoto.variants?.thumbnail?.size || 0,
    dimensions: {
      width: apiPhoto.variants?.full_1x?.w || apiPhoto.variants?.thumbnail?.w || 400,
      height: apiPhoto.variants?.full_1x?.h || apiPhoto.variants?.thumbnail?.h || 225,
    },
    
    // Campos da API
    id_foto: apiPhoto.id_foto,
    descricao: apiPhoto.descricao || '',
    data_envio: apiPhoto.data_envio,
    periodo_dia: apiPhoto.periodo_dia,
    destaque: apiPhoto.destaque || false,
    visualizacoes: apiPhoto.visualizacoes || 0,
    orientation: apiPhoto.orientation,
    aspect_ratio: apiPhoto.aspect_ratio,
    dominant_color: apiPhoto.dominant_color,
    blur_hash: apiPhoto.blur_hash,
    mime_type: apiPhoto.mime_type,
    group: apiPhoto.group,
    vehicle: apiPhoto.vehicle,
    variants: apiPhoto.variants,
    
    // Campos legados
    brand: apiPhoto.vehicle?.brand || undefined,
    model: apiPhoto.vehicle?.model || undefined,
    modelYear: apiPhoto.vehicle?.year?.toString() || undefined,
    manufacturingYear: apiPhoto.vehicle?.year?.toString() || undefined,
    color: apiPhoto.vehicle?.color || undefined,
    featured: apiPhoto.destaque || false,
    tagCategory: apiPhoto.group?.nome || undefined,
  };
};

const inferCategoryFromGroup = (groupName?: string): Photo['category'] => {
  if (!groupName) return 'geral';
  
  const name = groupName.toLowerCase();
  if (name.includes('transporte') || name.includes('caminhão')) return 'caminhoes';
  if (name.includes('carreta')) return 'carretas';
  if (name.includes('família') || name.includes('familia')) return 'familia';
  if (name.includes('show') || name.includes('baile')) return 'shows';
  if (name.includes('religioso') || name.includes('padre') || name.includes('benção')) return 'religioso';
  
  return 'geral';
};

const generateTags = (apiPhoto: any): string[] => {
  const tags: string[] = ['festa', 'caminhoneiro'];
  
  if (apiPhoto.vehicle?.brand) {
    tags.push(apiPhoto.vehicle.brand.toLowerCase());
  }
  
  if (apiPhoto.group?.nome) {
    tags.push(apiPhoto.group.nome.toLowerCase().replace(/\s+/g, '-'));
  }
  
  if (apiPhoto.periodo_dia) {
    tags.push(apiPhoto.periodo_dia.toLowerCase());
  }
  
  if (apiPhoto.destaque) {
    tags.push('destaque');
  }
  
  return tags;
};
