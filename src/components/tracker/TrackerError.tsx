import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TrackerErrorProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export const TrackerError = ({ onRetry, isRetrying = false }: TrackerErrorProps) => {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-trucker-blue" />
        <h2 className="text-lg font-bold text-foreground">São Cristóvão em Movimento</h2>
      </div>

      <Card className="p-6 shadow-lg border-destructive/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Sinal Indisponível</h3>
            <p className="text-sm text-muted-foreground">
              Não foi possível conectar com o sistema de rastreamento. 
              Verifique sua conexão e tente novamente.
            </p>
          </div>

          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="w-full"
            size="lg"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Reconectando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </>
            )}
          </Button>
        </motion.div>
      </Card>
    </div>
  );
};