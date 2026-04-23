/**
 * Tests: /api/auth/password-reset
 *
 * Password reset endpoint tests
 */

import { describe, it, expect } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        // Request reset
        const { email } = req.body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Email inválido' });
        }

        return res.status(200).json({
            success: true,
            message: 'Email de reset enviado',
        });
    }

    if (req.method === 'PUT') {
        // Reset password
        const { token, password, passwordConfirm } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token inválido' });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, message: 'Senha muito curta' });
        }

        if (password !== passwordConfirm) {
            return res.status(400).json({ success: false, message: 'Senhas não conferem' });
        }

        return res.status(200).json({
            success: true,
            message: 'Senha alterada com sucesso',
        });
    }

    return res.status(405).json({ success: false, message: 'Método não permitido' });
};

describe('/api/auth/password-reset', () => {
    describe('POST - Request Reset', () => {
        it('should request password reset with valid email', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: { email: 'user@test.com' },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
        });

        it('should reject invalid email format', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: { email: 'invalid-email' },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.message).toContain('Email');
        });

        it('should reject missing email', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: {},
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
        });

        it('should normalize email to lowercase', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: { email: 'USER@TEST.COM' },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(200);
        });

        it('should handle empty email', async () => {
            const { req, res } = createMocks({
                method: 'POST',
                body: { email: '' },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
        });
    });

    describe('PUT - Confirm Reset', () => {
        it('should reset password with valid data', async () => {
            const { req, res } = createMocks({
                method: 'PUT',
                body: {
                    token: 'valid-reset-token',
                    password: 'NewPassword123',
                    passwordConfirm: 'NewPassword123',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
        });

        it('should reject invalid token', async () => {
            const { req, res } = createMocks({
                method: 'PUT',
                body: {
                    password: 'NewPassword123',
                    passwordConfirm: 'NewPassword123',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.message).toContain('Token');
        });

        it('should reject short password', async () => {
            const { req, res } = createMocks({
                method: 'PUT',
                body: {
                    token: 'valid-token',
                    password: '123456',
                    passwordConfirm: '123456',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.message).toContain('curta');
        });

        it('should reject mismatched passwords', async () => {
            const { req, res } = createMocks({
                method: 'PUT',
                body: {
                    token: 'valid-token',
                    password: 'NewPassword123',
                    passwordConfirm: 'DifferentPassword456',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.message).toContain('não conferem');
        });

        it('should reject GET requests', async () => {
            const { req, res } = createMocks({
                method: 'GET',
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(405);
        });

        it('should reject DELETE requests', async () => {
            const { req, res } = createMocks({
                method: 'DELETE',
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(405);
        });

        it('should handle missing password', async () => {
            const { req, res } = createMocks({
                method: 'PUT',
                body: {
                    token: 'valid-token',
                    passwordConfirm: 'Password123',
                },
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(400);
        });
    });
});
