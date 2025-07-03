import { SponsorsData } from '@/types/sponsors';

export const mockSponsorsData: SponsorsData = {
  banners: [
    {
      id: 1,
      title: 'Auto Peças Central',
      description: 'Tudo para seu caminhão',
      imageUrl: 'https://via.placeholder.com/800x300/0066cc/ffffff?text=Auto+Pe%C3%A7as+Central',
      imageUrlWebp: 'https://via.placeholder.com/800x300/0066cc/ffffff?text=Auto+Pe%C3%A7as+Central',
      linkUrl: 'https://autopecascentral.com.br',
      target: '_blank' as const,
      priority: 10,
      position: 1,
      altText: 'Banner da Auto Peças Central'
    },
    {
      id: 2,
      title: 'Posto Rodoviário São José',
      description: 'Combustível e serviços',
      imageUrl: 'https://via.placeholder.com/800x300/dc2626/ffffff?text=Posto+S%C3%A3o+Jos%C3%A9',
      imageUrlWebp: 'https://via.placeholder.com/800x300/dc2626/ffffff?text=Posto+S%C3%A3o+Jos%C3%A9',
      linkUrl: 'https://postosaojose.com.br',
      target: '_blank' as const,
      priority: 9,
      position: 2,
      altText: 'Banner do Posto Rodoviário São José'
    }
  ],
  sponsors: [
    {
      id: 1,
      companyName: 'Scania',
      logoUrl: 'https://via.placeholder.com/200x100/000000/ffffff?text=Scania',
      logoUrlWebp: 'https://via.placeholder.com/200x100/000000/ffffff?text=Scania',
      websiteUrl: 'https://scania.com.br',
      packageType: 1,
      priority: 10,
      altText: 'Logo da Scania'
    },
    {
      id: 2,
      companyName: 'Volvo',
      logoUrl: 'https://via.placeholder.com/200x100/000000/ffffff?text=Volvo',
      logoUrlWebp: 'https://via.placeholder.com/200x100/000000/ffffff?text=Volvo',
      websiteUrl: 'https://volvo.com.br',
      packageType: 2,
      priority: 9,
      altText: 'Logo da Volvo'
    }
  ],
  positions: [
    { id: 'pos-1', name: 'Após Stories', description: 'Banner após seção de stories', maxBanners: 5, isActive: true },
    { id: 'pos-2', name: 'Entre Sections', description: 'Banner entre seções', maxBanners: 3, isActive: true }
  ],
  lastUpdated: new Date().toISOString()
};