import { motion } from "framer-motion";
import { Camera, Grid3x3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Gallery = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border/50 px-4 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Galeria</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Grid3x3 className="w-4 h-4" />
          </Button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-16 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="py-4"
        >
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-trucker-blue/10 text-trucker-blue">
              2024
            </Badge>
            <Badge variant="secondary" className="bg-trucker-red/10 text-trucker-red">
              Festa do Caminhoneiro
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 20 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square bg-muted rounded-lg overflow-hidden"
              >
                <div className="w-full h-full bg-gradient-to-br from-trucker-blue/20 to-trucker-red/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Gallery;