// Safe migration script for security fields - run on VPS if prisma db push fails
// Usage: node scripts/migrate-security.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumnIfNotExists(table, column, definition) {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${column} ${definition}`);
        console.log(`✅ Added ${table}.${column}`);
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log(`⏭️  ${table}.${column} already exists`);
        } else {
            console.error(`❌ Error adding ${table}.${column}:`, e.message);
        }
    }
}

async function createTableIfNotExists() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "LoginLog" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "userId" TEXT,
                "email" TEXT NOT NULL,
                "ip" TEXT,
                "userAgent" TEXT,
                "success" BOOLEAN NOT NULL,
                "failReason" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);
        console.log('✅ LoginLog table ready');
    } catch (e) {
        console.error('❌ Error creating LoginLog:', e.message);
    }
}

async function main() {
    console.log('Running security migration...\n');

    // User security fields
    await addColumnIfNotExists('User', 'isActive', 'BOOLEAN NOT NULL DEFAULT 1');
    await addColumnIfNotExists('User', 'mustChangePassword', 'BOOLEAN NOT NULL DEFAULT 0');
    await addColumnIfNotExists('User', 'lastLogin', 'DATETIME');
    await addColumnIfNotExists('User', 'loginAttempts', 'INTEGER NOT NULL DEFAULT 0');
    await addColumnIfNotExists('User', 'lockedUntil', 'DATETIME');
    await addColumnIfNotExists('User', 'twoFactorSecret', 'TEXT');
    await addColumnIfNotExists('User', 'twoFactorEnabled', 'BOOLEAN NOT NULL DEFAULT 0');
    await addColumnIfNotExists('User', 'backupCodes', 'TEXT');

    // LoginLog table
    await createTableIfNotExists();

    console.log('\nMigration complete!');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
