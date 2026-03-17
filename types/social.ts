export type SocialIntegration =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'googleMyBusiness'
  | 'pinterest'
  | 'youtube'
  | 'threads'
  | 'x'
  | 'ga4'
  | 'rdStation';

export type SocialStatus = 'draft' | 'scheduled' | 'published' | 'error';

export interface SocialAccountConnection {
  id: string;
  provider: SocialIntegration;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  settings?: Record<string, boolean>;
  externalId?: string;
  profileUrl?: string;
  connectedAt?: string;
}

export interface SocialPostMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface SocialPost {
  id: string;
  text: string;
  mediaUrl?: string;
  mediaId?: string;
  providers: SocialIntegration[];
  status: SocialStatus;
  scheduledAt?: string;
  publishedAt?: string;
  metrics?: SocialPostMetrics;
  hashtags?: string;
  link?: string;
  cta?: string;
  placements?: unknown;
  settings?: Record<string, unknown>;
}

export interface SocialMediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  uploadedAt: string;
  usageCount: number;
}

export interface SocialKpi {
  label: string;
  value: string;
  hint: string;
}

export interface SocialNetworkSummary {
  provider: SocialIntegration;
  posts: number;
  reach: number;
  engagement: number;
  ctr: number;
}
