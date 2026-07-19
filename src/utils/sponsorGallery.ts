import type { ApiSponsor } from '@/services/api/bannerService';

export const normalizeSponsorSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getAssetSlug = (url: string): string | null => {
  if (!url) return null;

  const cleanUrl = url.split(/[?#]/, 1)[0];
  const filename = cleanUrl.split('/').pop();
  if (!filename) return null;

  const slug = normalizeSponsorSlug(filename.replace(/\.[a-z0-9]+$/i, ''));
  return slug || null;
};

export const getSponsorSlugCandidates = (sponsor: ApiSponsor): string[] => {
  const candidates = [
    getAssetSlug(sponsor.logoUrlWebp),
    getAssetSlug(sponsor.logoUrl),
    normalizeSponsorSlug(sponsor.companyName),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return Array.from(new Set(candidates));
};

export const sponsorMatchesSlug = (sponsor: ApiSponsor, requestedSlug: string): boolean => {
  const normalizedSlug = normalizeSponsorSlug(requestedSlug);
  return getSponsorSlugCandidates(sponsor).includes(normalizedSlug);
};
