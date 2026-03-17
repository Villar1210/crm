import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type JobType = 'whatsapp_send' | 'email_send' | 'social_publish';

export class JobQueue {
    // Add a job to the queue
    static async add(type: JobType, payload: any, scheduledFor?: Date) {
        return prisma.jobQueue.create({
            data: {
                type,
                payload: JSON.stringify(payload),
                status: 'pending',
                scheduledFor: scheduledFor || new Date(),
            },
        });
    }

    // Process pending jobs
    static async process(handler: (job: any) => Promise<void>) {
        // Find one pending job
        const job = await prisma.jobQueue.findFirst({
            where: {
                status: 'pending',
                scheduledFor: { lte: new Date() },
            },
            orderBy: { createdAt: 'asc' },
        });

        if (!job) return;

        try {
            // Mark as processing
            await prisma.jobQueue.update({
                where: { id: job.id },
                data: { status: 'processing' },
            });

            // Execute handler
            await handler({ ...job, payload: JSON.parse(job.payload) });

            // Mark as completed
            await prisma.jobQueue.update({
                where: { id: job.id },
                data: { status: 'completed', processedAt: new Date() },
            });
        } catch (error: any) {
            console.error(`Job ${job.id} failed:`, error);
            // Mark as failed and increment attempts
            await prisma.jobQueue.update({
                where: { id: job.id },
                data: {
                    status: 'failed',
                    lastError: error.message,
                    attempts: { increment: 1 },
                },
            });
        }
    }
}
