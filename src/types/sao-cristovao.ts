import { LucideIcon } from "lucide-react";

export interface ContentSection {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  content: string;
  subsections?: ContentSection[];
  isExpandable?: boolean;
}

export interface LegendComparison {
  attribute: string;
  western: string;
  eastern: string;
}

export interface TimelineEvent {
  id: string;
  period: string;
  title: string;
  description: string;
  icon: LucideIcon;
  significance: 'origin' | 'evolution' | 'modern' | 'brazil';
}

export interface DevotionPractice {
  id: string;
  title: string;
  description: string;
  type: 'prayer' | 'blessing' | 'celebration' | 'tradition';
  icon: LucideIcon;
  location?: string;
}

export interface SaintChristopherData {
  historicalFacts: ContentSection[];
  legends: LegendComparison[];
  patronageEvolution: TimelineEvent[];
  brazilianHistory: ContentSection[];
  devotionPractices: DevotionPractice[];
}

export interface SaoCristovaoPageState {
  sections: ContentSection[];
  activeSectionId: string | null;
  isLoading: boolean;
  error: string | null;
  userPreferences: {
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}