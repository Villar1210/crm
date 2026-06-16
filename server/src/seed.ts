import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';


async function main() {
  const email = 'admin@ivilar.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'super_admin',
        team: 'Gestão'
      }
    });
    console.log('✅ Default Admin created: admin@ivilar.com / admin123');
  } else {
    console.log('ℹ️ Admin already exists.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
