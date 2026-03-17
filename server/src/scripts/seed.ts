import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
        {
            name: 'Admin User',
            email: 'admin@novamorada.com.br',
            password: hashedPassword,
            role: 'admin',
        },
        {
            name: 'Eduardo Corretor',
            email: 'eduardo@novamorada.com.br',
            password: hashedPassword,
            role: 'agent',
        },
        {
            name: 'Cliente Exemplo',
            email: 'cliente@email.com',
            password: hashedPassword,
            role: 'buyer',
        }
    ];

    for (const u of users) {
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
            await prisma.user.create({ data: u });
            console.log(`Created user: ${u.email}`);
        } else {
            console.log(`User already exists: ${u.email}`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
