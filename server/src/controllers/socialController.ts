import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JobQueue } from '../services/queue';
import { socialPublishService } from '../services/socialPublishService';

const prisma = new PrismaClient();

type PostMetrics = {
    likes: number;
    comments: number;
    shares: number;
    views: number;
};

const DEFAULT_METRICS: PostMetrics = {
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0,
};

// Fake connections removed for production


const PROVIDERS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'googleMyBusiness', 'pinterest', 'youtube', 'threads', 'x', 'ga4', 'rdStation'];

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

const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeStatus = (value: unknown) => {
    const status = typeof value === 'string' ? value.trim() : '';
    if (status === 'scheduled' || status === 'published' || status === 'error') {
        return status;
    }
    return 'draft';
};

const normalizeProviders = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((provider) => String(provider));
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((provider) => String(provider));
            }
        } catch {
            return trimmed.split(',').map((provider) => provider.trim()).filter(Boolean);
        }
    }
    return [];
};

const parseMetrics = (value: string | null | undefined): PostMetrics => {
    const parsed = parseJson<Partial<PostMetrics>>(value, {});
    return {
        likes: Number(parsed.likes || 0),
        comments: Number(parsed.comments || 0),
        shares: Number(parsed.shares || 0),
        views: Number(parsed.views || 0),
    };
};

const formatConnection = (connection: any) => {
    const settings = parseJson<Record<string, boolean>>(connection.settings, {});
    return {
        id: connection.id,
        provider: connection.provider,
        name: connection.name,
        status: connection.status,
        settings: Object.keys(settings).length ? settings : undefined,
        externalId: connection.externalId || undefined,
        profileUrl: connection.profileUrl || undefined,
        connectedAt: connection.connectedAt ? connection.connectedAt.toISOString() : undefined
    };
};

const formatMedia = (media: any) => ({
    id: media.id,
    name: media.name,
    type: media.type,
    url: media.url,
    uploadedAt: media.uploadedAt?.toISOString(),
    usageCount: media.usageCount ?? 0,
});

const formatPost = (post: any) => ({
    id: post.id,
    text: post.text,
    mediaUrl: post.mediaUrl || undefined,
    mediaId: post.mediaId || undefined,
    providers: parseJson<string[]>(post.providers, []),
    status: post.status,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : undefined,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : undefined,
    metrics: post.metrics ? parseMetrics(post.metrics) : undefined,
    hashtags: post.hashtags || undefined,
    link: post.link || undefined,
    cta: post.cta || undefined,
    placements: post.placements ? parseJson(post.placements, undefined) : undefined,
    settings: post.settings ? parseJson(post.settings, undefined) : undefined,
});



export const getConnections = async (_req: Request, res: Response) => {
    try {
        // await ensureDefaultConnections(); // Removed fake data init
        const connections = await prisma.socialAccountConnection.findMany({
            orderBy: { provider: 'asc' },
        });
        res.json(connections.map(formatConnection));
    } catch (error) {
        console.error('Social connections fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch social connections' });
    }
};

export const updateConnection = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body || {};
        const updateData: Record<string, unknown> = {};

        if (Object.prototype.hasOwnProperty.call(data, 'name')) {
            updateData.name = typeof data.name === 'string' ? data.name.trim() : data.name;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'status')) {
            updateData.status = typeof data.status === 'string' ? data.status : 'disconnected';
        }
        if (Object.prototype.hasOwnProperty.call(data, 'settings')) {
            updateData.settings = toJsonString(data.settings);
        }

        const connection = await prisma.socialAccountConnection.update({
            where: { id },
            data: updateData,
        });

        res.json(formatConnection(connection));
    } catch (error: any) {
        if (error?.code === 'P2025') {
            res.status(404).json({ error: 'Connection not found' });
            return;
        }
        console.error('Social connection update failed:', error);
        res.status(500).json({ error: 'Failed to update social connection' });
    }
};

export const getPosts = async (_req: Request, res: Response) => {
    try {
        const posts = await prisma.socialPost.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(posts.map(formatPost));
    } catch (error) {
        console.error('Social posts fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch social posts' });
    }
};

export const createPost = async (req: Request, res: Response) => {
    try {
        const data = req.body || {};
        const providers = normalizeProviders(data.providers);
        if (providers.length === 0) {
            res.status(400).json({ error: 'At least one provider is required' });
            return;
        }

        const status = normalizeStatus(data.status);
        const scheduledAt = toDate(data.scheduledAt);
        const publishedAt = toDate(data.publishedAt);
        const scheduledAtValue = status === 'scheduled' ? scheduledAt || new Date() : scheduledAt;
        const publishedAtValue = status === 'published' ? publishedAt || new Date() : publishedAt;

        const metricsPayload =
            data.metrics ?? (status === 'published' ? DEFAULT_METRICS : null);

        let mediaId = typeof data.mediaId === 'string' ? data.mediaId : null;
        let mediaUrl = typeof data.mediaUrl === 'string' ? data.mediaUrl.trim() : null;

        if (mediaId) {
            const media = await prisma.socialMediaItem.findUnique({
                where: { id: mediaId },
            });
            if (media) {
                mediaUrl = media.url;
                await prisma.socialMediaItem.update({
                    where: { id: media.id },
                    data: { usageCount: { increment: 1 } },
                });
            } else {
                mediaId = null;
            }
        } else if (mediaUrl) {
            const media = await prisma.socialMediaItem.findFirst({
                where: { url: mediaUrl },
            });
            if (media) {
                mediaId = media.id;
                await prisma.socialMediaItem.update({
                    where: { id: media.id },
                    data: { usageCount: { increment: 1 } },
                });
            }
        }

        const textValue =
            typeof data.text === 'string' && data.text.trim()
                ? data.text.trim()
                : 'Post sem texto.';

        const post = await prisma.socialPost.create({
            data: {
                text: textValue,
                mediaUrl: mediaUrl || undefined,
                mediaId: mediaId || undefined,
                providers: JSON.stringify(providers),
                status,
                scheduledAt: scheduledAtValue || undefined,
                publishedAt: publishedAtValue || undefined,
                metrics: toJsonString(metricsPayload) || undefined,
                hashtags: typeof data.hashtags === 'string' ? data.hashtags.trim() : undefined,
                link: typeof data.link === 'string' ? data.link.trim() : undefined,
                cta: typeof data.cta === 'string' ? data.cta.trim() : undefined,
                placements: toJsonString(data.placements) || undefined,
                settings: toJsonString(data.settings) || undefined,
            },
        });
        if (status === 'published') {
            const publishedPost = await socialPublishService.publishPost(post.id);
            res.status(201).json(formatPost(publishedPost));
            return;
        }

        if (status === 'scheduled' && scheduledAtValue) {
            await JobQueue.add('social_publish', { postId: post.id }, scheduledAtValue);
        }

        res.status(201).json(formatPost(post));
    } catch (error) {
        console.error('Social post create failed:', error);
        res.status(500).json({ error: 'Failed to create social post' });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body || {};
        const updateData: Record<string, unknown> = {};

        if (Object.prototype.hasOwnProperty.call(data, 'text')) {
            updateData.text = typeof data.text === 'string' ? data.text.trim() : data.text;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'mediaUrl')) {
            updateData.mediaUrl =
                typeof data.mediaUrl === 'string' && data.mediaUrl.trim()
                    ? data.mediaUrl.trim()
                    : null;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'mediaId')) {
            updateData.mediaId =
                typeof data.mediaId === 'string' && data.mediaId.trim()
                    ? data.mediaId.trim()
                    : null;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'providers')) {
            const providers = normalizeProviders(data.providers);
            updateData.providers = JSON.stringify(providers);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'status')) {
            updateData.status = normalizeStatus(data.status);
            if (updateData.status === 'published' && !data.publishedAt) {
                updateData.publishedAt = new Date();
            }
        }
        if (Object.prototype.hasOwnProperty.call(data, 'scheduledAt')) {
            updateData.scheduledAt = toDate(data.scheduledAt);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'publishedAt')) {
            updateData.publishedAt = toDate(data.publishedAt);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'metrics')) {
            updateData.metrics = toJsonString(data.metrics);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'hashtags')) {
            updateData.hashtags =
                typeof data.hashtags === 'string' ? data.hashtags.trim() : null;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'link')) {
            updateData.link = typeof data.link === 'string' ? data.link.trim() : null;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'cta')) {
            updateData.cta = typeof data.cta === 'string' ? data.cta.trim() : null;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'placements')) {
            updateData.placements = toJsonString(data.placements);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'settings')) {
            updateData.settings = toJsonString(data.settings);
        }

        const post = await prisma.socialPost.update({
            where: { id },
            data: updateData,
        });

        res.json(formatPost(post));
    } catch (error: any) {
        if (error?.code === 'P2025') {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        console.error('Social post update failed:', error);
        res.status(500).json({ error: 'Failed to update social post' });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.socialPost.delete({ where: { id } });
        res.status(204).send();
    } catch (error: any) {
        if (error?.code === 'P2025') {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        console.error('Social post delete failed:', error);
        res.status(500).json({ error: 'Failed to delete social post' });
    }
};

export const getMedia = async (_req: Request, res: Response) => {
    try {
        const media = await prisma.socialMediaItem.findMany({
            orderBy: { uploadedAt: 'desc' },
        });
        res.json(media.map(formatMedia));
    } catch (error) {
        console.error('Social media fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch social media' });
    }
};

export const createMedia = async (req: Request, res: Response) => {
    try {
        const data = req.body || {};
        const name = typeof data.name === 'string' ? data.name.trim() : '';
        if (!name) {
            res.status(400).json({ error: 'Media name is required' });
            return;
        }
        const type = data.type === 'video' ? 'video' : 'image';
        const url =
            typeof data.url === 'string' && data.url.trim()
                ? data.url.trim()
                : '';
        const uploadedAt = toDate(data.uploadedAt) || new Date();

        const media = await prisma.socialMediaItem.create({
            data: {
                name,
                type,
                url,
                uploadedAt,
                usageCount: 0,
            },
        });

        res.status(201).json(formatMedia(media));
    } catch (error) {
        console.error('Social media create failed:', error);
        res.status(500).json({ error: 'Failed to create social media' });
    }
};

export const deleteMedia = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.socialMediaItem.delete({ where: { id } });
        res.status(204).send();
    } catch (error: any) {
        if (error?.code === 'P2025') {
            res.status(404).json({ error: 'Media not found' });
            return;
        }
        console.error('Social media delete failed:', error);
        res.status(500).json({ error: 'Failed to delete social media' });
    }
};

export const getReports = async (req: Request, res: Response) => {
    try {
        const days = Math.max(1, Number(req.query.days) || 30);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const posts = await prisma.socialPost.findMany({
            where: {
                status: 'published',
            },
            orderBy: { publishedAt: 'desc' },
        });

        const summaryByProvider = new Map<string, { posts: number; reach: number; engagement: number }>();
        let totalReach = 0;
        let totalEngagement = 0;
        let totalImpressions = 0;

        posts.forEach((post) => {
            const postDate = post.publishedAt || post.createdAt;
            if (!postDate || postDate < cutoff) {
                return;
            }
            const metrics = parseMetrics(post.metrics);
            const engagement = metrics.likes + metrics.comments + metrics.shares;
            totalReach += metrics.views;
            totalEngagement += engagement;
            totalImpressions += metrics.views + engagement;

            const providers = parseJson<string[]>(post.providers, []);
            providers.forEach((provider) => {
                const current = summaryByProvider.get(provider) || {
                    posts: 0,
                    reach: 0,
                    engagement: 0,
                };
                summaryByProvider.set(provider, {
                    posts: current.posts + 1,
                    reach: current.reach + metrics.views,
                    engagement: current.engagement + engagement,
                });
            });
        });

        const formatNumber = (value: number) =>
            new Intl.NumberFormat('pt-BR').format(value);
        const formatCompact = (value: number) =>
            new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

        const kpis = [
            {
                label: 'Alcance total',
                value: formatCompact(totalReach),
                hint: `Ultimos ${days} dias`,
            },
            {
                label: 'Impressoes',
                value: formatCompact(totalImpressions),
                hint: `Ultimos ${days} dias`,
            },
            {
                label: 'Engajamento',
                value: formatCompact(totalEngagement),
                hint: 'Curtidas + comentarios + compartilhamentos',
            },
            {
                label: 'Crescimento de seguidores',
                value: formatNumber(Math.round(totalEngagement * 0.08)),
                hint: `Ultimos ${days} dias`,
            },
        ];

        const networkSummaries = PROVIDERS.map((provider) => {
            const data = summaryByProvider.get(provider) || {
                posts: 0,
                reach: 0,
                engagement: 0,
            };
            const ctr = data.reach > 0 ? (data.engagement / data.reach) * 100 : 0;
            return {
                provider,
                posts: data.posts,
                reach: data.reach,
                engagement: data.engagement,
                ctr,
            };
        });

        res.json({ kpis, networkSummaries });
    } catch (error) {
        console.error('Social reports fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch social reports' });
    }
};
