
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Radio, 
  Video, 
  History, 
  Newspaper, 
  Route, 
  Camera,
  Info,
  Phone,
  Settings,
  HelpCircle,
  Cross,
  Heart
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES } from "@/constants/routes";

interface MoreMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  {
    id: 'radio',
    title: 'Rádio Festa',
    description: 'Escute nossa programação especial',
    icon: Radio,
    route: ROUTES.RADIO,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    id: 'videos',
    title: 'Vídeos',
    description: 'Assista aos melhores momentos',
    icon: Video,
    route: ROUTES.VIDEOS,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'historia',
    title: 'História',
    description: 'Conheça nossa tradição',
    icon: History,
    route: ROUTES.HISTORY,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  {
    id: 'noticias',
    title: 'Notícias',
    description: 'Últimas novidades da festa',
    icon: Newspaper,
    route: ROUTES.NEWS,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'rota',
    title: 'Rota Completa',
    description: 'Veja todo o percurso',
    icon: Route,
    route: ROUTES.COMPLETE_ROUTE,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'cameras',
    title: 'Câmeras',
    description: 'Acompanhe ao vivo',
    icon: Camera,
    route: ROUTES.CAMERAS,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  {
    id: 'sao-cristovao',
    title: 'São Cristóvão',
    description: 'Conheça nosso padroeiro',
    icon: Cross,
    route: ROUTES.SAO_CRISTOVAO,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  {
    id: 'apoio',
    title: 'Apoiadores',
    description: 'Quem apoia nossa festa',
    icon: Heart,
    route: ROUTES.APOIO,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  }
];

const bottomItems = [
  {
    id: 'about',
    title: 'Sobre',
    icon: Info,
    route: ROUTES.ABOUT
  },
  {
    id: 'contact',
    title: 'Contato',
    icon: Phone,
    route: ROUTES.CONTACT
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    route: ROUTES.FAQ
  },
  {
    id: 'settings',
    title: 'Configurações',
    icon: Settings,
    route: ROUTES.SETTINGS
  }
];

export function MoreMenuSheet({ open, onOpenChange }: MoreMenuSheetProps) {
  const { navigateTo } = useNavigation();

  const handleItemClick = (route: string) => {
    navigateTo(route as any);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] bg-gradient-to-b from-background via-background to-muted/20">
        <DrawerHeader className="text-center pb-6 pt-2 border-b border-border/20">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DrawerTitle className="text-2xl font-bold text-foreground mb-2">
              Menu Principal
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Explore todos os recursos da festa
            </p>
          </motion.div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
          {/* Main Menu Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.1 + index * 0.05,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TouchFeedback
                    onClick={() => handleItemClick(item.route)}
                    className={`
                      group relative overflow-hidden rounded-2xl 
                      ${item.bgColor} ${item.borderColor} 
                      border-2 p-5 transition-all duration-300
                      hover:shadow-lg hover:shadow-${item.color.split('-')[1]}-200/25
                      active:scale-95
                    `}
                    haptic={true}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex flex-col items-center text-center space-y-3">
                      <motion.div 
                        className="p-3 rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </motion.div>
                      
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </TouchFeedback>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                Mais opções
              </span>
            </div>
          </motion.div>

          {/* Bottom Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-3"
          >
            {bottomItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: 0.7 + index * 0.1,
                  type: "spring",
                  stiffness: 150 
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TouchFeedback
                  onClick={() => handleItemClick(item.route)}
                  className="
                    group flex items-center space-x-4 p-4 rounded-xl 
                    bg-muted/30 hover:bg-muted/60 
                    border border-border/20 hover:border-border/40
                    transition-all duration-200
                    hover:shadow-md
                  "
                  haptic={false}
                >
                  <motion.div
                    className="
                      w-10 h-10 rounded-lg bg-background/80 
                      flex items-center justify-center
                      shadow-sm ring-1 ring-black/5
                    "
                    whileHover={{ rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </motion.div>
                  
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </TouchFeedback>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center pt-6 pb-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 text-xs text-muted-foreground">
              <Heart className="w-3 h-3 text-red-500" />
              <span>Festa do Caminhoneiro 2025</span>
            </div>
          </motion.div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
