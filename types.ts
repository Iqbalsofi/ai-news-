
export type Sentiment = 'bullish' | 'bearish' | 'neutral';
export type AppView = 'hub' | 'map' | 'memory' | 'config';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  timestamp: Date;
  sources: Source[];
  topic: string;
  imageUrl: string;
  isPostedToX: boolean;
  sentiment: Sentiment;
  location?: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface AppConfig {
  topic: string;
  updateIntervalMinutes: number;
  autoPostToX: boolean;
  localMode: boolean;
  isXConnected: boolean;
}

export enum NewsTopic {
  GENERAL = 'General News',
  TECH = 'Technology',
  BUSINESS = 'Business',
  SPORTS = 'Sports',
  SCIENCE = 'Science',
  ENTERTAINMENT = 'Entertainment',
  CRYPTO = 'Crypto & Web3'
}
