import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    const { name, email, password, role, cpf, cnpj } = req.body;

    // Validation
    if (!name || name.length < 3) {
        return res.status(400).json({ success: false, message: 'Nome deve ter mínimo 3 caracteres' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Senha deve ter mínimo 8 caracteres' });
    }

    if (role === 'CORRETOR' && !cpf) {
        return res.status(400).json({ success: false, message: 'CPF é obrigatório para corretores' });
    }

    if (role === 'IMOBILIARIO' && !cnpj) {
        return res.status(400).json({ success: false, message: 'CNPJ é obrigatório para imobiliárias' });
    }

    try {
        // Check duplicate email
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email já cadastrado' });
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                passwordHash,
                role,
            },
        });

        // Create verification token
        await prisma.verificationToken.create({
            data: {
                email,
                token: Math.random().toString(36).substr(2),
                type: 'EMAIL_VERIFICATION',
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        // Log audit event
        const ip = (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || '';
        await prisma.auditLog.create({
            data: {
                action: 'USER_CREATED',
                ipAddress: ip,
                userAgent,
                userId: user?.id,
            },
        });

        return res.status(201).json({
            success: true,
            data: {
                userId: user?.id,
                email: user?.email,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao registrar usuário' });
    }
}
