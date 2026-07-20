/**
 * Migration Script: Sync existing Business.modules[] to BusinessModuleAssignment
 *
 * Usage:
 *   npx tsx backend/scripts/migrate-module-assignments.ts          # dry-run (default)
 *   npx tsx backend/scripts/migrate-module-assignments.ts --apply  # apply changes
 *
 * Finds all businesses with old modules[] array data and creates
 * corresponding moduleAssignments records if missing.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isApply = process.argv.includes('--apply');

async function main() {
  console.log(`Mode: ${isApply ? '🔴 APPLY' : '🟡 DRY-RUN'} (use --apply to execute)\n`);

  const businesses = await prisma.business.findMany({
    where: {
      modules: { isEmpty: false },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      modules: true,
    },
  });

  console.log(`Found ${businesses.length} businesses with modules[] data.\n`);

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const business of businesses) {
    const modules = business.modules as string[];
    if (!modules.length) continue;

    const existingAssignments = await prisma.businessModuleAssignment.findMany({
      where: { businessId: business.id },
      select: { module: true },
    });
    const existingModules = new Set(existingAssignments.map((a) => a.module));
    const missing = modules.filter((m) => !existingModules.has(m as any));

    if (missing.length === 0) {
      totalSkipped++;
      continue;
    }

    console.log(
      `📦 ${business.name} (${business.id.slice(0, 8)}...) : ${missing.length} manquant(s) — ${missing.join(', ')}`
    );

    if (isApply) {
      try {
        await prisma.businessModuleAssignment.createMany({
          data: missing.map((mod) => ({
            businessId: business.id,
            module: mod as any,
            status: 'ACTIVE',
            activatedAt: new Date(),
          })),
          skipDuplicates: true,
        });
        totalCreated += missing.length;
        console.log(`   ✅ ${missing.length} assignment(s) créé(s)`);
      } catch (err) {
        totalErrors++;
        console.error(`   ❌ Erreur:`, err);
      }
    }
  }

  console.log('\n=== Résumé ===');
  console.log(`Business avec modules   : ${businesses.length}`);
  console.log(`Déjà synchronisés       : ${totalSkipped}`);
  console.log(`Assignements à créer    : ${isApply ? totalCreated : 'N/A (dry-run)'}`);
  console.log(`Erreurs                 : ${totalErrors}`);

  if (!isApply) {
    console.log('\n💡 Utilisez --apply pour appliquer la migration.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
