import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown, Calendar, MapPin, Users } from "lucide-react";

export const ParallaxHero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
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
          className="space-y-6 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-trucker-yellow to-trucker-orange">
            Nossa História de Fé e União
          </h1>
          
          <p className="text-lg md:text-xl text-trucker-yellow max-w-3xl mx-auto">
            22 anos celebrando São Cristóvão, protetor dos caminhoneiros de Tijucas/SC
          </p>
          
          <blockquote className="text-base md:text-lg text-white/90 max-w-4xl mx-auto italic font-light leading-relaxed">
            "Da inspiração do Padre Davi Antônio Coelho em 2003 até a era digital de hoje, 
            uma tradição que cresceu e se transformou mantendo sempre a essência: 
            fé, família e a proteção de São Cristóvão nas estradas do Brasil."
          </blockquote>

          {/* Key Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          >
            <div className="flex items-center justify-center gap-2 text-white/80">
              <Calendar className="w-5 h-5 text-trucker-yellow" />
              <span className="text-sm">22 anos de tradição</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80">
              <Users className="w-5 h-5 text-trucker-yellow" />
              <span className="text-sm">25.000+ participantes esperados</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80">
              <MapPin className="w-5 h-5 text-trucker-yellow" />
              <span className="text-sm">Tijucas, coração do transporte catarinense</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-label="Rolar para o conteúdo"
        >
          <div className="flex flex-col items-center space-y-2 text-trucker-yellow">
            <span className="text-sm font-medium">Explore nossa jornada</span>
            <ChevronDown className="w-6 h-6" />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};