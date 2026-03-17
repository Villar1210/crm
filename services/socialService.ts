import { ApiClient } from './api';
import type {
  SocialAccountConnection,
  SocialIntegration,
  SocialKpi,
  SocialMediaItem,
  SocialNetworkSummary,
  SocialPost,
  SocialStatus
} from '../types/social';

type SocialReportResponse = {
  kpis: SocialKpi[];
  networkSummaries: SocialNetworkSummary[];
};

type ConnectionUpdatePayload = Partial<Pick<SocialAccountConnection, 'name' | 'status' | 'settings'>>;

type CreatePostPayload = {
  text: string;
  providers: SocialIntegration[];
  status: SocialStatus;
  mediaUrl?: string;
  mediaId?: string;
  scheduledAt?: string;
  publishedAt?: string;
  hashtags?: string;
  link?: string;
  cta?: string;
  placements?: unknown;
  settings?: unknown;
};

type CreateMediaPayload = {
  name: string;
  type: SocialMediaItem['type'];
  url?: string;
  uploadedAt?: string;
};

export const socialService = {
  getConnections: async (): Promise<SocialAccountConnection[]> => {
    return ApiClient.get<SocialAccountConnection[]>('/social/connections');
  },
  disconnectProvider: async (provider: SocialIntegration): Promise<SocialAccountConnection> => {
    return ApiClient.post<SocialAccountConnection>(`/social/oauth/${provider}/disconnect`, {});
  },
  updateConnection: async (
    id: string,
    data: ConnectionUpdatePayload
  ): Promise<SocialAccountConnection> => {
    return ApiClient.put<SocialAccountConnection>(`/social/connections/${id}`, data);
  },
  getPosts: async (): Promise<SocialPost[]> => {
    return ApiClient.get<SocialPost[]>('/social/posts');
  },
  createPost: async (payload: CreatePostPayload): Promise<SocialPost> => {
    return ApiClient.post<SocialPost>('/social/posts', payload);
  },
  updatePost: async (id: string, payload: Partial<CreatePostPayload>): Promise<SocialPost> => {
    return ApiClient.put<SocialPost>(`/social/posts/${id}`, payload);
  },
  deletePost: async (id: string): Promise<void> => {
    await ApiClient.delete(`/social/posts/${id}`);
  },
  getMedia: async (): Promise<SocialMediaItem[]> => {
    return ApiClient.get<SocialMediaItem[]>('/social/media');
  },
  createMedia: async (payload: CreateMediaPayload): Promise<SocialMediaItem> => {
    return ApiClient.post<SocialMediaItem>('/social/media', payload);
  },
  deleteMedia: async (id: string): Promise<void> => {
    await ApiClient.delete(`/social/media/${id}`);
  },
  getReports: async (days: number = 30): Promise<SocialReportResponse> => {
    return ApiClient.get<SocialReportResponse>(`/social/reports?days=${days}`);
  }
};
