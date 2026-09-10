import type { ThemeColor } from 'twenty-ui/theme';

/**
 * Twenty 本体のデザイントークン。
 *
 * front component は iframe でも shadow DOM でもなく、ホストと同じ DOM に描画される。
 * そのため twenty-ui が `<html class="light|dark">` に定義している CSS 変数（`--t-*`）が
 * そのまま解決される。色やサイズを直書きせずここを経由することで、本体と同じ見た目になり、
 * ライト／ダークの切り替えにも自動で追従する。
 *
 * 既製のパーツ（Tag・Button・Card など）は twenty-ui のコンポーネントをそのまま使う。
 * ここのトークンは、既製品にない配置・寸法（ガントの帯、テーブルの行）を組むときに使う。
 */

export type { ThemeColor };

export const FONT = {
  family: 'var(--t-font-family)',
  size: {
    xxs: 'var(--t-font-size-xxs)',
    xs: 'var(--t-font-size-xs)',
    sm: 'var(--t-font-size-sm)',
    md: 'var(--t-font-size-md)',
    lg: 'var(--t-font-size-lg)',
    xl: 'var(--t-font-size-xl)',
  },
  weight: {
    regular: 'var(--t-font-weight-regular)',
    medium: 'var(--t-font-weight-medium)',
    semiBold: 'var(--t-font-weight-semi-bold)',
  },
} as const;

export const COLOR = {
  primary: 'var(--t-font-color-primary)',
  secondary: 'var(--t-font-color-secondary)',
  tertiary: 'var(--t-font-color-tertiary)',
  light: 'var(--t-font-color-light)',
  extraLight: 'var(--t-font-color-extra-light)',
  inverted: 'var(--t-font-color-inverted)',
  danger: 'var(--t-font-color-danger)',
} as const;

export const BG = {
  primary: 'var(--t-background-primary)',
  secondary: 'var(--t-background-secondary)',
  tertiary: 'var(--t-background-tertiary)',
  quaternary: 'var(--t-background-quaternary)',
  danger: 'var(--t-background-danger)',
  transparentLighter: 'var(--t-background-transparent-lighter)',
  transparentLight: 'var(--t-background-transparent-light)',
  transparentMedium: 'var(--t-background-transparent-medium)',
} as const;

export const BORDER = {
  light: 'var(--t-border-color-light)',
  medium: 'var(--t-border-color-medium)',
  strong: 'var(--t-border-color-strong)',
  danger: 'var(--t-border-color-danger)',
} as const;

export const RADIUS = {
  xs: 'var(--t-border-radius-xs)',
  sm: 'var(--t-border-radius-sm)',
  md: 'var(--t-border-radius-md)',
  pill: 'var(--t-border-radius-pill)',
} as const;

/** Twenty の spacing スケール（1 = 4px） */
export const space = (multiplier: number) => `var(--t-spacing-${multiplier})`;

/** twenty-ui の Tag と同じ配色を、既製品でない要素（ガントの帯など）に流用するためのもの */
export const tagBackground = (color: ThemeColor) => `var(--t-tag-background-${color})`;
export const tagText = (color: ThemeColor) => `var(--t-tag-text-${color})`;

/** 本体のレコードテーブルの実測値 */
export const SIZE = {
  rowHeight: '32px',
  headerHeight: '24px',
  cellPadding: `0 ${space(2)}`,
} as const;
