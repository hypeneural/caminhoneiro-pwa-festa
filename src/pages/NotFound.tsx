import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, MapPin, Navigation, Truck, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TouchFeedback } from "@/components/ui/touch-feedback";

const NotFound = () => {
  const location = useLocation();
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRouteMessage = (path: string) => {
    const routeMessages: Record<string, string> = {
      '/galeria': 'Procurando por fotos da festa? Parece que esta estrada não leva lá!',
      '/mapa': 'GPS perdeu o sinal! A rota que você buscava não existe.',
      '/programacao': 'Esta programação não está no nosso roteiro, parceiro!',
      '/radio': 'Frequência não encontrada na estrada!',
      '/noticias': 'Estas notícias se perderam no caminho!',
    };
    return routeMessages[path] || 'Ops! Parece que você pegou a saída errada na estrada digital!';
  };

  const truckerPhrases = [
    "Tá perdido na estrada, companheiro?",
    "GPS pifou! Vamos recalcular a rota?", 
    "Esta página sumiu igual diesel barato!",
    "Rota não encontrada no mapa do caminhoneiro!",
    "Parece que você pegou a contramão da internet!"
  ];

  const randomPhrase = truckerPhrases[Math.floor(Math.random() * truckerPhrases.length)];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-road-gray overflow-hidden relative">
      {/* Animated Road Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-road-gray">
        <div className="absolute bottom-0 w-full h-64 bg-road-gray">
          {/* Road Lines Animation */}
          <motion.div
            className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-2 h-16 bg-road-yellow"
            animate={{ y: [0, 200] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-2 h-16 bg-road-yellow"
            animate={{ y: [0, 200] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 0.5 }}
          />
        </div>
      </div>

      {/* Clouds Animation */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-12 bg-white rounded-full opacity-80"
        animate={{ x: [0, window.innerWidth + 100] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-32 right-20 w-16 h-8 bg-white rounded-full opacity-60"
        animate={{ x: [window.innerWidth, -100] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Animated Truck */}
          <motion.div
            className="relative mb-8"
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <div className="relative w-32 h-20 mx-auto">
              <Truck className="w-32 h-20 text-trucker-blue drop-shadow-lg" />
              {/* Truck Headlights */}
              <motion.div
                className="absolute top-6 left-1 w-2 h-2 bg-trucker-yellow rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-8 left-1 w-2 h-2 bg-trucker-yellow rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              />
            </div>
            
            {/* Exhaust Smoke */}
            <motion.div
              className="absolute -top-2 left-20 w-6 h-6 bg-gray-400 rounded-full opacity-40"
              animate={{ 
                scale: [0.5, 1.5, 0.5],
                opacity: [0.4, 0.1, 0.4],
                x: [0, 20, 40],
                y: [0, -20, -40]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* 404 Text */}
          <motion.h1
            className="text-8xl font-bold text-trucker-red mb-4 drop-shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
          >
            4<span className="text-trucker-yellow">0</span>4
          </motion.h1>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {randomPhrase}
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              {getRouteMessage(location.pathname)}
            </p>
          </motion.div>

          {/* GPS Mock Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card className="p-6 bg-background/90 backdrop-blur-sm border-trucker-blue/20 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-trucker-red" />
                  <span className="font-medium">GPS Caminhoneiro</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`w-3 h-3 rounded-full ${isGpsActive ? 'bg-trucker-green' : 'bg-trucker-red'}`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-trucker-blue" />
                  <span>Rota atual: <span className="text-trucker-red font-mono">{location.pathname}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-trucker-yellow" />
                  <span>Status: <span className="text-trucker-red">Destino não encontrado</span></span>
                </div>
                <div className="text-center pt-4">
                  <TouchFeedback>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGpsActive(!isGpsActive)}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Recalcular Rota
                    </Button>
                  </TouchFeedback>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <TouchFeedback>
              <Button asChild size="lg" className="bg-trucker-red hover:bg-trucker-red/90">
                <Link to="/">
                  <Home className="w-5 h-5 mr-2" />
                  Voltar para Casa
                </Link>
              </Button>
            </TouchFeedback>
            
            <TouchFeedback>
              <Button asChild variant="outline" size="lg">
                <Link to="/mapa">
                  <MapPin className="w-5 h-5 mr-2" />
                  Ver Mapa
                </Link>
              </Button>
            </TouchFeedback>
          </motion.div>

          {/* Fun Facts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica do Caminhoneiro:</strong> Sempre confira o GPS antes de pegar a estrada!
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              São Cristóvão protege quem navega com cuidado 🙏
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Easter Egg - Clicking truck horn */}
      <motion.div
        className="absolute bottom-4 right-4 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          // Simple horn sound simulation with vibration
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
        }}
      >
        <TouchFeedback>
          <div className="w-12 h-12 bg-trucker-yellow rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xl">📯</span>
          </div>
        </TouchFeedback>
      </motion.div>
    </div>
  );
};

export default NotFound;
