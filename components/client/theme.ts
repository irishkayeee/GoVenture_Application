/**
 * theme.ts
 * Shared color palette for client-facing screens — mirrors the palette used
 * in app/(client)/client-dashboard.tsx, extended with semantic status colors.
 */

export const C = {
  bg:       '#F8E4D5',
  brown:    '#3B1A0C',
  brownMid: '#6B3318',
  amber:    '#C46B1A',
  white:    '#FFFFFF',
  cardBg:   '#FFFFFF',
  lightBg:  '#FDF0E6',
  divider:  '#E8C4A0',
  success:  '#4CAF50',
  danger:   '#F44336',
  info:     '#2196F3',
};

/** Hero gradient used by most client page headers — matches the admin dashboard's WelcomeBanner. */
export const HERO_GRADIENT = ['#6B2E10', '#B85F17', '#D17B2E'] as const;

/** Hero gradient for pages that should avoid dark brown — warm amber/gold instead. */
export const PAGE_HERO_GRADIENT = ['#C46B1A', '#DC8B34', '#F0AC4C'] as const;
