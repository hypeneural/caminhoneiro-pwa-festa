import { motion } from 'framer-motion';
import { StoryCollection } from '@/types/stories';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface StoryCircleProps {
  collection: StoryCollection;
  onClick: () => void;
}

export function StoryCircle({ collection, onClick }: StoryCircleProps) {
  const getBorderStyle = () => {
    if (collection.hasUnviewed) {
      if (collection.stories.some(story => story.isLive)) {
        return 'border-4 border-gradient-to-r from-purple-500 via-pink-500 to-red-500';
      }
      return 'border-4 border-trucker-red';
    }
    return 'border-2 border-border';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'agora';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center space-y-2 cursor-pointer min-w-[80px]"
      onClick={onClick}
    >
      <div className="relative">
        {/* Animated border for live stories */}
        {collection.stories.some(story => story.isLive) && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full bg-background rounded-full" />
          </motion.div>
        )}
        
        <div
          className={`relative w-20 h-20 rounded-full overflow-hidden ${getBorderStyle()}`}
        >
          <OptimizedImage
            src={collection.thumbnailUrl}
            alt={collection.title}
            className="w-full h-full object-cover"
            sizes="80px"
          />
        </div>

        {/* Live indicator */}
        {collection.stories.some(story => story.isLive) && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            AO VIVO
          </div>
        )}

        {/* New indicator */}
        {collection.hasUnviewed && !collection.stories.some(story => story.isLive) && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-trucker-red rounded-full border-2 border-background">
            <motion.div
              className="w-full h-full bg-trucker-red rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-foreground truncate max-w-[80px]">
          {collection.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(collection.lastUpdated)}
        </p>
      </div>
    </motion.div>
  );
}