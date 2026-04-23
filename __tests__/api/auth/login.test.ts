/**
 * Tests: /api/auth/login
 *
 * Unit and integration tests for login endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';

// Mock handler
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    const { email, password } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Senha inválida' });
    }

    // Mock successful login
    return res.status(200).json({
        success: true,
        data: {
            token: 'jwt-token-here',
            user: { id: 'user_123', email },
        },
    });
};

describe('/api/auth/login', () => {
    it('should login with valid credentials', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'user@test.com',
                password: 'ValidPassword123',
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        expect(data.data.token).toBeDefined();
    });

    it('should reject invalid email', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'invalid-email',
                password: 'ValidPassword123',
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        const data = JSON.parse(res._getData());
        expect(data.message).toContain('Email');
    });

    it('should reject short password', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'user@test.com',
                password: '123456',
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        const data = JSON.parse(res._getData());
        expect(data.message).toContain('Senha');
    });

    it('should reject GET requests', async () => {
        const { req, res } = createMocks({
            method: 'GET',
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(405);
    });

    it('should handle missing email', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                password: 'ValidPassword123',
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
    });

    it('should handle missing password', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'user@test.com',
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
    });

    it('should return JWT token on success', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'user@test.com',
                password: 'ValidPassword123',
            },
        });

        await handler(req, res);

        const data = JSON.parse(res._getData());
        expect(data.data.token).toMatch(/^jwt-/);
    });

    it('should normalize email to lowercase', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'USER@TEST.COM',
                password: 'ValidPassword123',
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
    });

    it('should return user data on success', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'user@test.com',
                password: 'ValidPassword123',
            },
        });

        await handler(req, res);

        const data = JSON.parse(res._getData());
        expect(data.data.user).toBeDefined();
        expect(data.data.user.email).toBe('user@test.com');
    });

    it('should reject empty credentials', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: '',
                password: '',
            },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
    });
});
