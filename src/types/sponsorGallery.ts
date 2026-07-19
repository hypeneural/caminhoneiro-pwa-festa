import type { Banner } from '@/types/sponsors';

export interface SponsorPhotoBrand {
  name: string;
  logoUrlWebp: string;
  logoUrl: string;
}

export interface SponsorGalleryBranding extends SponsorPhotoBrand {
  id: number;
  slug: string;
  websiteUrl: string;
  banner: Banner | null;
}
