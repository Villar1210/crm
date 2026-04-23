/**
 * Tests: /api/auth/register
 *
 * Unit and integration tests for user registration endpoint
 * Run with: npm run test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/auth/register';
import { prisma } from '@/server/prisma';

// Mock Prisma
vi.mock('@/server/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        verificationToken: {
            create: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
    },
}));

// Mock Email Service
vi.mock('@/server/lib/email', () => ({
    getEmailService: () => ({
        sendVerificationEmail: vi.fn().mockResolvedValue(true),
    }),
}));

describe('/api/auth/register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('POST - Register new user', () => {
        it('should register a new CLIENTE successfully', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                    'user-agent': 'Mozilla/5.0',
                },
            });

            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
            vi.mocked(prisma.user.create).mockResolvedValueOnce({
                id: 'user_123',
                email: 'joao@test.com',
                name: 'João Silva',
                role: 'CLIENTE',
                status: 'PENDING_EMAIL_VERIFICATION',
            } as any);

            await handler(req, res);

            expect(res._getStatusCode()).toBe(201);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
            expect(data.data.userId).toBe('user_123');
            expect(data.data.email).toBe('joao@test.com');
        });

        it('should require CPF for CORRETOR role', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'Maria Santos',
                    email: 'maria@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CORRETOR',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('CPF');
        });

        it('should require CNPJ for IMOBILIARIO role', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'Imobiliária XYZ',
                    email: 'imob@test.com',
                    password: 'SenhaFort3@123',
                    role: 'IMOBILIARIO',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('CNPJ');
        });

        it('should reject invalid email', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João',
                    email: 'invalid-email',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('Email');
        });

        it('should reject short name', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'Jo',
                    email: 'joao@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('mínimo 3');
        });

        it('should reject weak password', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    password: '123456',
                    role: 'CLIENTE',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('mínimo 8');
        });

        it('should reject duplicate email', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'existing@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
            });

            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 'user_existing',
                email: 'existing@test.com',
            } as any);

            await handler(req, res);

            expect(res._getStatusCode()).toBe(409);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('Email já cadastrado');
        });

        it('should handle method not allowed', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'GET',
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(405);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('Método não permitido');
        });

        it('should hash password correctly', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
            });

            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
            vi.mocked(prisma.user.create).mockResolvedValueOnce({
                id: 'user_123',
                email: 'joao@test.com',
                name: 'João Silva',
                role: 'CLIENTE',
                status: 'PENDING_EMAIL_VERIFICATION',
            } as any);

            await handler(req, res);

            expect(res._getStatusCode()).toBe(201);

            const createCall = vi.mocked(prisma.user.create).mock.calls[0];
            const passwordHash = createCall[0].data.passwordHash;
            expect(passwordHash).toBeTruthy();
            expect(passwordHash).not.toBe('SenhaFort3@123');
            expect(passwordHash.length).toBeGreaterThan(20);
        });

        it('should create verification token', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
            });

            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
            vi.mocked(prisma.user.create).mockResolvedValueOnce({
                id: 'user_123',
                email: 'joao@test.com',
            } as any);

            await handler(req, res);

            expect(res._getStatusCode()).toBe(201);
            expect(vi.mocked(prisma.verificationToken.create)).toHaveBeenCalled();

            const createCall = vi.mocked(prisma.verificationToken.create).mock.calls[0];
            const tokenData = createCall[0].data;
            expect(tokenData.email).toBe('joao@test.com');
            expect(tokenData.token).toBeTruthy();
            expect(tokenData.type).toBe('EMAIL_VERIFICATION');
            expect(tokenData.expires).toBeTruthy();
        });

        it('should log audit event', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
                headers: {
                    'x-forwarded-for': '192.168.1.100',
                    'user-agent': 'TestAgent/1.0',
                },
            });

            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
            vi.mocked(prisma.user.create).mockResolvedValueOnce({
                id: 'user_123',
                email: 'joao@test.com',
            } as any);

            await handler(req, res);

            expect(res._getStatusCode()).toBe(201);
            expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalled();

            const auditCall = vi.mocked(prisma.auditLog.create).mock.calls[0];
            const auditData = auditCall[0].data;
            expect(auditData.action).toBe('USER_CREATED');
            expect(auditData.ipAddress).toBe('192.168.1.100');
            expect(auditData.userAgent).toBe('TestAgent/1.0');
        });
    });

    describe('Edge cases', () => {
        it('should handle server errors gracefully', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'joao@test.com',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
            });

            vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
                new Error('Database connection failed')
            );

            await handler(req, res);

            expect(res._getStatusCode()).toBe(500);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toContain('Erro');
        });

        it('should normalize email to lowercase', async () => {
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: {
                    name: 'João Silva',
                    email: 'JOAO@TEST.COM',
                    password: 'SenhaFort3@123',
                    role: 'CLIENTE',
                },
            });

            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
            vi.mocked(prisma.user.create).mockResolvedValueOnce({
                id: 'user_123',
                email: 'joao@test.com',
            } as any);

            await handler(req, res);

            expect(res._getStatusCode()).toBe(201);

            const findCall = vi.mocked(prisma.user.findUnique).mock.calls[0];
            expect(findCall[0].where.email).toBe('joao@test.com');
        });
    });
});
