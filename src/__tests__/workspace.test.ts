import { describe, expect, it, vi } from 'vitest';
import type { RestApiClient } from 'twenty-client-sdk/rest';

import {
  RECORD_PAGE_SIZE,
  fetchRecords,
  fetchScorableObjects,
  scanWorkspace,
} from 'src/lib/workspace';

// The integration tests prove the query shape against a real server. These
// cover what happens to the response afterwards — filtering, the skip-on-error
// rule and ordering — without needing one.

type Node = {
  nameSingular: string;
  namePlural: string;
  isSystem?: boolean;
  isActive?: boolean;
  fields?: { name: string; type: string; isSystem?: boolean }[];
};

const metadata = (nodes: Node[]) => ({
  data: {
    objects: {
      edges: nodes.map((n) => ({
        node: {
          labelSingular: n.nameSingular,
          labelPlural: n.namePlural,
          ...n,
          fields: {
            edges: (n.fields ?? [{ name: 'city', type: 'TEXT' }]).map((f) => ({
              node: { label: f.name, ...f },
            })),
          },
        },
      })),
    },
  },
});

const fakeClient = (opts: {
  metadata: unknown;
  records?: Record<string, Record<string, unknown>[] | Error>;
}) => {
  const request = vi.fn(async () => opts.metadata);
  const get = vi.fn(async (path: string) => {
    const plural = path.replace('/rest/', '');
    const rows = opts.records?.[plural] ?? [];
    if (rows instanceof Error) throw rows;
    return { data: { [plural]: rows } };
  });
  return { client: { request, get } as unknown as RestApiClient, request, get };
};

describe('fetchScorableObjects', () => {
  it('drops inactive, system and workspace-describing objects, and flattens fields', async () => {
    const { client, request } = fakeClient({
      metadata: metadata([
        { nameSingular: 'company', namePlural: 'companies' },
        { nameSingular: 'archived', namePlural: 'archiveds', isActive: false },
        { nameSingular: 'workspaceMember', namePlural: 'workspaceMembers', isSystem: true },
        { nameSingular: 'dashboard', namePlural: 'dashboards' },
        { nameSingular: 'workflow', namePlural: 'workflows' },
      ]),
    });

    const objects = await fetchScorableObjects(client);

    expect(objects.map((o) => o.nameSingular)).toEqual(['company']);
    expect(objects[0].fields).toEqual([{ name: 'city', label: 'city', type: 'TEXT' }]);
    expect(request).toHaveBeenCalledWith('POST', '/metadata', expect.anything());
  });

  it('surfaces GraphQL errors instead of returning an empty list', async () => {
    const { client } = fakeClient({ metadata: { errors: [{ message: 'a' }, { message: 'b' }] } });
    await expect(fetchScorableObjects(client)).rejects.toThrow('a; b');
  });

  it('returns nothing for a response without data', async () => {
    const { client } = fakeClient({ metadata: {} });
    expect(await fetchScorableObjects(client)).toEqual([]);
  });
});

describe('fetchRecords', () => {
  it('reads one page per object and tolerates a missing key', async () => {
    const { client, get } = fakeClient({ metadata: {}, records: { people: [{ id: '1' }] } });

    expect(await fetchRecords(client, 'people')).toEqual([{ id: '1' }]);
    expect(get).toHaveBeenCalledWith('/rest/people', { query: { limit: RECORD_PAGE_SIZE } });
    expect(await fetchRecords(client, 'unknowns')).toEqual([]);
  });
});

describe('scanWorkspace', () => {
  it('skips unreadable and empty objects and puts the worst first', async () => {
    const { client } = fakeClient({
      metadata: metadata([
        { nameSingular: 'company', namePlural: 'companies' },
        { nameSingular: 'person', namePlural: 'people' },
        { nameSingular: 'secret', namePlural: 'secrets' },
        { nameSingular: 'note', namePlural: 'notes' },
      ]),
      records: {
        companies: [{ city: 'A' }, { city: 'B' }], // 100%
        people: [{ city: 'C' }, { city: null }], // 50%
        secrets: new Error('403 Forbidden'), // role cannot read it
        notes: [], // nothing to score
      },
    });

    const scores = await scanWorkspace(client);

    expect(scores.map((s) => [s.nameSingular, s.ratio])).toEqual([
      ['person', 0.5],
      ['company', 1],
    ]);
  });
});
