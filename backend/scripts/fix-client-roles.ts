import { PrismaClient } from '@prisma/client';





const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'client@afribiz.com' },
  });

  if (!user) {
    console.log('User client@afribiz.com not found');
    return;
  }

  console.log('Before update:');
  console.log('  primaryRole:', user.primaryRole);
  console.log('  roles:', user.roles);

  if (user.primaryRole === 'CLIENT' && user.roles.length === 1 && user.roles[0] === 'CLIENT') {
    console.log('✅ Roles already correct, no update needed');
    return;
  }

  await prisma.user.update({
    where: { email: 'client@afribiz.com' },
    data: {
      primaryRole: 'CLIENT',
      roles: ['CLIENT'],
    },
  });

  const updated = await prisma.user.findUnique({
    where: { email: 'client@afribiz.com' },
  });

  console.log('After update:');
  console.log('  primaryRole:', updated?.primaryRole);
  console.log('  roles:', updated?.roles);
  console.log('✅ Fix complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
