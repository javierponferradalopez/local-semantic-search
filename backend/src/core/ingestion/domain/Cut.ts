// Code points, not tokens (ADR-0014). Raise the version with each change of the rule (ADR-0010).
export const CUT = {
  target: 1200,
  minimum: 200,
  cap: 1500,
  version: 1
} as const;
