import { prisma } from './db';

// ============================================
// PostgreSQL Full-Text Search Utility
// Uses to_tsvector / plainto_tsquery for fast
// ranked text search with French stemming.
// ============================================

const SEARCH_LANGUAGE = 'french';

const TABLE_NAME_RE = /^[A-Z]\w*$/;
const FIELD_NAME_RE = /^[a-z]\w*$/;

function validateIdentifiers(table: string, fields: string[]): void {
  if (!TABLE_NAME_RE.test(table)) {
    throw new Error(`Invalid table name: "${table}"`);
  }
  for (const f of fields) {
    if (!FIELD_NAME_RE.test(f)) {
      throw new Error(`Invalid field name: "${f}"`);
    }
  }
}

// Build a tsquery condition for one or more columns.
// $1 is always the user query (parameterized).
function buildTsVectorExpr(fields: string[]): string {
  return fields.map(f => `coalesce("${f}", '')`).join(` || ' ' || `);
}

// Search for IDs matching a full-text query on given table + columns.
//
// Accepts either:
//   - `businessId` (UUID, safe) + optional `includeDeleted`
//   - `extraWhere`  (static SQL fragment for callers that need custom conditions)
//
// The user-supplied `query` is ALWAYS parameterized via `$1`.
// Table names and field names are validated against a strict regex.
export async function searchIdsByText(
  table: string,
  fields: string[],
  query: string,
  extraWhere?: string,
  limit?: number,
  businessId?: string,
  includeDeleted?: boolean,
): Promise<string[]>;

export async function searchIdsByText(
  table: string,
  fields: string[],
  query: string,
  extraWhereOrBusinessId?: string,
  limitOrUndefined?: number,
  businessIdOrUndefined?: string,
  includeDeleted?: boolean,
): Promise<string[]> {
  if (!query || query.trim().length === 0) return [];

  validateIdentifiers(table, fields);

  // Detect calling convention
  let extraWhere: string;
  let limit: number;
  let businessId: string | undefined;
  let includeDeletedLocal = false;

  if (businessIdOrUndefined) {
    // (table, fields, query, extraWhere, limit, businessId, includeDeleted)
    extraWhere = extraWhereOrBusinessId ?? 'TRUE';
    limit = limitOrUndefined ?? 200;
    businessId = businessIdOrUndefined;
    includeDeletedLocal = includeDeleted ?? false;
  } else if (limitOrUndefined !== undefined && typeof limitOrUndefined === 'string') {
    // Legacy (table, fields, query, extraWhere, limit) — extraWhere is a string
    // Validate it contains only safe characters
    extraWhere = extraWhereOrBusinessId ?? 'TRUE';
    limit = 200;
    if (!/^[\w\s"'=,()<>!-]+$/.test(extraWhere)) {
      extraWhere = 'TRUE';
    }
  } else {
    // (table, fields, query) or (table, fields, query, limit)
    extraWhere = extraWhereOrBusinessId ?? 'TRUE';
    limit = (limitOrUndefined as number) ?? 200;
  }

  const tsvector = buildTsVectorExpr(fields);
  const tsCondition = `to_tsvector('${SEARCH_LANGUAGE}', ${tsvector}) @@ plainto_tsquery('${SEARCH_LANGUAGE}', $1::text)`;
  let whereClause = tsCondition;

  if (businessId) {
    whereClause += ` AND "businessId" = $2::uuid`;
    if (!includeDeletedLocal) {
      whereClause += ` AND "deletedAt" IS NULL`;
    }
  } else if (extraWhere && extraWhere !== 'TRUE') {
    whereClause += ` AND ${extraWhere}`;
  }

  const rankOrder = `ts_rank(to_tsvector('${SEARCH_LANGUAGE}', ${tsvector}), plainto_tsquery('${SEARCH_LANGUAGE}', $1::text)) DESC`;
  const sql = `SELECT id FROM "${table}" WHERE ${whereClause} ORDER BY ${rankOrder} LIMIT ${limit}`;

  const params = businessId ? [query, businessId] : [query];
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(sql, ...params);

  return rows.map(r => r.id);
}

// Search IDs with pagination
export async function searchIdsByTextPaged(
  table: string,
  fields: string[],
  query: string,
  extraWhere: string = 'TRUE',
  limit: number = 20,
  offset: number = 0,
): Promise<{ ids: string[]; total: number }> {
  if (!query || query.trim().length === 0) return { ids: [], total: 0 };

  validateIdentifiers(table, fields);

  const tsvector = buildTsVectorExpr(fields);
  const tsCondition = `to_tsvector('${SEARCH_LANGUAGE}', ${tsvector}) @@ plainto_tsquery('${SEARCH_LANGUAGE}', $1::text)`;
  let whereClause = tsCondition;

  if (extraWhere && extraWhere !== 'TRUE') {
    whereClause += ` AND ${extraWhere}`;
  }

  const rankOrder = `ts_rank(to_tsvector('${SEARCH_LANGUAGE}', ${tsvector}), plainto_tsquery('${SEARCH_LANGUAGE}', $1::text)) DESC`;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "${table}" WHERE ${whereClause} ORDER BY ${rankOrder} LIMIT ${limit} OFFSET ${offset}`,
      query,
    ),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${table}" WHERE ${whereClause}`,
      query,
    ),
  ]);

  return {
    ids: rows.map(r => r.id),
    total: Number(countResult[0]?.count || 0),
  };
}
