/**
 * Reading the workspace: the one place that talks to Twenty.
 *
 * Kept apart from `quality.ts` (pure scoring) so the scoring rules stay
 * testable without a server, and apart from the component so the query this
 * app depends on can be verified against a real instance in integration tests.
 */

import type { RestApiClient } from 'twenty-client-sdk/rest';

import { scoreObject, type FieldMeta, type ObjectMeta, type ObjectScore } from 'src/lib/quality';

/** Objects that describe the workspace itself rather than the data in it. */
export const NON_DATA_OBJECTS = new Set(['dashboard', 'workflow']);

/** Records read per object. Beyond this the score is a sample, not a census. */
export const RECORD_PAGE_SIZE = 200;

export const METADATA_QUERY = `{
  objects(paging: { first: 200 }) {
    edges {
      node {
        nameSingular
        namePlural
        labelSingular
        labelPlural
        isSystem
        isActive
        fields(paging: { first: 200 }) {
          edges { node { name label type isSystem isActive isNullable relation { type } } }
        }
      }
    }
  }
}`;

type MetadataResponse = {
  data?: {
    objects?: {
      edges: {
        node: Omit<ObjectMeta, 'fields'> & { fields: { edges: { node: FieldMeta }[] } };
      }[];
    };
  };
  errors?: { message: string }[];
};

/** Every object worth scoring, with its fields flattened out of the GraphQL edges. */
export const fetchScorableObjects = async (client: RestApiClient): Promise<ObjectMeta[]> => {
  const response = await client.request<MetadataResponse>('POST', '/metadata', {
    body: { query: METADATA_QUERY },
  });

  if (response.errors?.length) {
    throw new Error(response.errors.map((e) => e.message).join('; '));
  }

  return (response.data?.objects?.edges ?? [])
    .map(({ node }) => ({ ...node, fields: node.fields.edges.map((edge) => edge.node) }))
    .filter(
      (object) =>
        object.isActive !== false &&
        object.isSystem !== true &&
        !NON_DATA_OBJECTS.has(object.nameSingular),
    );
};

export const fetchRecords = async (
  client: RestApiClient,
  namePlural: string,
): Promise<Record<string, unknown>[]> => {
  const response = await client.get<{ data?: Record<string, unknown> }>(`/rest/${namePlural}`, {
    query: { limit: RECORD_PAGE_SIZE },
  });
  return (response.data?.[namePlural] ?? []) as Record<string, unknown>[];
};

/**
 * Scores every object, worst first. Objects the current role cannot read are
 * skipped rather than failing the whole scan, and empty objects are dropped so
 * they do not pad the list with meaningless 100% rows.
 */
export const scanWorkspace = async (client: RestApiClient): Promise<ObjectScore[]> => {
  const objects = await fetchScorableObjects(client);

  const results = await Promise.all(
    objects.map(async (object) => {
      try {
        return scoreObject(object, await fetchRecords(client, object.namePlural));
      } catch {
        return null;
      }
    }),
  );

  return results
    .filter((result): result is ObjectScore => result !== null)
    .filter((result) => result.recordCount > 0)
    .sort((a, b) => a.ratio - b.ratio);
};
