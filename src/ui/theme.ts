import type { ThemeColor } from 'twenty-ui/theme';

/**
 * Twenty's own design tokens.
 *
 * A front component renders into the host's DOM — not an iframe, not a shadow
 * root — so the CSS variables twenty-ui defines on `<html class="light|dark">`
 * (`--t-*`) resolve as-is. Going through these tokens instead of hard-coding
 * colours and sizes is what makes the app look native and follow the host's
 * light/dark switch for free.
 *
 * Ready-made parts (Tag, Button, Card …) come from twenty-ui directly. These
 * tokens are for the layouts twenty-ui does not ship — score bars, table rows.
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

/** Twenty's spacing scale (1 = 4px). */
export const space = (multiplier: number) => `var(--t-spacing-${multiplier})`;

/** Reuses twenty-ui's Tag palette on elements it does not ship, such as score bars. */
export const tagBackground = (color: ThemeColor) => `var(--t-tag-background-${color})`;
export const tagText = (color: ThemeColor) => `var(--t-tag-text-${color})`;

/** Measured from the host's own record table. */
export const SIZE = {
  rowHeight: '32px',
  headerHeight: '24px',
  cellPadding: `0 ${space(2)}`,
} as const;
