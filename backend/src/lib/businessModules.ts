/**
 * Résolution des modules actifs d'un business.
 *
 * Source de vérité : `BusinessModuleAssignment` (status = "ACTIVE"),
 * avec repli sur le champ déprécié `Business.modules` (backward-compat
 * pour les business créés avant la migration vers les assignments).
 *
 * À utiliser dans TOUS les services qui font un garde-fou de type
 * `business.modules.includes('XXX')` — le champ déprécié est vide en base
 * pour les business créés via `BusinessModuleAssignment` (seed réaliste).
 */

export interface BusinessModulesShape {
  modules?: string[] | null;
  // status est absent quand le select ramène seulement { module } (déjà filtré par le where)
  moduleAssignments?: { module: string; status?: string }[] | null;
}

export function resolveBusinessModules(business: BusinessModulesShape): string[] {
  const assigned = (business.moduleAssignments || [])
    .filter((a) => (a.status === undefined ? true : a.status === 'ACTIVE'))
    .map((a) => a.module);
  const legacy = Array.isArray(business.modules) ? business.modules : [];
  return Array.from(new Set([...assigned, ...legacy]));
}

export function hasBusinessModule(business: BusinessModulesShape, moduleName: string): boolean {
  return resolveBusinessModules(business).includes(moduleName);
}

/**
 * select Prisma à diffuser dans les requêtes business qui font un garde-fou
 * de module — ramène les assignments ACTIVE à côté du champ déprécié.
 */
export const activeModuleAssignmentsSelect = {
  moduleAssignments: {
    where: { status: 'ACTIVE' },
    select: { module: true },
  },
} as const;
