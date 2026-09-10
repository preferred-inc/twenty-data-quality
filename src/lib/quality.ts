/**
 * Completeness scoring — pure functions, no I/O.
 *
 * The rules here encode two things that are easy to get wrong when you score a
 * Twenty workspace: which fields it is fair to score at all, and what "empty"
 * means for a composite field type.
 */

export type FieldMeta = {
  name: string;
  label: string;
  type: string;
  isSystem?: boolean | null;
  isNullable?: boolean | null;
  isActive?: boolean | null;
  relation?: { type?: string | null } | null;
};

export type ObjectMeta = {
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  isSystem?: boolean | null;
  isActive?: boolean | null;
  fields: FieldMeta[];
};

export type FieldScore = {
  name: string;
  label: string;
  type: string;
  filled: number;
  total: number;
  /** 0–1. `total === 0` scores as 1 so an empty object does not drag the average down. */
  ratio: number;
};

export type ObjectScore = {
  nameSingular: string;
  namePlural: string;
  label: string;
  recordCount: number;
  fields: FieldScore[];
  ratio: number;
};

/**
 * Field types that carry no user intent, so scoring them says nothing about
 * data quality. BOOLEAN is here on purpose: `false` is a real answer, and there
 * is no way to tell it apart from "never set".
 */
const UNSCORABLE_TYPES = new Set([
  'UUID',
  'POSITION',
  'TS_VECTOR',
  'ACTOR',
  'BOOLEAN',
  'RAW_JSON',
]);

/** Names Twenty manages itself. `name` is excluded because it is effectively required. */
const UNSCORABLE_NAMES = new Set([
  'id',
  'name',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'position',
  'searchVector',
  'createdBy',
  'updatedBy',
]);

/**
 * A field is worth scoring when a human could reasonably be expected to fill
 * it in. One-to-many relations are excluded — a company with no notes is not a
 * data quality problem, it is just a company with no notes.
 */
export const isScorableField = (field: FieldMeta): boolean => {
  if (field.isSystem === true) return false;
  if (field.isActive === false) return false;
  if (UNSCORABLE_NAMES.has(field.name)) return false;
  if (UNSCORABLE_TYPES.has(field.type)) return false;
  if (field.type === 'RELATION') {
    // Only score the "many-to-one" side, which materialises as a single id.
    return field.relation?.type === 'MANY_TO_ONE';
  }
  return true;
};

const hasMeaningfulEntry = (value: Record<string, unknown>): boolean =>
  Object.values(value).some((inner) => {
    if (inner === null || inner === undefined) return false;
    if (typeof inner === 'string') return inner.trim() !== '';
    if (Array.isArray(inner)) return inner.length > 0;
    if (typeof inner === 'object') return hasMeaningfulEntry(inner as Record<string, unknown>);
    return true;
  });

/**
 * Whether a stored value counts as "not filled in".
 *
 * Twenty's composite types (CURRENCY, LINKS, EMAILS, PHONES, ADDRESS,
 * FULL_NAME, RICH_TEXT_V2 …) are returned as objects whose sub-fields are
 * present but null — so a plain null check reports them as filled when they are
 * not. This walks into them instead.
 */
export const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return false;
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return !hasMeaningfulEntry(value as Record<string, unknown>);
  return false;
};

export const scoreObject = (
  object: ObjectMeta,
  records: Record<string, unknown>[],
): ObjectScore => {
  const scorable = object.fields.filter(isScorableField);
  const total = records.length;

  const fields: FieldScore[] = scorable.map((field) => {
    const key = field.type === 'RELATION' ? `${field.name}Id` : field.name;
    const filled = records.filter((record) => {
      const value = key in record ? record[key] : record[field.name];
      return !isEmptyValue(value);
    }).length;
    return {
      name: field.name,
      label: field.label,
      type: field.type,
      filled,
      total,
      ratio: total === 0 ? 1 : filled / total,
    };
  });

  const ratio =
    fields.length === 0 ? 1 : fields.reduce((sum, f) => sum + f.ratio, 0) / fields.length;

  return {
    nameSingular: object.nameSingular,
    namePlural: object.namePlural,
    label: object.labelPlural,
    recordCount: total,
    fields: fields.sort((a, b) => a.ratio - b.ratio),
    ratio,
  };
};

/**
 * Weighted by how many values each object actually contributes, so an object
 * with three records cannot swing the workspace score as hard as one with 500.
 */
export const scoreWorkspace = (objects: ObjectScore[]): number => {
  let filled = 0;
  let total = 0;
  for (const object of objects) {
    for (const field of object.fields) {
      filled += field.filled;
      total += field.total;
    }
  }
  return total === 0 ? 1 : filled / total;
};

export type Grade = 'good' | 'warn' | 'bad';

export const gradeOf = (ratio: number): Grade =>
  ratio >= 0.8 ? 'good' : ratio >= 0.5 ? 'warn' : 'bad';

export const formatPercent = (ratio: number): string => `${Math.round(ratio * 100)}%`;
