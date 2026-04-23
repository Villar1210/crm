/**
 * Prisma Client Mock for Testing
 */

export const prisma = {
    user: {
        findUnique: async () => null,
        create: async (data: any) => ({ id: 'user_123', ...data.data }),
    },
    verificationToken: {
        create: async (data: any) => data.data,
    },
    auditLog: {
        create: async (data: any) => data.data,
    },
};
