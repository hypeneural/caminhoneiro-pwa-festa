import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

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
            backgroundImage: `url('https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=1920')`
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
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-trucker-yellow to-trucker-orange">
            A História da Nossa Festa
          </h1>
          
          <p className="text-lg md:text-xl text-trucker-yellow max-w-2xl mx-auto">
            Fé, Tradição e a Jornada do Caminhoneiro em Tijucas/SC
          </p>
          
          <blockquote className="text-base md:text-lg text-white/90 max-w-3xl mx-auto italic font-light">
            "São Cristóvão, protetor dos viajantes, guia nossos passos há mais de duas décadas, 
            unindo fé e estrada numa celebração que transcende gerações."
          </blockquote>
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
            <span className="text-sm font-medium">Descubra nossa história</span>
            <ChevronDown className="w-6 h-6" />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};