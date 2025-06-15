import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export function FloatingActionButton() {
  return (
    <motion.button
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-trucker-red hover:bg-trucker-red/90 text-trucker-red-foreground rounded-full shadow-lg flex items-center justify-center transition-colors"
    >
      <Plus className="w-6 h-6" />
      
      {/* Ripple effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ scale: 4, opacity: 0 }}
        className="absolute inset-0 bg-trucker-red rounded-full"
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}