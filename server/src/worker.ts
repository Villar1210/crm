import { JobQueue } from './services/queue';
import { socialPublishService } from './services/socialPublishService';
import { prisma } from './lib/prisma';

// Job Worker Loop
const WORKER_INTERVAL = 5000; // Check every 5 seconds

console.log('👷 Job Worker started...');

setInterval(async () => {
    await JobQueue.process(async (job) => {
        console.log(`Processing job: ${job.type} (${job.id})`);

        if (job.type === 'whatsapp_send') {
            // Simulate sending WhatsApp
            const { to, message } = job.payload;
            console.log(`[WhatsApp] Sending to ${to}: "${message}"`);
            // TODO: Call actual WhatsApp API logic here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate networking
        }

        if (job.type === 'social_publish') {
            const { postId } = job.payload;
            if (!postId) {
                throw new Error('Missing postId for social publish');
            }
            await socialPublishService.publishPost(postId);
        }

        // Add other job types here
    });
}, WORKER_INTERVAL);

// Task Reminder Check (Every minute)
const REMINDER_INTERVAL = 60000;
setInterval(async () => {
    try {
        // Find tasks due in next 15 mins that are not completed
        const now = new Date();
        const fifteenMins = new Date(now.getTime() + 15 * 60000);

        const tasks = await prisma.task.findMany({
            where: {
                completed: false,
                dueDate: {
                    gte: now,
                    lte: fifteenMins
                }
            },
            include: { user: true, lead: true }
        });

        for (const task of tasks) {
            console.log(`[REMINDER] Task "${task.title}" due at ${task.dueDate.toLocaleTimeString()}`);
            // Logic to prevent duplicate alerts (e.g., check Redis or a 'notified' flag)
            // For now just log
        }
    } catch (e) {
        console.error('Reminder check failed', e);
    }
}, REMINDER_INTERVAL);

// Marcar faturas de aluguel vencidas (a cada hora)
const OVERDUE_CHECK_INTERVAL = 60 * 60 * 1000;
setInterval(async () => {
    try {
        const result = await prisma.realEstateInvoice.updateMany({
            where: {
                status: { in: ['generated', 'sent'] },
                dueDate: { lt: new Date() },
            },
            data: { status: 'overdue' },
        });
        if (result.count > 0) {
            console.log(`[Cron] ${result.count} faturas marcadas como vencidas`);
        }
    } catch (e) {
        console.error('Overdue invoice check failed', e);
    }
}, OVERDUE_CHECK_INTERVAL);
