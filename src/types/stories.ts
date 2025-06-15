export interface Story {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  duration?: number; // em segundos, para vídeos
  author: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  location?: string;
  caption?: string;
  isViewed: boolean;
  isLive?: boolean;
}

export interface StoryCollection {
  id: string;
  title: string;
  category: 'oficial' | 'bastidores' | 'publico' | 'shows' | 'religioso';
  stories: Story[];
  thumbnailUrl: string;
  hasUnviewed: boolean;
  lastUpdated: Date;
}

export interface StoryPlayerState {
  currentCollection: string | null;
  currentStoryIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  isLoading: boolean;
  error: string | null;
  viewedStories: Set<string>;
}