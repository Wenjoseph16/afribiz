import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

const EMAIL = 'e2e.onboarding@afribiz.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (user) {
    await prisma.business.deleteMany({ where: { ownerId: user.id } });
    console.log(`✓ business existants supprimés pour ${EMAIL}`);
  }
  const passwordHash = await bcrypt.hash('Afribiz@2026!', 12);
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      firstName: 'E2E',
      lastName: 'Onboard',
      passwordHash,
      emailVerified: true,
      isActive: true,
      primaryRole: 'CLIENT',
      roles: ['CLIENT'],
    },
    create: {
      email: EMAIL,
      phone: `+2289${Math.floor(100000000 + Math.random() * 899999999)}`,
      firstName: 'E2E',
      lastName: 'Onboard',
      passwordHash,
      emailVerified: true,
      isActive: true,
      primaryRole: 'CLIENT',
      roles: ['CLIENT'],
      country: 'Togo',
      city: 'Lomé',
      gender: 'M',
    },
  });
  console.log(`✓ utilisateur e2e prêt : ${EMAIL} (rôle CLIENT, sans business)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());