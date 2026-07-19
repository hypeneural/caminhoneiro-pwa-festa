import { useEffect, useMemo, useState } from 'react';
import {
  ApiBanner,
  ApiSponsor,
  bannerService,
} from '@/services/api/bannerService';
import type { Banner } from '@/types/sponsors';
import type { SponsorGalleryBranding } from '@/types/sponsorGallery';
import {
  getSponsorSlugCandidates,
  normalizeSponsorSlug,
  sponsorMatchesSlug,
} from '@/utils/sponsorGallery';

interface SponsorCatalog {
  sponsors: ApiSponsor[];
  banners: ApiBanner[];
}

interface SponsorGalleryState {
  branding: SponsorGalleryBranding | null;
  isLoading: boolean;
  error: string | null;
}

let sponsorCatalogPromise: Promise<SponsorCatalog> | null = null;

const loadSponsorCatalog = (): Promise<SponsorCatalog> => {
  if (!sponsorCatalogPromise) {
    sponsorCatalogPromise = Promise.all([
      bannerService.getAllSponsors(),
      bannerService.getAllBanners('home'),
    ])
      .then(([sponsors, banners]) => {
        if (sponsors.length === 0) {
          throw new Error('Nenhum apoiador ativo foi retornado pela API.');
        }

        return { sponsors, banners };
      })
      .catch((error) => {
        sponsorCatalogPromise = null;
        throw error;
      });
  }

  return sponsorCatalogPromise;
};

const toBanner = (banner: ApiBanner): Banner => ({
  id: banner.id,
  title: banner.title,
  description: banner.description,
  imageUrlWebp: banner.imageUrlWebp,
  imageUrl: banner.imageUrl,
  linkUrl: banner.linkUrl,
  target: banner.target,
  priority: banner.priority,
  position: banner.priority,
  category: 'banner',
  isActive: true,
  altText: `Banner ${banner.title}`,
});

const findSponsorBanner = (
  sponsor: ApiSponsor,
  banners: ApiBanner[],
): ApiBanner | undefined => {
  const bannerById = banners.find((banner) => banner.id === sponsor.id);
  if (bannerById) return bannerById;

  const sponsorNames = new Set([
    normalizeSponsorSlug(sponsor.companyName),
    ...getSponsorSlugCandidates(sponsor),
  ]);

  return banners.find((banner) => sponsorNames.has(normalizeSponsorSlug(banner.title)));
};

export const useSponsorGallery = (requestedSlug?: string): SponsorGalleryState => {
  const normalizedSlug = useMemo(
    () => (requestedSlug ? normalizeSponsorSlug(requestedSlug) : ''),
    [requestedSlug],
  );
  const [state, setState] = useState<SponsorGalleryState>({
    branding: null,
    isLoading: Boolean(normalizedSlug),
    error: null,
  });

  useEffect(() => {
    let isCurrent = true;

    if (!normalizedSlug) {
      setState({ branding: null, isLoading: false, error: null });
      return () => {
        isCurrent = false;
      };
    }

    setState({ branding: null, isLoading: true, error: null });

    loadSponsorCatalog()
      .then(({ sponsors, banners }) => {
        if (!isCurrent) return;

        const sponsor = sponsors.find((item) => sponsorMatchesSlug(item, normalizedSlug));
        if (!sponsor) {
          setState({
            branding: null,
            isLoading: false,
            error: 'Apoiador não encontrado.',
          });
          return;
        }

        const sponsorBanner = findSponsorBanner(sponsor, banners);
        const canonicalSlug = getSponsorSlugCandidates(sponsor)[0] || normalizedSlug;

        setState({
          branding: {
            id: sponsor.id,
            slug: canonicalSlug,
            name: sponsor.companyName,
            logoUrlWebp: sponsor.logoUrlWebp,
            logoUrl: sponsor.logoUrl,
            websiteUrl: sponsor.websiteUrl,
            banner: sponsorBanner ? toBanner(sponsorBanner) : null,
          },
          isLoading: false,
          error: null,
        });
      })
      .catch(() => {
        if (!isCurrent) return;
        setState({
          branding: null,
          isLoading: false,
          error: 'Não foi possível carregar os dados deste apoiador.',
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [normalizedSlug]);

  return state;
};

export default useSponsorGallery;
