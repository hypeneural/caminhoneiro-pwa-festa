import { motion } from "framer-motion";
import { Beef, Pizza, Soup, Coffee, Cake, Sandwich, Utensils } from "lucide-react";

interface CategoryTabsProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const categories = [
  {
    id: 'all',
    name: 'Todos',
    icon: Utensils,
    color: 'text-gray-600'
  },
  {
    id: 'main',
    name: 'Principais',
    icon: Beef,
    color: 'text-red-600'
  },
  {
    id: 'snacks',
    name: 'Petiscos',
    icon: Pizza,
    color: 'text-orange-600'
  },
  {
    id: 'regional',
    name: 'Regional',
    icon: Soup,
    color: 'text-green-600'
  },
  {
    id: 'drinks',
    name: 'Bebidas',
    icon: Coffee,
    color: 'text-brown-600'
  },
  {
    id: 'desserts',
    name: 'Sobremesas',
    icon: Cake,
    color: 'text-yellow-600'
  },
  {
    id: 'fast',
    name: 'Lanches',
    icon: Sandwich,
    color: 'text-orange-500'
  }
];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const currentCategory = activeCategory || 'all';

  return (
    <div className="bg-background border-b border-border/50 sticky top-[120px] z-30">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 p-2 min-w-max">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = currentCategory === category.id;

            return (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(category.id === 'all' ? null : category.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-w-max ${
                  isActive
                    ? 'bg-trucker-blue text-trucker-blue-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-trucker-blue-foreground' : category.color}`} />
                {category.name}
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-trucker-blue rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}