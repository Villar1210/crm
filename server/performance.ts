/**
 * Performance & Optimization
 *
 * Rate limiting, caching, and performance optimization utilities
 */

import { NextApiRequest, NextApiResponse } from 'next';

// ─────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
    [ip: string]: {
        count: number;
        resetTime: number;
    };
}

class RateLimiter {
    private store: RateLimitStore = {};

    constructor(private config: RateLimitConfig) {}

    isAllowed(ip: string): boolean {
        const now = Date.now();
        const record = this.store[ip];

        if (!record || now > record.resetTime) {
            this.store[ip] = {
                count: 1,
                resetTime: now + this.config.windowMs,
            };
            return true;
        }

        if (record.count >= this.config.maxRequests) {
            return false;
        }

        record.count++;
        return true;
    }

    getRemaining(ip: string): number {
        const record = this.store[ip];
        if (!record) return this.config.maxRequests;
        return Math.max(0, this.config.maxRequests - record.count);
    }

    getResetTime(ip: string): number {
        const record = this.store[ip];
        return record?.resetTime || 0;
    }

    reset(ip: string): void {
        delete this.store[ip];
    }

    clear(): void {
        this.store = {};
    }
}

export const rateLimiters = {
    auth: new RateLimiter({
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
    }),
    login: new RateLimiter({
        windowMs: 15 * 60 * 1000,
        maxRequests: 10,
    }),
    email: new RateLimiter({
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
    }),
    passwordReset: new RateLimiter({
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
    }),
    api: new RateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 100,
    }),
};

export function withRateLimit(limiter: RateLimiter) {
    return (handler: any) => {
        return async (req: NextApiRequest, res: NextApiResponse) => {
            const ip =
                (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                req.headers['x-real-ip'] ||
                req.socket.remoteAddress ||
                'unknown';

            if (!limiter.isAllowed(ip)) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas tentativas. Tente novamente mais tarde.',
                    retryAfter: limiter.getResetTime(ip),
                });
            }

            res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
            res.setHeader('X-RateLimit-Remaining', limiter.getRemaining(ip));
            res.setHeader('X-RateLimit-Reset', limiter.getResetTime(ip));

            return handler(req, res);
        };
    };
}

// ─────────────────────────────────────────────────
// SECURITY HEADERS
// ─────────────────────────────────────────────────

export const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export function withSecurityHeaders(handler: any) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        Object.entries(securityHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        res.setHeader('X-Content-Type-Options', 'application/json');

        return handler(req, res);
    };
}

// ─────────────────────────────────────────────────
// RESPONSE CACHING
// ─────────────────────────────────────────────────

interface CacheConfig {
    ttl: number;
    key: string;
}

class Cache {
    private store: Map<string, { data: any; expiresAt: number }> = new Map();

    get(key: string): any | null {
        const item = this.store.get(key);

        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }

        return item.data;
    }

    set(key: string, data: any, ttl: number): void {
        const expiresAt = Date.now() + ttl * 1000;
        this.store.set(key, { data, expiresAt });
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    keys(): string[] {
        return Array.from(this.store.keys());
    }

    size(): number {
        return this.store.size;
    }

    cleanup(): number {
        let removed = 0;
        const now = Date.now();

        for (const [key, item] of this.store.entries()) {
            if (now > item.expiresAt) {
                this.store.delete(key);
                removed++;
            }
        }

        return removed;
    }
}

export const cache = new Cache();

export function withCache(config: CacheConfig) {
    return (handler: any) => {
        return async (req: NextApiRequest, res: NextApiResponse) => {
            if (req.method !== 'GET') {
                return handler(req, res);
            }

            const cachedData = cache.get(config.key);
            if (cachedData) {
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(cachedData);
            }

            const originalJson = res.json.bind(res);

            res.json = (data: any) => {
                cache.set(config.key, data, config.ttl);
                res.setHeader('X-Cache', 'MISS');
                return originalJson(data);
            };

            return handler(req, res);
        };
    };
}

// ─────────────────────────────────────────────────
// PERFORMANCE MONITORING
// ─────────────────────────────────────────────────

export interface PerformanceMetrics {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    timestamp: Date;
    ip: string;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics[] = [];

    record(metric: PerformanceMetrics): void {
        this.metrics.push(metric);

        if (this.metrics.length > 1000) {
            this.metrics.shift();
        }

        if (metric.duration > 1000) {
            console.warn(\`⚠️  Slow request detected:\`, {
                endpoint: metric.endpoint,
                duration: \`\${metric.duration}ms\`,
                ip: metric.ip,
            });
        }
    }

    getMetrics(endpoint?: string): PerformanceMetrics[] {
        if (!endpoint) return this.metrics;
        return this.metrics.filter((m) => m.endpoint === endpoint);
    }

    getAverageDuration(endpoint?: string): number {
        const metrics = this.getMetrics(endpoint);
        if (metrics.length === 0) return 0;
        const total = metrics.reduce((sum, m) => sum + m.duration, 0);
        return total / metrics.length;
    }

    getSummary(): {
        totalRequests: number;
        avgDuration: number;
        slowRequests: number;
        errorRequests: number;
    } {
        return {
            totalRequests: this.metrics.length,
            avgDuration: this.getAverageDuration(),
            slowRequests: this.metrics.filter((m) => m.duration > 1000).length,
            errorRequests: this.metrics.filter((m) => m.statusCode >= 400).length,
        };
    }

    clear(): void {
        this.metrics = [];
    }
}

export const performanceMonitor = new PerformanceMonitor();

export function withPerformanceMonitoring(handler: any) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const startTime = Date.now();
        const endpoint = req.url || 'unknown';
        const ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
            req.socket.remoteAddress ||
            'unknown';

        const result = await handler(req, res);

        const duration = Date.now() - startTime;
        performanceMonitor.record({
            endpoint,
            method: req.method || 'GET',
            statusCode: res.statusCode,
            duration,
            timestamp: new Date(),
            ip,
        });

        res.setHeader('X-Response-Time', \`\${duration}ms\`);

        return result;
    };
}

// ─────────────────────────────────────────────────
// CLEANUP INTERVAL
// ─────────────────────────────────────────────────

if (typeof global !== 'undefined') {
    const cleanupInterval = setInterval(() => {
        const removed = cache.cleanup();
        if (removed > 0) {
            console.log(\`🧹 Cleanup: Removed \${removed} expired cache entries\`);
        }
    }, 10 * 60 * 1000);

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }
}
