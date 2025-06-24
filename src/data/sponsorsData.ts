
import { SponsorsData } from '@/types/sponsors';

export const mockSponsorsData: SponsorsData = {
  banners: [
    {
      id: 'banner-1',
      title: 'Auto Peças Central',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=360&fit=crop',
      imageUrlWebp: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=360&fit=crop&fm=webp',
      linkUrl: 'https://autopecascentral.com.br',
      altText: 'Banner da Auto Peças Central - Tudo para seu caminhão',
      isActive: true,
      priority: 'high',
      category: 'patrocinador',
      dimensions: { width: 1080, height: 360 },
      fallbackColor: '#1e40af'
    },
    {
      id: 'banner-2',
      title: 'Posto Rodoviário São José',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1080&h=360&fit=crop',
      imageUrlWebp: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1080&h=360&fit=crop&fm=webp',
      linkUrl: 'https://postosaojose.com.br',
      altText: 'Banner do Posto Rodoviário São José - Combustível e serviços',
      isActive: true,
      priority: 'high',
      category: 'patrocinador',
      dimensions: { width: 1080, height: 360 },
      fallbackColor: '#dc2626'
    },
    {
      id: 'banner-3',
      title: 'Restaurante do Caminhoneiro',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&h=360&fit=crop',
      imageUrlWebp: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&h=360&fit=crop&fm=webp',
      linkUrl: 'https://restaurantecaminhoneiro.com.br',
      altText: 'Banner do Restaurante do Caminhoneiro - Comida caseira na estrada',
      isActive: true,
      priority: 'medium',
      category: 'apoiador',
      dimensions: { width: 1080, height: 360 },
      fallbackColor: '#ea580c'
    },
    {
      id: 'banner-4',
      title: 'Oficina Mecânica do João',
      imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1080&h=360&fit=crop',
      imageUrlWebp: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1080&h=360&fit=crop&fm=webp',
      linkUrl: 'https://oficinamecanica.com.br',
      altText: 'Banner da Oficina Mecânica do João - Consertos e manutenção',
      isActive: true,
      priority: 'medium',
      category: 'apoiador',
      dimensions: { width: 1080, height: 360 },
      fallbackColor: '#16a34a'
    },
    {
      id: 'banner-5',
      title: 'Borracharia 24h',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=360&fit=crop',
      imageUrlWebp: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=360&fit=crop&fm=webp',
      linkUrl: 'https://borracharia24h.com.br',
      altText: 'Banner da Borracharia 24h - Serviços emergenciais para caminhões',
      isActive: true,
      priority: 'low',
      category: 'apoiador',
      dimensions: { width: 1080, height: 360 },
      fallbackColor: '#7c3aed'
    }
  ],
  sponsors: [
    {
      id: 'sponsor-1',
      companyName: 'Scania',
      logoUrl: 'https://images.unsplash.com/photo-1664391641008-2bea1eacc28e?w=300&h=300&fit=crop',
      logoUrlWebp: 'https://images.unsplash.com/photo-1664391641008-2bea1eacc28e?w=300&h=300&fit=crop&fm=webp',
      websiteUrl: 'https://scania.com.br',
      category: 'diamante',
      isActive: true,
      altText: 'Logo da Scania'
    },
    {
      id: 'sponsor-2',
      companyName: 'Volvo',
      logoUrl: 'https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=300&h=300&fit=crop',
      logoUrlWebp: 'https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=300&h=300&fit=crop&fm=webp',
      websiteUrl: 'https://volvo.com.br',
      category: 'diamante',
      isActive: true,
      altText: 'Logo da Volvo'
    },
    {
      id: 'sponsor-3',
      companyName: 'Mercedes-Benz',
      logoUrl: 'https://images.unsplash.com/photo-1606148784004-2eb5e1ed5b27?w=300&h=300&fit=crop',
      logoUrlWebp: 'https://images.unsplash.com/photo-1606148784004-2eb5e1ed5b27?w=300&h=300&fit=crop&fm=webp',
      websiteUrl: 'https://mercedes-benz.com.br',
      category: 'ouro',
      isActive: true,
      altText: 'Logo da Mercedes-Benz'
    },
    {
      id: 'sponsor-4',
      companyName: 'Ford Cargo',
      logoUrl: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=300&fit=crop',
      logoUrlWebp: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=300&fit=crop&fm=webp',
      websiteUrl: 'https://ford.com.br',
      category: 'ouro',
      isActive: true,
      altText: 'Logo da Ford Cargo'
    },
    {
      id: 'sponsor-5',
      companyName: 'Iveco',
      logoUrl: 'https://images.unsplash.com/photo-1591254378352-d67451e9df96?w=300&h=300&fit=crop',
      logoUrlWebp: 'https://images.unsplash.com/photo-1591254378352-d67451e9df96?w=300&h=300&fit=crop&fm=webp',
      websiteUrl: 'https://iveco.com.br',
      category: 'prata',
      isActive: true,
      altText: 'Logo da Iveco'
    },
    {
      id: 'sponsor-6',
      companyName: 'DAF',
      logoUrl: 'https://images.unsplash.com/photo-1580414159995-1d4a4c8eca55?w=300&h=300&fit=crop',
      logoUrlWebp: 'https://images.unsplash.com/photo-1580414159995-1d4a4c8eca55?w=300&h=300&fit=crop&fm=webp',
      websiteUrl: 'https://daf.com.br',
      category: 'bronze',
      isActive: true,
      altText: 'Logo da DAF'
    }
  ],
  positions: [
    { id: 'pos-1', name: 'Após Stories', description: 'Banner após seção de stories', maxBanners: 5, isActive: true },
    { id: 'pos-2', name: 'Entre Tracker e News', description: 'Banner entre tracker e notícias', maxBanners: 5, isActive: true },
    { id: 'pos-3', name: 'Entre Photo e Quick Access', description: 'Banner entre fotos e acesso rápido', maxBanners: 4, isActive: true },
    { id: 'pos-4', name: 'Antes dos Créditos', description: 'Banner antes da seção de créditos', maxBanners: 3, isActive: true }
  ],
  lastUpdated: new Date().toISOString()
};
