export const ORIGINS = ['mcp', 'interface'] as const;

export type Origin = (typeof ORIGINS)[number];
