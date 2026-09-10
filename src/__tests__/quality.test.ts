import { describe, expect, it } from 'vitest';

import {
  formatPercent,
  gradeOf,
  isEmptyValue,
  isScorableField,
  scoreObject,
  scoreWorkspace,
  type FieldMeta,
  type ObjectMeta,
} from 'src/lib/quality';

const field = (over: Partial<FieldMeta> & Pick<FieldMeta, 'name' | 'type'>): FieldMeta => ({
  label: over.name,
  ...over,
});

describe('isEmptyValue', () => {
  it('treats null and undefined as empty', () => {
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
  });

  it('treats whitespace-only strings as empty', () => {
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue('   ')).toBe(true);
    expect(isEmptyValue('a')).toBe(false);
  });

  it('keeps zero and false as filled values', () => {
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
  });

  it('walks into composite fields whose sub-fields are all null', () => {
    // This is the case a plain null check gets wrong.
    expect(isEmptyValue({ amountMicros: null, currencyCode: null })).toBe(true);
    expect(isEmptyValue({ primaryLinkUrl: null, secondaryLinks: [] })).toBe(true);
    expect(isEmptyValue({ primaryEmail: '', additionalEmails: null })).toBe(true);
    expect(isEmptyValue({ firstName: '', lastName: '' })).toBe(true);
    expect(
      isEmptyValue({
        addressStreet1: '',
        addressCity: '',
        addressCountry: null,
      }),
    ).toBe(true);
  });

  it('counts a composite field as filled when any sub-field carries a value', () => {
    expect(isEmptyValue({ amountMicros: 1_000_000, currencyCode: 'JPY' })).toBe(false);
    expect(isEmptyValue({ primaryLinkUrl: 'https://example.com' })).toBe(false);
    expect(isEmptyValue({ firstName: '', lastName: 'Kaino' })).toBe(false);
  });

  it('treats empty arrays as empty', () => {
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue(['A'])).toBe(false);
  });
});

describe('isScorableField', () => {
  it('skips system-managed fields', () => {
    expect(isScorableField(field({ name: 'createdAt', type: 'DATE_TIME' }))).toBe(false);
    expect(isScorableField(field({ name: 'position', type: 'POSITION' }))).toBe(false);
    expect(isScorableField(field({ name: 'custom', type: 'TEXT', isSystem: true }))).toBe(false);
  });

  it('skips booleans, because false is indistinguishable from unset', () => {
    expect(isScorableField(field({ name: 'isStalled', type: 'BOOLEAN' }))).toBe(false);
  });

  it('scores only the many-to-one side of a relation', () => {
    expect(
      isScorableField(
        field({
          name: 'company',
          type: 'RELATION',
          relation: { type: 'MANY_TO_ONE' },
        }),
      ),
    ).toBe(true);
    expect(
      isScorableField(
        field({
          name: 'notes',
          type: 'RELATION',
          relation: { type: 'ONE_TO_MANY' },
        }),
      ),
    ).toBe(false);
  });

  it('scores ordinary user-facing fields', () => {
    expect(isScorableField(field({ name: 'jobTitle', type: 'TEXT' }))).toBe(true);
    expect(isScorableField(field({ name: 'closeDate', type: 'DATE_TIME' }))).toBe(true);
  });
});

const object: ObjectMeta = {
  nameSingular: 'opportunity',
  namePlural: 'opportunities',
  labelSingular: 'Opportunity',
  labelPlural: 'Opportunities',
  fields: [
    field({ name: 'closeDate', type: 'DATE_TIME' }),
    field({ name: 'amount', type: 'CURRENCY' }),
    field({ name: 'company', type: 'RELATION', relation: { type: 'MANY_TO_ONE' } }),
    field({ name: 'id', type: 'UUID' }),
  ],
};

describe('scoreObject', () => {
  it('resolves a many-to-one relation through its <name>Id key', () => {
    const result = scoreObject(object, [
      { closeDate: '2026-01-01', amount: { amountMicros: 1 }, companyId: 'abc' },
      { closeDate: null, amount: { amountMicros: null }, companyId: null },
    ]);

    const byName = Object.fromEntries(result.fields.map((f) => [f.name, f]));
    expect(byName.company.filled).toBe(1);
    expect(byName.closeDate.filled).toBe(1);
    expect(byName.amount.filled).toBe(1);
    expect(result.fields.some((f) => f.name === 'id')).toBe(false);
    expect(result.ratio).toBeCloseTo(0.5);
  });

  it('sorts the worst fields first', () => {
    const result = scoreObject(object, [
      { closeDate: '2026-01-01', amount: null, companyId: 'abc' },
      { closeDate: '2026-01-02', amount: null, companyId: 'def' },
    ]);
    expect(result.fields[0].name).toBe('amount');
  });

  it('does not penalise an object with no records', () => {
    expect(scoreObject(object, []).ratio).toBe(1);
  });
});

describe('scoreWorkspace', () => {
  it('weights objects by how many values they contribute', () => {
    const big = scoreObject(object, Array.from({ length: 100 }, () => ({ closeDate: '2026-01-01' })));
    const small = scoreObject(object, [{ closeDate: null, amount: null, companyId: null }]);

    // The small, entirely-empty object must not halve the workspace score.
    expect(scoreWorkspace([big, small])).toBeGreaterThan(0.3);
    expect(scoreWorkspace([big, small])).toBeLessThan(0.4);
  });

  it('returns 1 for an empty workspace', () => {
    expect(scoreWorkspace([])).toBe(1);
  });
});

describe('gradeOf / formatPercent', () => {
  it('grades on the 80/50 thresholds', () => {
    expect(gradeOf(0.95)).toBe('good');
    expect(gradeOf(0.8)).toBe('good');
    expect(gradeOf(0.6)).toBe('warn');
    expect(gradeOf(0.49)).toBe('bad');
  });

  it('rounds percentages', () => {
    expect(formatPercent(0.666)).toBe('67%');
    expect(formatPercent(1)).toBe('100%');
  });
});
