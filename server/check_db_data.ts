
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Users...');
    const users = await prisma.user.findMany();
    console.log('Users found:', users.map(u => ({ name: u.name, email: u.email, role: u.role })));

    console.log('Checking Leads count...');
    const count = await prisma.lead.count();
    console.log('Total Leads:', count);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
