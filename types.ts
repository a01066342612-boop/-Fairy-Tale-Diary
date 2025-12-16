export type FontFamily = 'basic' | 'cute' | 'hand' | 'dongle' | 'gamja' | 'poor';
export type FontSize = 'x-small' | 'small' | 'medium' | 'large' | 'x-large';
export type DrawingLevel = 'low' | 'medium' | 'high';
export type WritingGrade = 1 | 2 | 3 | 4 | 5 | 6;

export interface StoryStyleConfig {
  fontFamily: FontFamily;
  fontSize: FontSize;
  drawingLevel?: DrawingLevel;
  writingGrade?: WritingGrade;
}

export interface StoryEntry {
  id: string;
  videoUrl: string;
  videoId: string;
  title: string;
  summary: string;
  favoriteScene: string;
  thoughts: string;
  generatedImageUrl?: string;
  styleConfig?: StoryStyleConfig;
  createdAt: number;
}

export interface YouTubeAnalysisResult {
  title: string;
  summary: string;
  recommendedScene: string;
  recommendedThoughts: string;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}