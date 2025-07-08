import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Share2, ExternalLink, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { PodcastItem } from "@/types/podcast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PodcastCardProps {
  podcast: PodcastItem;
  onPlay: (podcast: PodcastItem) => void;
  index: number;
}

export function PodcastCard({ podcast, onPlay, index }: PodcastCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleShare = async () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${podcast.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: podcast.title,
          text: podcast.description,
          url: youtubeUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(youtubeUrl);
    }
  };

  const handleWatchOnYoutube = () => {
    window.open(`https://www.youtube.com/watch?v=${podcast.id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1, 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      }}
      whileHover={{ scale: 1.02 }}
      className="w-full"
    >
      <Card className="overflow-hidden bg-card/95 backdrop-blur-sm border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          <motion.img
            src={podcast.thumb_url}
            alt={podcast.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <TouchFeedback
              onClick={() => onPlay(podcast)}
              className="p-4 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
              haptic={true}
            >
              <Play className="w-8 h-8 text-primary fill-current" />
            </TouchFeedback>
          </div>

          {/* Duration badge if available */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            YouTube
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
              {podcast.title}
            </h3>
            
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {podcast.description}
            </p>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(podcast.created_at), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => onPlay(podcast)}
              className="flex-1 gap-2 h-8 text-xs"
            >
              <Play className="w-3 h-3" />
              Assistir
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleWatchOnYoutube}
              className="gap-1 h-8 px-3"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="gap-1 h-8 px-3"
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}