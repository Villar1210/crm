const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCol(table, col, def) {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${col} ${def}`);
        console.log(`OK ${table}.${col}`);
    } catch(e) {
        const m = e.message || '';
        if (m.includes('duplicate') || m.includes('already')) console.log(`SKIP ${table}.${col}`);
        else console.log(`WARN ${table}.${col}: ${m}`);
    }
}

async function main() {
    await addCol('User','isActive','BOOLEAN NOT NULL DEFAULT 1');
    await addCol('User','mustChangePassword','BOOLEAN NOT NULL DEFAULT 0');
    await addCol('User','lastLogin','DATETIME');
    await addCol('User','loginAttempts','INTEGER NOT NULL DEFAULT 0');
    await addCol('User','lockedUntil','DATETIME');
    await addCol('User','twoFactorSecret','TEXT');
    await addCol('User','twoFactorEnabled','BOOLEAN NOT NULL DEFAULT 0');
    await addCol('User','backupCodes','TEXT');
    try {
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "LoginLog" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT,"email" TEXT NOT NULL,"ip" TEXT,"userAgent" TEXT,"success" BOOLEAN NOT NULL,"failReason" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
        console.log('OK LoginLog');
    } catch(e) { console.log('WARN LoginLog: ' + e.message); }
    await prisma.$disconnect();
    console.log('Migration complete!');
}
main().catch(e => { console.error(e); process.exit(1); });
