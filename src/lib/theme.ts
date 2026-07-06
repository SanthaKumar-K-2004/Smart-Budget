// Central chart/semantic color palette — keep in sync with the CSS custom
// properties in globals.css. Recharts/SVG need literal hex values (they
// can't read CSS variables directly in all cases), so we mirror the tokens
// here once instead of hardcoding colors across every page.
export const CHART_COLORS = {
  needs: "#4f46e5", // indigo — matches --needs / --brand
  wants: "#0ea5e9", // sky — matches --wants
  savings: "#f59e0b", // amber — matches --savings
  danger: "#dc2626",
  success: "#16a34a",
  warning: "#d97706",
  brand: "#4f46e5",
  brandDark: "#4338ca",
  muted: "#94a3b8",
} as const;

export const GROUP_HEX: Record<string, string> = {
  needs: CHART_COLORS.needs,
  wants: CHART_COLORS.wants,
  savings: CHART_COLORS.savings,
};

export const ASSET_CHART_COLORS = [
  CHART_COLORS.needs,
  CHART_COLORS.wants,
  CHART_COLORS.savings,
  CHART_COLORS.muted,
];
