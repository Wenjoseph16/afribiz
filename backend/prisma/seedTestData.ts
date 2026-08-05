/**
 * ============================================================
 * SEED TEST — DÉPRÉCIÉ (délégué au seed réaliste)
 * ============================================================
 * L'ancien seedTestData créait des comptes .test (Test1234!) avec des
 * IDs déterministes qui entraient en conflit avec le seed réaliste
 * (orderNumber CMD-2026-001 etc.) et polluaient la base de données.
 *
 * Depuis le passage au seed réaliste (seedRealistic.ts), `db:seed:test`
 * délègue simplement au seed réaliste : 16 comptes @afribiz.com,
 * 6 business VERIFIED, commandes/réservations/avis liés, zéro fiction.
 *
 * Utilisez `npm run db:seed` (ou `npm run db:seed:test` pour compatibilité)
 * — les deux produisent le même résultat cohérent et idempotent.
 * ============================================================
 */
import { seedRealistic, PASSWORD } from './seedRealistic';

export async function seedTestData() {
  await seedRealistic();
  return PASSWORD;
}

if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('✅ db:seed:test délégué au seed réaliste. Mdp unique : ' + PASSWORD);
      process.exit(0);
    })
    .catch((e) => {
      console.error('❌ Seed échoué:', e?.message || e);
      process.exit(1);
    });
}
