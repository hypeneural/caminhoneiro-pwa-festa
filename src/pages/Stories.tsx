import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { StoryCircle } from '@/components/stories/StoryCircle';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { useStories } from '@/hooks/useStories';

const Stories = () => {
  const {
    collections,
    playerState,
    loading,
    openStoryPlayer,
    closeStoryPlayer,
    navigateStory,
    togglePlayPause,
    toggleMute,
    markStoryAsViewed,
    updateProgress,
    getCurrentStory,
    getCurrentCollection
  } = useStories();

  const currentStory = getCurrentStory();
  const currentCollection = getCurrentCollection();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 flex items-center shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-trucker-blue-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Stories da Festa</h1>
          </div>
        </motion.header>

        {/* Loading skeletons */}
        <main className="pt-16 pb-20">
          <div className="p-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 pb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-12 h-3" />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 flex items-center shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Stories da Festa</h1>
            <p className="text-xs text-muted-foreground">
              {collections.length} coleções disponíveis
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-16 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4"
        >
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum story disponível
              </h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Os stories da festa aparecerão aqui. Volte em breve para ver os momentos mais incríveis!
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 pb-4">
                {collections.map((collection, index) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StoryCircle
                      collection={collection}
                      onClick={() => openStoryPlayer(collection.id, 0)}
                    />
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {/* Additional content sections could go here */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Destaques da Festa
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {collections.slice(0, 4).map((collection) => (
                <motion.div
                  key={`highlight-${collection.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => openStoryPlayer(collection.id, 0)}
                >
                  <img
                    src={collection.thumbnailUrl}
                    alt={collection.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-medium text-sm">
                      {collection.title}
                    </p>
                    <p className="text-white/70 text-xs">
                      {collection.stories.length} stories
                    </p>
                  </div>
                  {collection.hasUnviewed && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-trucker-red rounded-full" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Story Viewer */}
      <StoryViewer
        isOpen={playerState.currentCollection !== null}
        currentStory={currentStory}
        currentCollection={currentCollection}
        storyIndex={playerState.currentStoryIndex}
        isPlaying={playerState.isPlaying}
        isMuted={playerState.isMuted}
        progress={playerState.progress}
        onClose={closeStoryPlayer}
        onNavigate={navigateStory}
        onTogglePlayPause={togglePlayPause}
        onToggleMute={toggleMute}
        onMarkAsViewed={markStoryAsViewed}
        onUpdateProgress={updateProgress}
      />

      <BottomNavigation />
    </div>
  );
};

export default Stories;