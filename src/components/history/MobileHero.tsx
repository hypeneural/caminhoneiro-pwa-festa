import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown, Calendar, MapPin, Users } from "lucide-react";

export const MobileHero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const scrollToContent = () => {
    const contentSection = document.getElementById('historia-content');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={ref} className="relative h-screen overflow-hidden">
      {/* Background with Parallax */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 w-full h-[120%]"
      >
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://festadoscaminhoneiros.com.br/assets/images/historia/igreja.jpg')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-trucker-yellow to-trucker-orange leading-tight">
            Nossa História de Fé e União
          </h1>
          
          <p className="text-base sm:text-lg text-trucker-yellow max-w-sm mx-auto leading-relaxed">
            22 anos celebrando São Cristóvão em Tijucas/SC
          </p>
          
          <blockquote className="text-sm sm:text-base text-white/90 max-w-xs mx-auto italic font-light leading-relaxed">
            "Da inspiração do Padre Davi em 2003 até hoje, uma tradição de fé e proteção nas estradas"
          </blockquote>

          {/* Key Stats - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="grid grid-cols-1 gap-3 mt-6"
          >
            <div className="flex items-center justify-center gap-2 text-white/80">
              <Calendar className="w-4 h-4 text-trucker-yellow" />
              <span className="text-xs">22 anos de tradição</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80">
              <Users className="w-4 h-4 text-trucker-yellow" />
              <span className="text-xs">25.000+ participantes esperados</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80">
              <MapPin className="w-4 h-4 text-trucker-yellow" />
              <span className="text-xs">Tijucas, coração do transporte</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.button
          onClick={scrollToContent}
          className="absolute left-1/2 bottom-6 -translate-x-1/2 flex flex-col items-center justify-center w-auto px-4 touch-manipulation"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-label="Rolar para o conteúdo"
        >
          <div className="flex flex-col items-center space-y-2 text-trucker-yellow text-center">
            <span className="text-xs font-medium">Explore nossa jornada</span>
            <ChevronDown className="w-5 h-5 mx-auto" />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};