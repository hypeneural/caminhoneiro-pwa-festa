export interface HistoricalMilestone {
  id: string;
  year: number;
  title: string;
  description: string;
  longDescription?: string;
  images?: Array<{
    url: string;
    caption: string;
    year: number;
    isHistorical: boolean;
  }>;
  significance: 'foundation' | 'growth' | 'recognition' | 'controversy' | 'future';
  participantsEstimate?: string;
  keyFigures?: Array<{
    name: string;
    role: string;
    photo?: string;
  }>;
  context: string;
  relatedEvents?: string[];
  sources?: string[];
}

export interface Testimonial {
  id: string;
  author: {
    name: string;
    photo?: string;
    role: string;
    yearsParticipating: number;
  };
  quote: string;
  fullTestimonial?: string;
  year: number;
  category: 'organizer' | 'trucker' | 'family' | 'authority' | 'participant';
  audioUrl?: string;
  isHighlighted: boolean;
  relatedMilestone?: string;
}

export interface HistoryPageState {
  milestones: HistoricalMilestone[];
  testimonials: Testimonial[];
  currentSection: string;
  activeTimelineItem: string | null;
  selectedDecade: number | null;
  galleryFilters: {
    decade: number | null;
    type: 'photos' | 'documents' | 'newspaper' | 'all';
    theme: string | null;
  };
  readingProgress: number;
  isLoading: boolean;
  error: string | null;
  userPreferences: {
    autoplay: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}