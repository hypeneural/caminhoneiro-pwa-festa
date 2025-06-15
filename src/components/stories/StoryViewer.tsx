import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Share, Volume2, VolumeX, Heart } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

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
    
    const handlePlay = async () => {
      try {
        if (isPlaying) {
          await video.play();
        } else {
          video.pause();
        }
      } catch (error) {
        // Ignore AbortError which is common when rapidly changing videos
        if (error instanceof DOMException && error.name !== 'AbortError') {
          console.error('Video play error:', error);
        }
      }
    };

    video.muted = isMuted;
    handlePlay();
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

  // Handle horizontal and vertical swipe gestures
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setSwipeDirection(null);
  }, []);

  const handleDrag = useCallback((event: any, info: PanInfo) => {
    const { offset } = info;
    
    // Determine swipe direction based on dominant axis
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      setDragX(offset.x);
      setSwipeDirection(offset.x > 0 ? 'right' : 'left');
      
      // Add visual feedback for horizontal swipe
      const opacity = Math.max(0.7, 1 - Math.abs(offset.x) / 300);
      setIsDimmed(opacity < 0.9);
    } else if (offset.y > 0) {
      // Vertical swipe down to close
      setDragY(offset.y);
      const opacity = Math.max(0.3, 1 - offset.y / 300);
      setIsDimmed(opacity < 0.8);
    }
  }, []);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y);
    
    setIsDragging(false);
    setDragY(0);
    setDragX(0);
    setIsDimmed(false);
    setSwipeDirection(null);
    
    if (isHorizontal) {
      // Horizontal swipe navigation
      const threshold = 100;
      const velocityThreshold = 500;
      
      if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > velocityThreshold) {
        if (navigator.vibrate) navigator.vibrate(20);
        
        if (offset.x > 0) {
          // Swipe right - go to previous story
          onNavigate('prev');
        } else {
          // Swipe left - go to next story
          onNavigate('next');
        }
      }
    } else if (offset.y > 150) {
      // Vertical swipe down to close
      onClose();
    }
  }, [onClose, onNavigate]);

  // Enhanced touch handlers with haptic feedback
  const handleTouchStart = useCallback((area: 'left' | 'center' | 'right') => {
    if (navigator.vibrate) navigator.vibrate(10);
    
    if (area === 'center') {
      const timer = setTimeout(() => {
        setIsLongPress(true);
        setIsDimmed(true);
        onTogglePlayPause();
        if (navigator.vibrate) navigator.vibrate(50);
      }, 300);
      setLongPressTimer(timer);
    }
  }, [onTogglePlayPause]);

  const handleTouchEnd = useCallback((area: 'left' | 'center' | 'right', event?: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!isLongPress && !isDragging) {
      // Handle double tap for like
      if (area === 'center' && event) {
        const currentTime = new Date().getTime();
        const tapDelay = currentTime - lastTap;
        
        if (tapDelay < 300 && tapDelay > 0) {
          // Double tap detected
          if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
          // Add like animation here if needed
          return;
        }
        
        setLastTap(currentTime);
      }
      
      // Single tap navigation
      if (area === 'left') {
        onNavigate('prev');
      } else if (area === 'right') {
        onNavigate('next');
      }
    }

    setIsLongPress(false);
    setIsDimmed(false);
    setShowControls(true);
  }, [longPressTimer, isLongPress, isDragging, lastTap, onNavigate]);

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
        <motion.div 
          className="relative w-full h-full flex flex-col"
          drag
          dragConstraints={{ top: 0, bottom: 300, left: -200, right: 200 }}
          dragElastic={{ top: 0, bottom: 0.2, left: 0.1, right: 0.1 }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={{ 
            y: dragY,
            x: dragX,
            opacity: isDimmed ? 0.6 : 1,
            scale: isDragging ? 0.95 : 1,
            filter: isTransitioning ? 'blur(2px)' : 'blur(0px)'
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
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
          <motion.div 
            className="relative flex-1 flex items-center justify-center"
            animate={{
              filter: isDimmed ? 'brightness(0.4)' : 'brightness(1)',
              scale: isLongPress ? 0.98 : 1
            }}
            transition={{ duration: 0.2 }}
          >
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

            {/* Enhanced Touch areas with better feedback */}
            <motion.button
              className="absolute left-0 top-0 w-1/3 h-full z-30 cursor-pointer active:bg-white/5"
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={(e) => handleTouchEnd('left', e)}
              onClick={() => onNavigate('prev')}
              whileTap={{ scale: 0.98 }}
              aria-label="Story anterior"
            />
            <motion.button
              className="absolute left-1/3 top-0 w-1/3 h-full z-30 cursor-pointer active:bg-white/5"
              onTouchStart={() => handleTouchStart('center')}
              onTouchEnd={(e) => handleTouchEnd('center', e)}
              whileTap={{ scale: 0.98 }}
              aria-label="Pausar/Reproduzir"
            />
            <motion.button
              className="absolute right-0 top-0 w-1/3 h-full z-30 cursor-pointer active:bg-white/5"
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={(e) => handleTouchEnd('right', e)}
              onClick={() => onNavigate('next')}
              whileTap={{ scale: 0.98 }}
              aria-label="Próximo story"
            />
          </motion.div>

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

          {/* Swipe direction indicator */}
          <AnimatePresence>
            {swipeDirection && isDragging && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center z-45 pointer-events-none"
              >
                <div className={`px-6 py-3 rounded-full text-white font-medium ${
                  swipeDirection === 'left' ? 'bg-trucker-blue/70' : 'bg-trucker-red/70'
                }`}>
                  {swipeDirection === 'left' ? '→ Próximo' : '← Anterior'}
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
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}