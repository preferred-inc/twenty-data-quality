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
 * front component 用の共通レイアウト。
 *
 * 既製のパーツ（Tag・Card・Loader など）は twenty-ui のものをそのまま使い、
 * 本体にない組み方（ウィジェットの外枠、テーブルの行、集計カード）だけをここで組む。
 * 色・寸法は必ずテーマ変数（src/ui/theme）を経由し、直値を書かない。
 */

export { Tag };

/**
 * front component の `<style>` はビルド時のシムで `document.head` に注入され、
 * 内容ハッシュで重複排除されるため、何度描画してもスタイルは 1 回しか入らない。
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
  /** ガント等、横スクロールが要る画面だけ true にする */
  scrollX?: boolean;
};

/** ウィジェット領域いっぱいに広がる外枠。本体と同じ書体・文字色を適用する。 */
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
  /** 固定幅。省略すると残り幅を分け合う */
  width?: string;
  align?: 'left' | 'right';
};

/** 本体のレコードテーブルに寄せた行レイアウト（ヘッダー 24px / 行 32px）。 */
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

/** 集計値を並べるサマリーカード。twenty-ui の Card を土台にする。 */
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

/** セクション見出し。件数を添えられる。 */
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
