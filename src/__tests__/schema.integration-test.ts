/**
 * Runs against a real Twenty instance (CI starts one; locally use
 * `yarn twenty docker:start`). The app is installed by the global setup.
 *
 * These cover the two things unit tests cannot: that the app actually installs,
 * and that the Metadata query this app is built on is valid against a live
 * server. A schema change upstream should fail here, not in a user's browser.
 */

import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { describe, expect, it } from 'vitest';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { isScorableField } from 'src/lib/quality';
import { fetchScorableObjects, scanWorkspace } from 'src/lib/workspace';

describe('App installation', () => {
  it('registers the application', async () => {
    const result = await new MetadataApiClient().query({
      findManyApplications: { id: true, name: true, universalIdentifier: true },
    });

    const app = result.findManyApplications.find(
      (candidate: { universalIdentifier: string }) =>
        candidate.universalIdentifier === APPLICATION_UNIVERSAL_IDENTIFIER,
    );

    expect(app).toBeDefined();
  });
});

describe('Metadata query', () => {
  it('returns objects with their fields', async () => {
    const objects = await fetchScorableObjects(new RestApiClient());

    expect(objects.length).toBeGreaterThan(0);

    const company = objects.find((object) => object.nameSingular === 'company');
    expect(company).toBeDefined();
    expect(company?.fields.length).toBeGreaterThan(0);
  });

  it('exposes the field shape the scoring rules rely on', async () => {
    const objects = await fetchScorableObjects(new RestApiClient());
    const fields = objects.flatMap((object) => object.fields);

    // Every field must carry the keys isScorableField reads, or scoring
    // silently degrades to "everything counts".
    for (const field of fields) {
      expect(typeof field.name).toBe('string');
      expect(typeof field.type).toBe('string');
    }

    // Relations must report a direction — this is what keeps one-to-many
    // collections out of the score.
    const relations = fields.filter((field) => field.type === 'RELATION');
    expect(relations.length).toBeGreaterThan(0);
    expect(relations.some((field) => field.relation?.type === 'MANY_TO_ONE')).toBe(true);
    expect(relations.some((field) => field.relation?.type === 'ONE_TO_MANY')).toBe(true);
    expect(relations.filter(isScorableField).length).toBeLessThan(relations.length);
  });

  it('never scores system fields', async () => {
    const objects = await fetchScorableObjects(new RestApiClient());
    const scorable = objects.flatMap((object) => object.fields.filter(isScorableField));

    expect(scorable.some((field) => field.name === 'id')).toBe(false);
    expect(scorable.some((field) => field.name === 'createdAt')).toBe(false);
    expect(scorable.some((field) => field.name === 'position')).toBe(false);
  });
});

describe('scanWorkspace', () => {
  it('produces a score for a freshly seeded workspace without throwing', async () => {
    const scores = await scanWorkspace(new RestApiClient());

    // A brand-new instance may hold no records at all, so the only invariant
    // that always holds is the shape of the result.
    for (const object of scores) {
      expect(object.recordCount).toBeGreaterThan(0);
      expect(object.ratio).toBeGreaterThanOrEqual(0);
      expect(object.ratio).toBeLessThanOrEqual(1);
      for (const field of object.fields) {
        expect(field.filled).toBeLessThanOrEqual(field.total);
      }
    }

    // Worst first.
    const ratios = scores.map((object) => object.ratio);
    expect([...ratios].sort((a, b) => a - b)).toEqual(ratios);
  });
});
