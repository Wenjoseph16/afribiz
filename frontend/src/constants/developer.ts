/**
 * Catalogues curatés pour l'onboarding développeur.
 * La sélection dans ces listes garantit des données normalisées
 * (fini le bazar "react / React.js / REACTJS").
 */

export type MasteryLevel = 'JUNIOR' | 'CONFIRME' | 'SENIOR_EXPERT' | 'ARCHITECTE';

export const MASTERY_LEVELS: {
  value: MasteryLevel;
  label: string;
  hint: string;
  color: string;
}[] = [
  {
    value: 'JUNIOR',
    label: 'Junior',
    hint: '< 2 ans · projets encadrés',
    color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  {
    value: 'CONFIRME',
    label: 'Confirmé',
    hint: '2-5 ans · autonomie complète',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  {
    value: 'SENIOR_EXPERT',
    label: 'Senior / Expert',
    hint: '5-10 ans · référence technique',
    color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  {
    value: 'ARCHITECTE',
    label: 'Architecte',
    hint: '10+ ans · vision système',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
];

export const MASTERY_LABELS: Record<MasteryLevel, string> = Object.fromEntries(
  MASTERY_LEVELS.map((l) => [l.value, l.label])
) as Record<MasteryLevel, string>;

export interface TechCatalogEntry {
  name: string;
  category: string;
}

export const TECH_CATALOG: TechCatalogEntry[] = [
  // Frontend
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Nuxt', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'HTML/CSS', category: 'Frontend' },
  // Backend
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'PHP', category: 'Backend' },
  { name: 'Laravel', category: 'Backend' },
  { name: 'Java / Spring', category: 'Backend' },
  { name: 'Go', category: 'Backend' },
  { name: 'Ruby on Rails', category: 'Backend' },
  // Mobile
  { name: 'React Native', category: 'Mobile' },
  { name: 'Flutter', category: 'Mobile' },
  { name: 'Kotlin', category: 'Mobile' },
  { name: 'Swift', category: 'Mobile' },
  // Data
  { name: 'PostgreSQL', category: 'Data' },
  { name: 'MySQL', category: 'Data' },
  { name: 'MongoDB', category: 'Data' },
  { name: 'Redis', category: 'Data' },
  { name: 'Prisma', category: 'Data' },
  { name: 'GraphQL', category: 'Data' },
  // DevOps & Cloud
  { name: 'Docker', category: 'DevOps & Cloud' },
  { name: 'Kubernetes', category: 'DevOps & Cloud' },
  { name: 'AWS', category: 'DevOps & Cloud' },
  { name: 'Vercel', category: 'DevOps & Cloud' },
  { name: 'CI/CD (GitHub Actions)', category: 'DevOps & Cloud' },
  { name: 'Linux / Bash', category: 'DevOps & Cloud' },
  // Afrique & spécifique
  { name: 'Intégration Mobile Money', category: 'Afrique & Paiements' },
  { name: 'USSD / SMS', category: 'Afrique & Paiements' },
  { name: 'WhatsApp Business API', category: 'Afrique & Paiements' },
  { name: 'WordPress', category: 'Afrique & Paiements' },
];

export const TECH_CATEGORIES = [...new Set(TECH_CATALOG.map((t) => t.category))];

export const DOMAIN_CATALOG: string[] = [
  'SaaS B2B',
  'FinTech / Paiement',
  'E-commerce',
  'IA & LLM',
  'DevOps & Cloud',
  'Mobile',
  'Santé',
  'Éducation / EdTech',
  'AgriTech',
  'Logistique',
  'Immobilier',
  'Événementiel',
];
