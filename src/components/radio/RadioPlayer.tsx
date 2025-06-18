import { motion, AnimatePresence } from "framer-motion";
import { Radio as RadioIcon, Play, Pause, Volume2, VolumeX, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useNativeShare } from "@/hooks/useNativeShare";
import { AudioVisualizer } from "./AudioVisualizer";
import { cn } from "@/lib/utils";

export const RadioPlayer = () => {
  const {
    isPlaying,
    isMuted,
    volume,
    isBuffering,
    metadata,
    error,
    togglePlay,
    toggleMute,
    handleVolumeChange,
  } = useRadioPlayer();

  const { toast } = useToast();
  const { shareApp } = useNativeShare();

  const handleShare = async () => {
    try {
      await shareApp({
        title: "Rádio Festa do Caminhoneiro",
        text: "Ouça a rádio oficial da Festa do Caminhoneiro!",
        url: window.location.href,
      });
    } catch (err) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar a rádio.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Player Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <motion.div 
            className="bg-gradient-to-br from-trucker-red/10 to-trucker-orange/10 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Visualizer */}
            <AudioVisualizer isPlaying={isPlaying} isBuffering={isBuffering} />

            {/* Metadata */}
            <div className="text-center mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={metadata?.songTitle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <motion.h2
                    className="text-xl font-bold"
                    layout
                  >
                    {metadata?.songTitle || "Rádio Festa do Caminhoneiro"}
                  </motion.h2>
                  <motion.p
                    className="text-muted-foreground"
                    layout
                  >
                    {metadata?.serverGenre || "Transmissão ao vivo • 24/7"}
                  </motion.p>
                  {metadata?.currentListeners !== undefined && (
                    <motion.p
                      className="text-sm text-muted-foreground"
                      layout
                    >
                      {metadata.currentListeners} ouvintes
                    </motion.p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleMute}
                  className={cn(
                    "w-12 h-12 transition-colors",
                    isMuted && "text-trucker-red border-trucker-red"
                  )}
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  onClick={togglePlay}
                  disabled={isBuffering}
                  className="w-16 h-16 bg-trucker-red hover:bg-trucker-red/90 disabled:opacity-50 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="w-12 h-12"
                >
                  <Share2 className="w-6 h-6" />
                </Button>
              </motion.div>
            </div>

            {/* Volume Slider */}
            <motion.div 
              className="flex items-center gap-4 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) => handleVolumeChange(value)}
                className="flex-1"
              />
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Program Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Informações da Transmissão</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Qualidade:</span>
                <span>256 Kbps • Stereo</span>
              </div>
              {metadata?.serverTitle && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between"
                >
                  <span className="text-muted-foreground">Locutor:</span>
                  <span>{metadata.serverTitle}</span>
                </motion.div>
              )}
              {metadata?.serverGenre && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between"
                >
                  <span className="text-muted-foreground">Programa:</span>
                  <span>{metadata.serverGenre}</span>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}; 