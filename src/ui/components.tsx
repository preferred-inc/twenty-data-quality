import type { CSSProperties, ReactNode } from 'react';
import { Tag } from 'twenty-ui/data-display';
import { Loader } from 'twenty-ui/feedback';
import { Card } from 'twenty-ui/surfaces';
import 'twenty-ui/style.css';

import {
  BG,
  BORDER,
  COLOR,
  FONT,
  SIZE,
  space,
  tagText,
  type ThemeColor,
} from 'src/ui/theme';

/**
 * Shared layout pieces for the front component.
 *
 * Ready-made parts (Tag, Card, Loader …) come straight from twenty-ui; only
 * the arrangements it does not ship — the widget frame, table rows, stat cards
 * — are built here. Colours and sizes always go through the theme tokens in
 * src/ui/theme, never as literals.
 */

export { Tag };

/**
 * A front component's `<style>` is injected into `document.head` by the build
 * shim and de-duplicated by content hash, so re-rendering never stacks it up.
 */
export const UiStyles = () => (
  <style>{`
    .tw-row { transition: background var(--t-animation-duration-instant, .075s) ease; }
    .tw-row:hover { background: ${BG.transparentLight}; }
    .tw-scroll { scrollbar-width: thin; }
    .tw-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .tw-scroll::-webkit-scrollbar-thumb {
      background: ${BG.transparentMedium};
      border-radius: var(--t-border-radius-pill);
    }
    .tw-scroll::-webkit-scrollbar-track { background: transparent; }
    .tw-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tw-plain-button {
      border: none; background: transparent; padding: 0;
      cursor: pointer; font-family: inherit;
    }
  `}</style>
);

type WidgetFrameProps = {
  children: ReactNode;
  /** Only for views that genuinely need horizontal scrolling. */
  scrollX?: boolean;
};

/** Fills the widget area and adopts the host's typeface and text colour. */
export const WidgetFrame = ({ children, scrollX = false }: WidgetFrameProps) => (
  <div
    className="tw-scroll"
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      padding: `${space(4)} ${space(6)}`,
      boxSizing: 'border-box',
      fontFamily: FONT.family,
      fontSize: FONT.size.md,
      color: COLOR.primary,
      background: BG.primary,
      overflowY: 'auto',
      overflowX: scrollX ? 'auto' : 'hidden',
    }}
  >
    <UiStyles />
    {children}
  </div>
);

type WidgetHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export const WidgetHeader = ({ title, subtitle, right }: WidgetHeaderProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: space(4),
      marginBottom: space(4),
      flexShrink: 0,
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: FONT.size.md,
          fontWeight: FONT.weight.semiBold,
          color: COLOR.primary,
          lineHeight: 'var(--t-text-line-height-lg)',
        }}
      >
        {title}
      </div>
      {subtitle !== undefined && (
        <div
          style={{
            fontSize: FONT.size.sm,
            color: COLOR.tertiary,
            marginTop: space(1),
            lineHeight: 'var(--t-text-line-height-lg)',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
    {right !== undefined && <div style={{ flexShrink: 0 }}>{right}</div>}
  </div>
);

export type Column = {
  key: string;
  label: string;
  /** Fixed width. Omit to share the remaining space. */
  width?: string;
  align?: 'left' | 'right';
};

/** Row layout matched to the host's record table (24px header, 32px rows). */
export const TableHeader = ({ columns }: { columns: Column[] }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      height: SIZE.headerHeight,
      borderBottom: `1px solid ${BORDER.light}`,
      fontSize: FONT.size.sm,
      fontWeight: FONT.weight.medium,
      color: COLOR.tertiary,
      flexShrink: 0,
    }}
  >
    {columns.map((column) => (
      <div
        key={column.key}
        className="tw-ellipsis"
        style={{
          width: column.width,
          flex: column.width === undefined ? 1 : undefined,
          flexShrink: column.width === undefined ? 1 : 0,
          padding: SIZE.cellPadding,
          textAlign: column.align ?? 'left',
          boxSizing: 'border-box',
        }}
      >
        {column.label}
      </div>
    ))}
  </div>
);

export const TableRow = ({ children }: { children: ReactNode }) => (
  <div
    className="tw-row"
    style={{
      display: 'flex',
      alignItems: 'center',
      minHeight: SIZE.rowHeight,
      borderBottom: `1px solid ${BORDER.light}`,
      fontSize: FONT.size.md,
      color: COLOR.primary,
    }}
  >
    {children}
  </div>
);

type TableCellProps = {
  children: ReactNode;
  column: Column;
  title?: string;
  style?: CSSProperties;
};

export const TableCell = ({ children, column, title, style }: TableCellProps) => (
  <div
    className="tw-ellipsis"
    title={title}
    style={{
      width: column.width,
      flex: column.width === undefined ? 1 : undefined,
      flexShrink: column.width === undefined ? 1 : 0,
      padding: SIZE.cellPadding,
      textAlign: column.align ?? 'left',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

type StateMessageProps = {
  variant: 'loading' | 'empty' | 'error';
  children: ReactNode;
};

export const StateMessage = ({ variant, children }: StateMessageProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: space(2),
      padding: `${space(3)} 0`,
      fontSize: FONT.size.md,
      color: variant === 'error' ? COLOR.danger : COLOR.tertiary,
    }}
  >
    {variant === 'loading' && <Loader />}
    {children}
  </div>
);

/** Summary card for a single figure, built on twenty-ui's Card. */
export const StatCard = ({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: string | number;
  color?: ThemeColor;
  hint?: string;
}) => (
  <Card rounded fullWidth>
    <div style={{ padding: space(3) }}>
      <div style={{ fontSize: FONT.size.sm, color: COLOR.tertiary }}>{label}</div>
      <div
        style={{
          marginTop: space(1),
          fontSize: FONT.size.lg,
          fontWeight: FONT.weight.semiBold,
          color: color === undefined ? COLOR.primary : tagText(color),
        }}
      >
        {value}
      </div>
      {hint !== undefined && (
        <div style={{ marginTop: space(1), fontSize: FONT.size.sm, color: COLOR.light }}>
          {hint}
        </div>
      )}
    </div>
  </Card>
);

/** Section heading, optionally with a count. */
export const SectionTitle = ({
  children,
  count,
  isDanger = false,
}: {
  children: ReactNode;
  count?: number;
  isDanger?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: space(2),
      marginBottom: space(1),
      fontSize: FONT.size.sm,
      fontWeight: FONT.weight.medium,
      color: isDanger ? COLOR.danger : COLOR.tertiary,
    }}
  >
    <span>{children}</span>
    {count !== undefined && <span style={{ color: COLOR.light }}>{count}</span>}
  </div>
);
