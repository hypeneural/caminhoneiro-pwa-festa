
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl border-t-2 border-trucker-blue/20 bg-gradient-to-b from-background via-background to-muted/30"
      >
        <SheetHeader className="text-center pb-4 border-b border-border/50">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetTitle className="text-xl font-bold text-foreground">
            Menu Principal
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Explore todos os recursos da festa
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Main Menu Items */}
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TouchFeedback
                    onClick={() => handleItemClick(item.route)}
                    className={`p-4 rounded-2xl border-2 ${item.bgColor} ${item.borderColor} hover:shadow-md transition-all duration-200`}
                    scale={0.95}
                    haptic={true}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </TouchFeedback>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom Items */}
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 px-2">
              Mais opções
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {bottomItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (menuItems.length * 0.05) + (index * 0.1) }}
                >
                  <TouchFeedback
                    onClick={() => handleItemClick(item.route)}
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    scale={0.98}
                  >
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                  </TouchFeedback>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
