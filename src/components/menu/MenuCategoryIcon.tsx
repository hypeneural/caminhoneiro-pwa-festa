import {
  Beer,
  CakeSlice,
  CandyCane,
  Coffee,
  Sandwich,
  Soup,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  FaBeer: Beer,
  FaBirthdayCake: CakeSlice,
  FaBowlFood: Soup,
  FaCandyCane: CandyCane,
  FaCoffee: Coffee,
  FaHamburger: Sandwich,
  FaUtensils: Utensils,
};

interface MenuCategoryIconProps {
  iconName?: string | null;
  className?: string;
}

export function MenuCategoryIcon({ iconName, className }: MenuCategoryIconProps) {
  const Icon = iconName ? iconMap[iconName] : undefined;

  if (!Icon) return null;

  return <Icon className={cn("shrink-0", className)} aria-hidden="true" />;
}
