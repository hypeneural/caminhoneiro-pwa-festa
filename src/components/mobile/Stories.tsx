import { motion } from "framer-motion";

interface Story {
  id: string;
  title: string;
  thumbnail: string;
  isViewed: boolean;
  isLive: boolean;
  category: 'chegada' | 'bencao' | 'shows' | 'bastidores' | 'publico' | 'procissao';
}

const stories: Story[] = [
  {
    id: "1",
    title: "Ao Vivo",
    thumbnail: "https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=400",
    isViewed: false,
    isLive: true,
    category: "publico"
  },
  {
    id: "2",
    title: "Chegada",
    thumbnail: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=400",
    isViewed: false,
    isLive: false,
    category: "chegada"
  },
  {
    id: "3",
    title: "Bênção",
    thumbnail: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=400",
    isViewed: true,
    isLive: false,
    category: "bencao"
  },
  {
    id: "4",
    title: "Shows",
    thumbnail: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=400",
    isViewed: false,
    isLive: false,
    category: "shows"
  },
  {
    id: "5",
    title: "Bastidores",
    thumbnail: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?w=400",
    isViewed: true,
    isLive: false,
    category: "bastidores"
  },
  {
    id: "6",
    title: "Procissão",
    thumbnail: "https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=400",
    isViewed: false,
    isLive: false,
    category: "procissao"
  }
];

export function Stories() {
  return (
    <div className="px-4 py-3 bg-background">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="relative">
              <div 
                className={`w-20 h-20 rounded-full p-0.5 ${
                  story.isLive 
                    ? 'bg-gradient-to-r from-trucker-red to-trucker-orange' 
                    : story.isViewed 
                      ? 'bg-border' 
                      : 'bg-gradient-to-r from-trucker-blue to-trucker-green'
                }`}
              >
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <img 
                    src={story.thumbnail}
                    alt={story.title}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              
              {story.isLive && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-trucker-red text-trucker-red-foreground text-xs font-bold px-2 py-0.5 rounded-full"
                >
                  LIVE
                </motion.div>
              )}
            </div>
            
            <span className="text-xs font-medium text-center max-w-[80px] leading-tight line-clamp-2">
              {story.title}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}