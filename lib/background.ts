// App's primary pastel palette (user-supplied swatch strip, top to bottom).
export const PASTEL_PALETTE = [
  "#ffd1de", // pink
  "#fbe1da", // blush
  "#fff2d9", // cream
  "#fadfae", // peach
] as const;

// Shared default so a brand-new entry's page isn't black (the old default
// was a near-black swatch, which also got dropped from the picker below).
export const DEFAULT_BACKGROUND_TYPE = "color" as const;
export const DEFAULT_BACKGROUND_VALUE = "#FFF4DE"; // cream
