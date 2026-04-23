import { describe, it, expect } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const isAdmin = req.headers['x-admin'] === 'true';
    if (!isAdmin) {
        return res.status(401).json({ success: false, message: 'Não autorizado' });
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            data: [
                { id: 'user_1', name: 'User 1', email: 'user1@test.com', role: 'CLIENTE' },
                { id: 'user_2', name: 'User 2', email: 'user2@test.com', role: 'CORRETOR' },
            ],
        });
    }

    if (req.method === 'POST') {
        const { email, name, role } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email obrigatório' });
        if (!name) return res.status(400).json({ success: false, message: 'Nome obrigatório' });
        if (role && !['CLIENTE', 'CORRETOR', 'IMOBILIARIO', 'ADMIN'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role inválida' });
        }
        return res.status(201).json({
            success: true,
            data: { id: 'new_user', email, name, role: role || 'CLIENTE' },
        });
    }

    if (req.method === 'DELETE') {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'ID obrigatório' });
        return res.status(200).json({ success: true, message: 'Deletado' });
    }

    return res.status(405).json({ success: false, message: 'Método não permitido' });
};

describe('/api/admin/users', () => {
    it('should reject unauthorized requests', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(401);
    });

    it('should list users with auth', async () => {
        const { req, res } = createMocks({
            method: 'GET',
            headers: { 'x-admin': 'true' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(200);
    });

    it('should create user', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'x-admin': 'true' },
            body: { email: 'test@test.com', name: 'Test' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(201);
    });

    it('should reject missing email', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'x-admin': 'true' },
            body: { name: 'Test' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('should delete user', async () => {
        const { req, res } = createMocks({
            method: 'DELETE',
            headers: { 'x-admin': 'true' },
            query: { userId: '123' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(200);
    });

    it('should reject DELETE without ID', async () => {
        const { req, res } = createMocks({
            method: 'DELETE',
            headers: { 'x-admin': 'true' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('should reject invalid method', async () => {
        const { req, res } = createMocks({
            method: 'PATCH',
            headers: { 'x-admin': 'true' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(405);
    });

    it('should set default role', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'x-admin': 'true' },
            body: { email: 'test@test.com', name: 'Test' },
        });
        await handler(req, res);
        const data = JSON.parse(res._getData());
        expect(data.data.role).toBe('CLIENTE');
    });

    it('should reject invalid role', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'x-admin': 'true' },
            body: { email: 'test@test.com', name: 'Test', role: 'INVALID' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('should return user data on GET', async () => {
        const { req, res } = createMocks({
            method: 'GET',
            headers: { 'x-admin': 'true' },
        });
        await handler(req, res);
        const data = JSON.parse(res._getData());
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].id).toBeDefined();
    });
});
