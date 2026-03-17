
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const emailsToDelete = [
        'eduardo@novamorada.com.br',
        'cliente@email.com',
        'camila@ivillar.com.br', // Checking if this exists too based on mock data
        'roberto@email.com' // Checking roberto
    ];

    console.log('Finding mock users...');
    const users = await prisma.user.findMany({
        where: { email: { in: emailsToDelete } }
    });

    for (const user of users) {
        console.log(`Deleting leads/tasks for user: ${user.name} (${user.email})`);

        // Disconnect or delete leads assigned to them?
        // We'll delete leads created by them or assigned to them to fully clean up statistics
        await prisma.lead.deleteMany({
            where: { assignedTo: user.id }
        });

        await prisma.task.deleteMany({
            where: { userId: user.id }
        });

        console.log(`Deleting user: ${user.name}`);
        await prisma.user.delete({
            where: { id: user.id }
        });
    }

    console.log('Cleanup finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
