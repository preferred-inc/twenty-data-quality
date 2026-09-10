import { defineFrontComponent } from 'twenty-sdk/define';
import { useEffect, useMemo, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { DATA_QUALITY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  SectionTitle,
  StatCard,
  StateMessage,
  Tag,
  TableCell,
  TableHeader,
  TableRow,
  WidgetFrame,
  WidgetHeader,
  type Column,
} from 'src/ui/components';
import { BORDER, COLOR, FONT, RADIUS, space, type ThemeColor } from 'src/ui/theme';
import {
  formatPercent,
  gradeOf,
  scoreObject,
  scoreWorkspace,
  type FieldMeta,
  type Grade,
  type ObjectMeta,
  type ObjectScore,
} from 'src/lib/quality';

/** Objects that describe the workspace itself rather than its data. */
const NON_DATA_OBJECTS = new Set(['dashboard', 'workflow']);

const RECORD_PAGE_SIZE = 200;

const METADATA_QUERY = `{
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
        node: Omit<ObjectMeta, 'fields'> & {
          fields: { edges: { node: FieldMeta }[] };
        };
      }[];
    };
  };
};

const GRADE_COLOR: Record<Grade, ThemeColor> = {
  good: 'green',
  warn: 'orange',
  bad: 'red',
};

const ScoreBar = ({ ratio }: { ratio: number }) => (
  <div
    style={{
      position: 'relative',
      height: '6px',
      width: '100%',
      borderRadius: RADIUS.sm,
      background: `var(--t-tag-background-gray)`,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: `${Math.round(ratio * 100)}%`,
        background: `var(--t-tag-text-${GRADE_COLOR[gradeOf(ratio)]})`,
      }}
    />
  </div>
);

const FIELD_COLUMNS: Column[] = [
  { key: 'label', label: 'Field' },
  { key: 'type', label: 'Type', width: '120px' },
  { key: 'filled', label: 'Filled', width: '110px', align: 'right' },
  { key: 'ratio', label: 'Complete', width: '96px', align: 'right' },
];

const DataQualityPage = () => {
  const [scores, setScores] = useState<ObjectScore[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const client = new RestApiClient();

    const load = async () => {
      const metadata = await client.request<MetadataResponse>('POST', '/metadata', {
        body: { query: METADATA_QUERY },
      });

      const objects: ObjectMeta[] = (metadata.data?.objects?.edges ?? [])
        .map(({ node }) => ({ ...node, fields: node.fields.edges.map((edge) => edge.node) }))
        .filter(
          (object) =>
            object.isActive !== false &&
            object.isSystem !== true &&
            !NON_DATA_OBJECTS.has(object.nameSingular),
        );

      const results = await Promise.all(
        objects.map(async (object) => {
          try {
            const response = await client.get<Record<string, Record<string, unknown>[]>>(
              `/rest/${object.namePlural}`,
              { query: { limit: RECORD_PAGE_SIZE } },
            );
            // The REST envelope nests records under `data.<namePlural>`.
            const envelope = (response as { data?: Record<string, unknown> }).data ?? {};
            const records = (envelope[object.namePlural] ?? []) as Record<string, unknown>[];
            return scoreObject(object, records);
          } catch {
            // An object the role cannot read should not break the whole page.
            return null;
          }
        }),
      );

      setScores(
        results
          .filter((result): result is ObjectScore => result !== null)
          .filter((result) => result.recordCount > 0)
          .sort((a, b) => a.ratio - b.ratio),
      );
    };

    load().catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const overall = useMemo(() => (scores === null ? 0 : scoreWorkspace(scores)), [scores]);

  const worstFields = useMemo(() => {
    if (scores === null) return [];
    return scores
      .flatMap((object) =>
        object.fields.map((field) => ({ ...field, object: object.label })),
      )
      .filter((field) => field.total > 0 && field.ratio < 0.5)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10);
  }, [scores]);

  const recordTotal = scores?.reduce((sum, s) => sum + s.recordCount, 0) ?? 0;

  return (
    <WidgetFrame>
      <WidgetHeader
        title="Data Quality"
        subtitle="How completely your records are filled in. Reads the Metadata API, so every object and field in this workspace is included automatically — nothing to configure."
      />

      {error !== null && <StateMessage variant="error">Failed to load: {error}</StateMessage>}
      {error === null && scores === null && (
        <StateMessage variant="loading">Scanning workspace…</StateMessage>
      )}
      {error === null && scores !== null && scores.length === 0 && (
        <StateMessage variant="empty">No records to score yet.</StateMessage>
      )}

      {scores !== null && scores.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: space(2), marginBottom: space(4) }}>
            <StatCard
              label="Overall completeness"
              value={formatPercent(overall)}
              color={GRADE_COLOR[gradeOf(overall)]}
            />
            <StatCard label="Objects scored" value={`${scores.length}`} />
            <StatCard label="Records scanned" value={`${recordTotal}`} />
            <StatCard
              label="Fields under 50%"
              value={`${worstFields.length >= 10 ? '10+' : worstFields.length}`}
              color={worstFields.length > 0 ? 'red' : undefined}
            />
          </div>

          <SectionTitle>By object</SectionTitle>
          <div style={{ marginBottom: space(5) }}>
            {scores.map((object) => {
              const isOpen = expanded === object.nameSingular;
              return (
                <div
                  key={object.nameSingular}
                  style={{
                    borderBottom: `1px solid ${BORDER.light}`,
                    padding: `${space(2)} 0`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : object.nameSingular)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: space(3),
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                      color: COLOR.primary,
                    }}
                  >
                    <span style={{ width: '160px', fontSize: FONT.size.md }}>{object.label}</span>
                    <span style={{ flex: 1 }}>
                      <ScoreBar ratio={object.ratio} />
                    </span>
                    <span style={{ width: '56px', textAlign: 'right' }}>
                      <Tag text={formatPercent(object.ratio)} color={GRADE_COLOR[gradeOf(object.ratio)]} />
                    </span>
                    <span
                      style={{
                        width: '92px',
                        textAlign: 'right',
                        color: COLOR.light,
                        fontSize: FONT.size.sm,
                      }}
                    >
                      {object.recordCount} records
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: space(3) }}>
                      <TableHeader columns={FIELD_COLUMNS} />
                      {object.fields.map((field) => (
                        <TableRow key={field.name}>
                          <TableCell column={FIELD_COLUMNS[0]} title={field.label}>
                            {field.label}
                          </TableCell>
                          <TableCell
                            column={FIELD_COLUMNS[1]}
                            style={{ color: COLOR.light, fontSize: FONT.size.sm }}
                          >
                            {field.type}
                          </TableCell>
                          <TableCell
                            column={FIELD_COLUMNS[2]}
                            style={{ color: COLOR.secondary }}
                          >
                            {field.filled} / {field.total}
                          </TableCell>
                          <TableCell column={FIELD_COLUMNS[3]}>
                            <Tag
                              text={formatPercent(field.ratio)}
                              color={GRADE_COLOR[gradeOf(field.ratio)]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {worstFields.length > 0 && (
            <>
              <SectionTitle>Worst fields across the workspace</SectionTitle>
              <TableHeader columns={FIELD_COLUMNS} />
              {worstFields.map((field) => (
                <TableRow key={`${field.object}-${field.name}`}>
                  <TableCell column={FIELD_COLUMNS[0]} title={`${field.object} · ${field.label}`}>
                    <span style={{ color: COLOR.light }}>{field.object}</span> · {field.label}
                  </TableCell>
                  <TableCell
                    column={FIELD_COLUMNS[1]}
                    style={{ color: COLOR.light, fontSize: FONT.size.sm }}
                  >
                    {field.type}
                  </TableCell>
                  <TableCell column={FIELD_COLUMNS[2]} style={{ color: COLOR.secondary }}>
                    {field.filled} / {field.total}
                  </TableCell>
                  <TableCell column={FIELD_COLUMNS[3]}>
                    <Tag text={formatPercent(field.ratio)} color={GRADE_COLOR[gradeOf(field.ratio)]} />
                  </TableCell>
                </TableRow>
              ))}
            </>
          )}

          <div style={{ marginTop: space(4), fontSize: FONT.size.sm, color: COLOR.light }}>
            Booleans and one-to-many relations are not scored: `false` cannot be told apart from
            “never set”, and an empty collection is usually not a defect. Up to {RECORD_PAGE_SIZE}{' '}
            records per object are sampled.
          </div>
        </>
      )}
    </WidgetFrame>
  );
};

export default defineFrontComponent({
  universalIdentifier: DATA_QUALITY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'data-quality',
  description:
    'Scores record completeness for every object in the workspace, worst first, with a per-field breakdown.',
  component: DataQualityPage,
});
