import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield, BookText, Truck, Flag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navigationItems: NavigationItem[] = [
  { id: "hero", label: "Início", icon: Shield },
  { id: "history", label: "História", icon: BookText },
  { id: "patronage", label: "Patronato", icon: Truck },
  { id: "brazil", label: "No Brasil", icon: Flag },
  { id: "conclusion", label: "Legado", icon: Sparkles },
];

export const FloatingNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationItems.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navigationItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Card className="p-2 bg-background/95 backdrop-blur-sm border shadow-lg">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full justify-start gap-2 ${
                        isActive 
                          ? "bg-trucker-blue text-white hover:bg-trucker-blue/90" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full bg-trucker-blue hover:bg-trucker-blue/90 text-white shadow-lg"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </motion.div>

      {/* Progress Indicator */}
      <div className="mt-4 w-12 flex justify-center">
        <div className="w-1 h-20 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="w-full bg-trucker-blue rounded-full"
            style={{
              height: `${(navigationItems.findIndex(item => item.id === activeSection) + 1) / navigationItems.length * 100}%`
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};