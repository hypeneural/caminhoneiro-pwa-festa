import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio as RadioIcon, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

const Radio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <RadioIcon className="w-8 h-8 text-trucker-red" />
              <h1 className="text-2xl font-bold text-foreground">Rádio Ao Vivo</h1>
            </div>
            <p className="text-muted-foreground">
              Ouça a programação oficial da festa
            </p>
          </div>

          {/* Player Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-trucker-red/10 to-trucker-orange/10 p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-trucker-red/20 rounded-full flex items-center justify-center">
                  <RadioIcon className="w-12 h-12 text-trucker-red" />
                </div>
                <h2 className="text-xl font-bold mb-2">Festa do Caminhoneiro FM</h2>
                <p className="text-muted-foreground mb-6">
                  Transmissão ao vivo • 24/7
                </p>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleMute}
                    className="w-12 h-12"
                  >
                    {isMuted ? (
                      <VolumeX className="w-6 h-6" />
                    ) : (
                      <Volume2 className="w-6 h-6" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={handlePlayPause}
                    className="w-16 h-16 bg-trucker-red hover:bg-trucker-red/90"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </Button>
                  
                  <div className="w-12 h-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Agora Tocando</h3>
              <p className="text-muted-foreground mb-4">
                Sucessos do Sertanejo e Música Caminhoneira
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Locutor:</span>
                  <span>DJ Caminhoneiro</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Programa:</span>
                  <span>Estrada Afora</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próximo:</span>
                  <span>19:00 - Show ao Vivo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold mb-2">Sem Interrupções</h4>
                <p className="text-sm text-muted-foreground">
                  Música 24h direto
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold mb-2">Alta Qualidade</h4>
                <p className="text-sm text-muted-foreground">
                  Audio HD cristalino
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Radio;