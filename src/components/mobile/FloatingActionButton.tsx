
import { Plus, Send } from "lucide-react";
import { motion } from "framer-motion";

export function FloatingActionButton() {
  const handleWhatsAppClick = () => {
    const whatsappUrl = "https://api.whatsapp.com/send/?phone=55489999999&text=Quero%20enviar%20nossas%20fotos!";
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.button
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => window.open('https://wa.me/554896425287', '_blank')}
      className="fixed bottom-20 right-4 z-40 w-16 h-16 bg-trucker-red hover:bg-trucker-red/90 text-white rounded-full shadow-lg flex flex-col items-center justify-center transition-colors group"
    >
      <Plus className="w-5 h-5 mb-0.5" />
      <span className="text-xs font-medium leading-none">Enviar</span>
      <span className="text-xs font-medium leading-none">Foto</span>
      
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
