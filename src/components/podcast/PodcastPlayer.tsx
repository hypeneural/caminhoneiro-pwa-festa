import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Share2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { PodcastItem } from "@/types/podcast";

interface PodcastPlayerProps {
  podcast: PodcastItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PodcastPlayer({ podcast, isOpen, onClose }: PodcastPlayerProps) {
  if (!podcast) return null;

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
      navigator.clipboard.writeText(youtubeUrl);
    }
  };

  const handleWatchOnYoutube = () => {
    window.open(`https://www.youtube.com/watch?v=${podcast.id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl w-full sm:w-[95vw] h-[90vh] max-h-[95vh] p-0 overflow-hidden bg-background border-border/20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-border/20 gap-2 sm:gap-0">
                <div className="flex-1 min-w-0 mr-0 sm:mr-4">
                  <h2 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
                    {podcast.title}
                  </h2>
                </div>
                <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto justify-end items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleWatchOnYoutube}
                    className="gap-2 h-8"
                  >
                    <ExternalLink className="w-3 h-3" />
                    YouTube
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShare}
                    className="gap-2 h-8"
                  >
                    <Share2 className="w-3 h-3" />
                    Compartilhar
                  </Button>
                  <TouchFeedback
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    haptic={true}
                  >
                    <X className="w-4 h-4" />
                  </TouchFeedback>
                </div>
              </div>
              {/* YouTube Player */}
              <div className="flex-1 bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${podcast.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={podcast.title}
                  className="w-full h-full min-h-[220px]"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {/* Description */}
              <div className="p-4 border-t border-border/20 bg-muted/20">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {podcast.description}
                </p>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}