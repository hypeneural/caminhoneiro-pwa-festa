import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Story, StoryCollection } from '@/types/stories';

interface StoryViewerProps {
  isOpen: boolean;
  currentStory: Story | null;
  currentCollection: StoryCollection | null;
  storyIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onMarkAsViewed: (storyId: string) => void;
  onUpdateProgress: (progress: number) => void;
}

export function StoryViewer({
  isOpen,
  currentStory,
  currentCollection,
  storyIndex,
  isPlaying,
  isMuted,
  progress,
  onClose,
  onNavigate,
  onTogglePlayPause,
  onToggleMute,
  onMarkAsViewed,
  onUpdateProgress
}: StoryViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // Auto-hide controls
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [isOpen, currentStory]);

  // Handle story progress
  useEffect(() => {
    if (!currentStory || !isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const duration = currentStory.duration || 5;
    const interval = 100; // Update every 100ms
    const increment = interval / (duration * 1000);

    progressIntervalRef.current = setInterval(() => {
      const newProgress = progress + increment;
      if (newProgress >= 1) {
        onNavigate('next');
        onUpdateProgress(0);
      } else {
        onUpdateProgress(newProgress);
      }
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentStory, isPlaying, onUpdateProgress, onNavigate]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && isPlaying) {
      const timer = setTimeout(() => {
        onMarkAsViewed(currentStory.id);
      }, 1000); // Mark as viewed after 1 second

      return () => clearTimeout(timer);
    }
  }, [currentStory, isPlaying, onMarkAsViewed]);

  // Video controls
  useEffect(() => {
    if (!videoRef.current || currentStory?.type !== 'video') return;

    const video = videoRef.current;
    
    if (isPlaying) {
      video.play();
    } else {
      video.pause();
    }

    video.muted = isMuted;
  }, [isPlaying, isMuted, currentStory]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onNavigate('prev');
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          onNavigate('next');
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          onToggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, onClose, onToggleMute]);

  const handleTouchStart = useCallback((area: 'left' | 'center' | 'right') => {
    if (area === 'center') {
      const timer = setTimeout(() => {
        setIsLongPress(true);
        onTogglePlayPause();
      }, 500);
      setLongPressTimer(timer);
    }
  }, [onTogglePlayPause]);

  const handleTouchEnd = useCallback((area: 'left' | 'center' | 'right') => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!isLongPress) {
      if (area === 'left') {
        onNavigate('prev');
      } else if (area === 'right') {
        onNavigate('next');
      }
    }

    setIsLongPress(false);
    setShowControls(true);
  }, [longPressTimer, isLongPress, onNavigate]);

  const handleShare = useCallback(async () => {
    if (!currentStory) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Story da ${currentCollection?.title}`,
          text: currentStory.caption || 'Confira este momento da Festa do Caminhoneiro!',
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      console.error('Error sharing story:', error);
    }
  }, [currentStory, currentCollection]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  if (!currentStory || !currentCollection) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black border-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-4">
            {currentCollection.stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: '0%' }}
                  animate={{
                    width: index < storyIndex ? '100%' : 
                           index === storyIndex ? `${progress * 100}%` : '0%'
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative flex-1 flex items-center justify-center">
            {currentStory.type === 'video' ? (
              <video
                ref={videoRef}
                src={currentStory.url}
                className="max-w-full max-h-full object-contain"
                loop={false}
                playsInline
                onEnded={() => onNavigate('next')}
              />
            ) : (
              <OptimizedImage
                src={currentStory.url}
                alt={currentStory.caption || 'Story'}
                className="max-w-full max-h-full object-contain"
                priority
              />
            )}

            {/* Touch areas */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full z-30 cursor-pointer"
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
              onClick={() => onNavigate('prev')}
              aria-label="Story anterior"
            />
            <button
              className="absolute left-1/3 top-0 w-1/3 h-full z-30 cursor-pointer"
              onTouchStart={() => handleTouchStart('center')}
              onTouchEnd={() => handleTouchEnd('center')}
              aria-label="Pausar/Reproduzir"
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-full z-30 cursor-pointer"
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
              onClick={() => onNavigate('next')}
              aria-label="Próximo story"
            />
          </div>

          {/* Top controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 to-transparent p-4 pt-16"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentStory.author.avatar && (
                      <img
                        src={currentStory.author.avatar}
                        alt={currentStory.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-white font-medium text-sm">
                        {currentStory.author.name}
                      </p>
                      <p className="text-white/70 text-xs">
                        {formatTimeAgo(currentStory.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStory.type === 'video' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-10 w-10"
                        onClick={onToggleMute}
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-10 w-10"
                      onClick={onClose}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom info */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/60 to-transparent p-4"
              >
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    {currentStory.caption && (
                      <p className="text-white text-sm mb-2">
                        {currentStory.caption}
                      </p>
                    )}
                    {currentStory.location && (
                      <p className="text-white/70 text-xs">
                        📍 {currentStory.location}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={handleShare}
                  >
                    <Share className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pause indicator */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-40"
              >
                <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-l-4 border-t-4 border-white"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}