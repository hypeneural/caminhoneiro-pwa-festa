import { motion } from "framer-motion";
import { ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MenuHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-trucker-red to-trucker-red/80 text-trucker-red-foreground relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative px-4 py-6 space-y-4">
        {/* Header Principal */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-trucker-red-foreground/20 rounded-2xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-trucker-red-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cardápio da Festa</h1>
            <p className="text-trucker-red-foreground/80 text-sm">
              Sabores Tradicionais que Movem o Coração
            </p>
          </div>
        </div>

        {/* Badge de Destaque */}
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-success text-success-foreground border-0 px-3 py-1">
            Preços Especiais para a Festa
          </Badge>
          <Badge variant="outline" className="border-trucker-red-foreground/30 text-trucker-red-foreground bg-trucker-red-foreground/10">
            Tradição Rodoviária
          </Badge>
        </div>

        {/* Descrição */}
        <p className="text-trucker-red-foreground/90 text-sm leading-relaxed">
          Descubra os sabores únicos que alimentam os heróis da estrada. Nossa culinária regional 
          une tradição familiar com o tempero especial da hospitalidade mineira.
        </p>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-trucker-red-foreground/80">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-trucker-red-foreground">50+</span>
            <span>Pratos</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-trucker-red-foreground">15</span>
            <span>Fornecedores</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-trucker-red-foreground">4.7</span>
            <span>Avaliação</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}