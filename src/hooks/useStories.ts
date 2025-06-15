import { useState, useEffect, useCallback } from 'react';
import { StoryCollection, Story, StoryPlayerState } from '@/types/stories';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Mock data for demonstration
const generateMockStories = (): StoryCollection[] => {
  const categories = ['oficial', 'bastidores', 'publico', 'shows', 'religioso'] as const;
  const authors = [
    { name: 'Organização', avatar: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=100' },
    { name: 'Equipe Técnica', avatar: 'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=100' },
    { name: 'Público', avatar: 'https://images.unsplash.com/photo-1518877593221-1f28583780b4?auto=format&fit=crop&q=80&w=100' },
    { name: 'Shows', avatar: 'https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=100' },
    { name: 'Momentos Religiosos', avatar: 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&q=80&w=100' }
  ];

  const imageUrls = [
    'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1518877593221-1f28583780b4?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=800'
  ];

  return categories.map((category, categoryIndex) => {
    const storiesCount = Math.floor(Math.random() * 5) + 3; // 3-7 stories per collection
    const stories: Story[] = Array.from({ length: storiesCount }, (_, storyIndex) => {
      const isVideo = Math.random() > 0.7; // 30% chance of being a video
      const imageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
      
      return {
        id: `story-${categoryIndex}-${storyIndex}`,
        type: isVideo ? 'video' : 'image',
        url: imageUrl,
        thumbnailUrl: imageUrl + '&w=200',
        duration: isVideo ? Math.floor(Math.random() * 25) + 5 : 5, // 5-30s for videos, 5s for images
        author: authors[categoryIndex],
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
        location: 'São Cristóvão, Chapecó - SC',
        caption: `Momento incrível da ${category}!`,
        isViewed: Math.random() > 0.5,
        isLive: categoryIndex === 0 && storyIndex === 0 // First story of first collection is live
      };
    });

    return {
      id: `collection-${categoryIndex}`,
      title: authors[categoryIndex].name,
      category,
      stories,
      thumbnailUrl: stories[0].thumbnailUrl,
      hasUnviewed: stories.some(story => !story.isViewed),
      lastUpdated: new Date()
    };
  });
};

export const useStories = () => {
  const [collections, setCollections] = useState<StoryCollection[]>([]);
  const [viewedStories, setViewedStories] = useLocalStorage<string[]>('viewed-stories', []);
  const [loading, setLoading] = useState(true);

  const [playerState, setPlayerState] = useState<StoryPlayerState>({
    currentCollection: null,
    currentStoryIndex: 0,
    isPlaying: false,
    isMuted: false,
    progress: 0,
    isLoading: false,
    error: null,
    viewedStories: new Set(viewedStories)
  });

  // Initialize with mock data
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockCollections = generateMockStories();
        
        // Update viewed status based on local storage
        const updatedCollections = mockCollections.map(collection => ({
          ...collection,
          stories: collection.stories.map(story => ({
            ...story,
            isViewed: viewedStories.includes(story.id)
          })),
          hasUnviewed: collection.stories.some(story => !viewedStories.includes(story.id))
        }));

        setCollections(updatedCollections);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, [viewedStories]);

  const openStoryPlayer = useCallback((collectionId: string, storyIndex: number = 0) => {
    setPlayerState(prev => ({
      ...prev,
      currentCollection: collectionId,
      currentStoryIndex: storyIndex,
      isPlaying: true,
      progress: 0,
      error: null
    }));
  }, []);

  const closeStoryPlayer = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      currentCollection: null,
      currentStoryIndex: 0,
      isPlaying: false,
      progress: 0
    }));
  }, []);

  const navigateStory = useCallback((direction: 'next' | 'prev') => {
    if (!playerState.currentCollection) return;

    const currentCollection = collections.find(c => c.id === playerState.currentCollection);
    if (!currentCollection) return;

    setPlayerState(prev => {
      if (direction === 'next') {
        if (prev.currentStoryIndex < currentCollection.stories.length - 1) {
          // Stay within current collection - navigate to next story
          return {
            ...prev,
            currentStoryIndex: prev.currentStoryIndex + 1,
            progress: 0,
            isPlaying: true
          };
        } else {
          // End of current collection - stay here instead of auto-advancing
          return {
            ...prev,
            currentCollection: null,
            currentStoryIndex: 0,
            isPlaying: false,
            progress: 0
          };
        }
      } else {
        // Previous navigation
        if (prev.currentStoryIndex > 0) {
          // Stay within current collection - navigate to previous story
          return {
            ...prev,
            currentStoryIndex: prev.currentStoryIndex - 1,
            progress: 0,
            isPlaying: true
          };
        } else {
          // Beginning of collection - stay at first story
          return {
            ...prev,
            progress: 0,
            isPlaying: true
          };
        }
      }
    });
  }, [playerState.currentCollection, collections]);

  const togglePlayPause = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  }, []);

  const toggleMute = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  }, []);

  const markStoryAsViewed = useCallback((storyId: string) => {
    if (!viewedStories.includes(storyId)) {
      const newViewedStories = [...viewedStories, storyId];
      setViewedStories(newViewedStories);
      
      setPlayerState(prev => ({
        ...prev,
        viewedStories: new Set(newViewedStories)
      }));

      // Update collections to reflect viewed status
      setCollections(prev => prev.map(collection => ({
        ...collection,
        stories: collection.stories.map(story => 
          story.id === storyId ? { ...story, isViewed: true } : story
        ),
        hasUnviewed: collection.stories.some(story => 
          story.id !== storyId && !newViewedStories.includes(story.id)
        )
      })));
    }
  }, [viewedStories, setViewedStories]);

  const updateProgress = useCallback((progress: number) => {
    setPlayerState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  const getCurrentStory = useCallback((): Story | null => {
    if (!playerState.currentCollection) return null;
    
    const collection = collections.find(c => c.id === playerState.currentCollection);
    if (!collection) return null;
    
    return collection.stories[playerState.currentStoryIndex] || null;
  }, [playerState.currentCollection, playerState.currentStoryIndex, collections]);

  const getCurrentCollection = useCallback((): StoryCollection | null => {
    if (!playerState.currentCollection) return null;
    return collections.find(c => c.id === playerState.currentCollection) || null;
  }, [playerState.currentCollection, collections]);

  return {
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
  };
};