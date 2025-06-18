import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { RadioPlayer } from "@/components/radio/RadioPlayer";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/radio/AnimatedBackground";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";

const Radio = () => {
  const { isPlaying } = useRadioPlayer();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Fundo animado */}
      <AnimatedBackground isPlaying={isPlaying} />
      
      {/* Conteúdo */}
      <div className="relative">
        <Header />
        
        <main className="pt-16 pb-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <RadioPlayer />

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="backdrop-blur-sm bg-white/10">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold mb-2">Sem Interrupções</h4>
                  <p className="text-sm text-muted-foreground">
                    Música 24h por dia
                  </p>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-sm bg-white/10">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold mb-2">Alta Qualidade</h4>
                  <p className="text-sm text-muted-foreground">
                    Áudio HD 256 Kbps
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default Radio;