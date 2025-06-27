
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, ExternalLink, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Badge } from "@/components/ui/badge";
import { SponsorLogo } from "@/types/sponsors";
import { cn } from "@/lib/utils";

interface SupportersGridProps {
  supporters: SponsorLogo[];
  loading?: boolean;
  error?: string | null;
}

const categoryColors = {
  diamante: "bg-purple-100 text-purple-800 border-purple-200",
  ouro: "bg-yellow-100 text-yellow-800 border-yellow-200",
  prata: "bg-gray-100 text-gray-800 border-gray-200",
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
  apoiador: "bg-blue-100 text-blue-800 border-blue-200"
};

const categoryLabels = {
  diamante: "Diamante",
  ouro: "Ouro",
  prata: "Prata",
  bronze: "Bronze",
  apoiador: "Apoiador"
};

export function SupportersGrid({ supporters, loading, error }: SupportersGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories
  const categories = Array.from(new Set(supporters.map(s => s.category)));

  // Filter supporters
  const filteredSupporters = supporters.filter(supporter => {
    const matchesSearch = supporter.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || supporter.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePhoneCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleWebsiteVisit = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search skeleton */}
        <div className="h-10 bg-muted/50 rounded-xl animate-pulse" />
        
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Erro ao carregar apoiadores
        </h3>
        <p className="text-sm text-muted-foreground">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar apoiador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-xl border-2 border-border/50 focus:border-trucker-blue/50 bg-background/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <TouchFeedback
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-4 py-2 rounded-full border-2 whitespace-nowrap transition-all",
              selectedCategory === "all"
                ? "bg-trucker-blue text-white border-trucker-blue"
                : "bg-background border-border/50 text-foreground hover:border-trucker-blue/50"
            )}
            scale={0.95}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Todos</span>
            </div>
          </TouchFeedback>
          
          {categories.map(category => (
            <TouchFeedback
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full border-2 whitespace-nowrap transition-all",
                selectedCategory === category
                  ? "bg-trucker-blue text-white border-trucker-blue"
                  : "bg-background border-border/50 text-foreground hover:border-trucker-blue/50"
              )}
              scale={0.95}
            >
              <span className="text-sm font-medium">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </span>
            </TouchFeedback>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground text-center">
        {filteredSupporters.length} apoiador{filteredSupporters.length !== 1 ? 'es' : ''} encontrado{filteredSupporters.length !== 1 ? 's' : ''}
      </div>

      {/* Supporters Grid */}
      <AnimatePresence mode="wait">
        {filteredSupporters.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {filteredSupporters.map((supporter, index) => (
              <motion.div
                key={supporter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-background border-2 border-border/30 rounded-2xl p-4 hover:border-trucker-blue/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Logo */}
                  <div className="aspect-square relative">
                    <OptimizedImage
                      src={supporter.logoUrlWebp || supporter.logoUrl}
                      alt={supporter.altText}
                      fallbackSrc={supporter.logoUrl}
                      className="w-full h-full object-contain rounded-xl"
                      priority={index < 6}
                    />
                  </div>

                  {/* Company Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
                      {supporter.companyName}
                    </h3>
                    
                    <Badge 
                      className={cn(
                        "text-xs border",
                        categoryColors[supporter.category]
                      )}
                    >
                      {categoryLabels[supporter.category]}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <TouchFeedback
                      onClick={() => handleWebsiteVisit(supporter.websiteUrl)}
                      className="flex-1 bg-trucker-blue/10 hover:bg-trucker-blue/20 text-trucker-blue rounded-lg p-2 flex items-center justify-center gap-1 transition-colors"
                      scale={0.95}
                      haptic={true}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-xs font-medium">Site</span>
                    </TouchFeedback>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum apoiador encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar sua busca ou filtros
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
