
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function restore() {
    const email = 'admin@admin.com';
    const password = '1998';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            console.log('Usuario ja existe. Atualizando senha e permissao...');
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword, role: 'super_admin' }
            });
        } else {
            console.log('Criando usuario admin@admin.com...');
            await prisma.user.create({
                data: {
                    name: 'Admin Restaurado',
                    email,
                    password: hashedPassword,
                    role: 'super_admin',
                    team: 'Gestão'
                }
            });
        }
        console.log('✅ Sucesso! Pode logar com admin@admin.com / 1998');
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
