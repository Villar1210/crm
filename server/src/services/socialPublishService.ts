import { PrismaClient } from '@prisma/client';
import { requestJson } from './httpClient';

const prisma = new PrismaClient();
const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

type PostPayload = {
  text: string;
  mediaUrl?: string | null;
  hashtags?: string | null;
  link?: string | null;
  cta?: string | null;
};

type PublishResult = {
  provider: string;
  success: boolean;
  externalId?: string;
  error?: string;
};

const DEFAULT_METRICS = {
  likes: 0,
  comments: 0,
  shares: 0,
  views: 0
};

const parseJson = <T,>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const toJsonString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const composeMessage = (payload: PostPayload) => {
  const parts = [payload.text];
  if (payload.cta && payload.cta !== 'Nenhum') {
    parts.push(payload.cta);
  }
  if (payload.link) {
    parts.push(payload.link);
  }
  if (payload.hashtags) {
    parts.push(payload.hashtags);
  }
  return parts.filter(Boolean).join('\n\n');
};

const isVideoUrl = (url: string) =>
  /\.(mp4|mov|m4v|webm|avi)(\?.*)?$/i.test(url);

const publishToFacebook = async (payload: PostPayload, token: any) => {
  const meta = parseJson<Record<string, any>>(token.meta, {});
  const pageId = meta.pageId || token.accountId;
  if (!pageId) {
    throw new Error('Facebook page id not configured');
  }
  const accessToken = token.accessToken;
  const message = composeMessage(payload);

  if (payload.mediaUrl) {
    const endpoint = isVideoUrl(payload.mediaUrl)
      ? `${META_API_BASE}/${pageId}/videos`
      : `${META_API_BASE}/${pageId}/photos`;
    const body = new URLSearchParams({
      access_token: accessToken,
      ...(isVideoUrl(payload.mediaUrl)
        ? { file_url: payload.mediaUrl, description: message }
        : { url: payload.mediaUrl, caption: message })
    }).toString();
    const response = await requestJson<any>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    return response.id as string | undefined;
  }

  const body = new URLSearchParams({
    access_token: accessToken,
    message,
    ...(payload.link ? { link: payload.link } : {})
  }).toString();
  const response = await requestJson<any>(`${META_API_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  return response.id as string | undefined;
};

const publishToInstagram = async (payload: PostPayload, token: any) => {
  const meta = parseJson<Record<string, any>>(token.meta, {});
  const igUserId = meta.igUserId || token.accountId;
  if (!igUserId) {
    throw new Error('Instagram business account not configured');
  }
  if (!payload.mediaUrl) {
    throw new Error('Instagram requires media URL');
  }
  const accessToken = token.accessToken;
  const caption = composeMessage(payload);
  const isVideo = isVideoUrl(payload.mediaUrl);

  const createBody = new URLSearchParams({
    access_token: accessToken,
    ...(isVideo
      ? { video_url: payload.mediaUrl, media_type: 'VIDEO', caption }
      : { image_url: payload.mediaUrl, caption })
  }).toString();

  const media = await requestJson<{ id: string }>(`${META_API_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: createBody
  });

  const publishBody = new URLSearchParams({
    access_token: accessToken,
    creation_id: media.id
  }).toString();

  const published = await requestJson<{ id: string }>(
    `${META_API_BASE}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishBody
    }
  );

  return published.id;
};

const publishToLinkedIn = async (payload: PostPayload, token: any) => {
  const accountId = token.accountId;
  if (!accountId) {
    throw new Error('LinkedIn account not configured');
  }
  const message = composeMessage(payload);
  const body = JSON.stringify({
    author: `urn:li:person:${accountId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: message },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  });

  const response = await requestJson<any>('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.accessToken}`
    },
    body
  });

  return response.id as string | undefined;
};

const publishToProvider = async (provider: string, payload: PostPayload) => {
  const connection = await prisma.socialAccountConnection.findUnique({
    where: { provider },
    include: { token: true }
  });

  if (!connection || !connection.token) {
    throw new Error(`No token for provider ${provider}`);
  }

  if (provider === 'facebook') {
    return publishToFacebook(payload, connection.token);
  }
  if (provider === 'instagram') {
    return publishToInstagram(payload, connection.token);
  }
  if (provider === 'linkedin') {
    return publishToLinkedIn(payload, connection.token);
  }

  throw new Error(`Provider ${provider} not supported for publishing`);
};

export const socialPublishService = {
  publishPost: async (postId: string) => {
    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new Error('Post not found');
    }

    const providers = parseJson<string[]>(post.providers, []);
    const payload: PostPayload = {
      text: post.text,
      mediaUrl: post.mediaUrl,
      hashtags: post.hashtags,
      link: post.link,
      cta: post.cta
    };

    const results: PublishResult[] = [];
    for (const provider of providers) {
      try {
        const externalId = await publishToProvider(provider, payload);
        results.push({ provider, success: true, externalId });
      } catch (error: any) {
        results.push({
          provider,
          success: false,
          error: error?.message || 'Publish failed'
        });
      }
    }

    const allSucceeded = results.length > 0 && results.every((item) => item.success);
    const anySucceeded = results.some((item) => item.success);
    const nextStatus = allSucceeded ? 'published' : anySucceeded ? 'error' : 'error';
    const existingSettings = parseJson<Record<string, any>>(post.settings, {});
    existingSettings.publishResults = results;

    const updated = await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: nextStatus,
        publishedAt: anySucceeded ? new Date() : post.publishedAt,
        metrics: post.metrics ? post.metrics : JSON.stringify(DEFAULT_METRICS),
        settings: toJsonString(existingSettings) || undefined
      }
    });

    return updated;
  }
};

