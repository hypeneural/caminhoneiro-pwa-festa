import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FAQCategory } from "@/types/faq";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface FAQCategoriesProps {
  categories: FAQCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
}

export function FAQCategories({
  categories,
  activeCategory,
  onCategoryChange,
  className
}: FAQCategoriesProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground px-1">
        Categorias
      </h3>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {categories.map((category, index) => {
            const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
            const isActive = activeCategory === category.id;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0"
              >
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center gap-2 min-w-[80px] transition-all duration-300",
                    isActive 
                      ? "bg-trucker-blue hover:bg-trucker-blue/90 text-white shadow-lg scale-105" 
                      : "hover:bg-muted/80 hover:border-trucker-blue/50"
                  )}
                  aria-label={`Filtrar por ${category.name}`}
                >
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <IconComponent 
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? "text-white" : "text-muted-foreground"
                        )} 
                      />
                    )}
                    <span className="text-xs font-medium whitespace-nowrap">
                      {category.name}
                    </span>
                  </div>
                  
                  {category.count > 0 && (
                    <Badge 
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "text-xs h-5 px-2",
                        isActive 
                          ? "bg-white/20 text-white border-white/30" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {category.count}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}