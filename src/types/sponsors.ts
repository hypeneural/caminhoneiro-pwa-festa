
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  imageUrlWebp?: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'patrocinador' | 'apoiador' | 'promocional';
  dimensions: {
    width: number;
    height: number;
  };
  fallbackColor?: string;
}

export interface SponsorLogo {
  id: string;
  companyName: string;
  logoUrl: string;
  logoUrlWebp?: string;
  websiteUrl: string;
  category: 'diamante' | 'ouro' | 'prata' | 'bronze' | 'apoiador';
  isActive: boolean;
  altText: string;
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
