import { motion } from "framer-motion";
import { StoryCircle } from "@/components/stories/StoryCircle";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useStories } from "@/hooks/useStories";

export function Stories() {
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
      <div className="px-4 py-3 bg-background">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
              <div className="w-12 h-3 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-3 bg-background">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
          {collections.slice(0, 6).map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex-shrink-0"
            >
              <StoryCircle
                collection={collection}
                onClick={() => openStoryPlayer(collection.id, 0)}
              />
            </motion.div>
          ))}
        </div>
      </div>

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
    </>
  );
}