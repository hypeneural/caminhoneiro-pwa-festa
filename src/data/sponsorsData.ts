import { SponsorsData } from '@/types/sponsors';

export const mockSponsorsData: SponsorsData = {
  banners: [
    {
      id: 11,
      title: "Tyuco Imóveis",
      description: "",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/tyuco-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/tyuco-banner.webp",
      linkUrl: "https://www.instagram.com/tyucoimoveis/",
      target: "_blank",
      priority: 1,
      position: 1,
      altText: "Banner Tyuco Imóveis"
    },
    {
      id: 26,
      title: "Altos de Santa Helena - Terraza",
      description: null,
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/terraza-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/terraza-banner.webp",
      linkUrl: "https://www.instagram.com/terrazaurbanismo/",
      target: "_blank",
      priority: 1,
      position: 2,
      altText: "Banner Terraza"
    },
    {
      id: 51,
      title: "CC Seguros",
      description: null,
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/cc-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/cc-banner.webp",
      linkUrl: "https://www.instagram.com/ccsegurosoficial/",
      target: "_blank",
      priority: 1,
      position: 3,
      altText: "Banner CC Seguros"
    },
    {
      id: 14,
      title: "Lupel",
      description: "",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/lupel-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/lupel-banner.webp",
      linkUrl: "https://www.instagram.com/lupel.com.br/",
      target: "_blank",
      priority: 1,
      position: 4,
      altText: "Banner Lupel"
    },
    {
      id: 33,
      title: "Mais Net",
      description: null,
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/mais-net-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/mais-net-banner.webp",
      linkUrl: "https://www.instagram.com/internetmaisnet/",
      target: "_blank",
      priority: 1,
      position: 5,
      altText: "Banner Mais Net"
    },
    {
      id: 40,
      title: "R&S TELECOM | Unifique",
      description: null,
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/res-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/res-banner.webp",
      linkUrl: "https://www.instagram.com/rstelecom.unif/",
      target: "_blank",
      priority: 1,
      position: 6,
      altText: "Banner R&S TELECOM"
    },
    {
      id: 48,
      title: "Ação Logistica",
      description: null,
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/acao-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/acao-banner.webp",
      linkUrl: "https://www.instagram.com/acao_logistica/",
      target: "_blank",
      priority: 1,
      position: 7,
      altText: "Banner Ação Logística"
    },
    {
      id: 20,
      title: "BST Caminhões",
      description: null,
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/bst-banner.jpg",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/bst-banner.webp",
      linkUrl: "https://www.instagram.com/bstcaminhoes/",
      target: "_blank",
      priority: 1,
      position: 8,
      altText: "Banner BST Caminhões"
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