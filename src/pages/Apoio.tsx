
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { useNavigation } from "@/hooks/useNavigation";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { SupportersGrid } from "@/components/apoio/SupportersGrid";
import { useSponsors } from "@/hooks/useSponsors";

export default function Apoio() {
  const { goBack } = useNavigation();
  const { banners, sponsors, loading, error } = useSponsors();

  // Filter active banners and supporters
  const activeBanners = banners?.filter(banner => banner.isActive) || [];
  const activeSupporters = sponsors?.filter(sponsor => sponsor.isActive) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Content */}
      <main className="pt-16 pb-20">
        {/* Page Header */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <TouchFeedback
              onClick={goBack}
              className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center"
              scale={0.9}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </TouchFeedback>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">Apoiadores</h1>
              <p className="text-sm text-muted-foreground">Quem apoia nossa festa</p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
          </div>
        </div>

        {/* Hero Section with Banner Carousel */}
        {activeBanners.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="px-4 py-6"
          >
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Patrocinadores em Destaque
              </h2>
              <p className="text-sm text-muted-foreground">
                Conheça quem torna nossa festa possível
              </p>
            </div>
            
            <BannerCarousel
              banners={activeBanners}
              autoplayDelay={4000}
              showControls={true}
              showDots={true}
              className="rounded-2xl overflow-hidden shadow-lg"
            />
          </motion.section>
        )}

        {/* Supporters Grid */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="px-4 py-6"
        >
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Todos os Apoiadores
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeSupporters.length} empresas que apoiam a Festa do Caminhoneiro
            </p>
          </div>

          <SupportersGrid 
            supporters={activeSupporters}
            loading={loading}
            error={error}
          />
        </motion.section>

        {/* Footer Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="px-4 py-8 text-center"
        >
          <div className="bg-gradient-to-r from-trucker-blue/5 to-pink-500/5 rounded-2xl p-6 border border-border/30">
            <Heart className="w-8 h-8 text-pink-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Obrigado pelo Apoio!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cada apoiador é fundamental para manter viva a tradição da Festa do Caminhoneiro.
            </p>
            <div className="text-xs text-muted-foreground">
              Festa do Caminhoneiro • Tradição e Devoção
            </div>
          </div>
        </motion.section>
      </main>

      <BottomNavigation />
    </div>
  );
}
