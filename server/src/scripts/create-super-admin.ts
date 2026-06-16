import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';


async function main() {
    const email = process.env.ADMIN_EMAIL || 'admin@ivillar.com.br';
    const password = process.env.ADMIN_PASSWORD || 'Ivillar@2026';
    const name = process.env.ADMIN_NAME || 'Daniel Villar';

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashed,
            role: 'super_admin',
            name
        },
        create: {
            name,
            email,
            password: hashed,
            role: 'super_admin'
        }
    });

    console.log('✅ Super admin criado/atualizado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome:  ${user.name}`);
    console.log(`   Role:  ${user.role}`);
    console.log(`   Senha: ${password}`);
}

main()
    .catch(e => { console.error('❌ Erro:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
