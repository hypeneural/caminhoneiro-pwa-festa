export interface Banner {
  id: number;
  title: string;
  description: string | null;
  imageUrlWebp: string;
  imageUrl: string;
  linkUrl: string | null;
  target: '_blank' | '_self';
  priority: number;
  altText?: string;
  position: number;
}

export interface SponsorLogo {
  id: number;
  companyName: string;
  logoUrlWebp: string;
  logoUrl: string;
  websiteUrl: string;
  packageType: 1 | 2; // 1 = Destaque, 2 = Apoiador
  priority: number;
}

export interface BannerPosition {
  id: string;
  name: string;
  description: string;
  maxBanners: number;
  isActive: boolean;
}

export interface SponsorsData {
  banners: Banner[];
  sponsors: SponsorLogo[];
  positions: BannerPosition[];
  lastUpdated: string;
}

interface ApiMeta {
  total_registros_filtrados: number;
  pagina_atual: number;
  registros_por_pagina: number;
  total_paginas: number;
  filtros_aplicados: Record<string, string>;
  links: {
    self: string;
    proxima_pagina?: string;
  };
}

interface ApiResponse<T> {
  status: string;
  message: string;
  meta: ApiMeta;
  data: T[];
}

export type BannerResponse = ApiResponse<Banner>;
export type SponsorResponse = ApiResponse<SponsorLogo>;
