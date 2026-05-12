/**
 * Material 3 Design Tokens
 * Source: https://m3.material.io
 * Seed color: #9333EA (project primary purple)
 *
 * These tokens mirror the M3 system. They are exposed both as TS constants
 * (for documentation in /ds) and as CSS variables in `m3-theme.css`.
 */

export const M3_SEED = "#9333EA";

// ---------- Color (key tones derived from seed) ----------
// Tonal palettes (0..100) generated from the seed via Material Color Utilities.
// Values are HEX for readability; CSS uses HSL via theme file.
export const m3Palette = {
  primary: {
    0: "#000000", 10: "#2C0050", 20: "#470080", 30: "#6300B0",
    40: "#7E1AD0", 50: "#9333EA", 60: "#A95DEE", 70: "#BE85F2",
    80: "#D2ADF6", 90: "#E8D6FB", 95: "#F4EAFD", 99: "#FEFBFF", 100: "#FFFFFF",
  },
  secondary: {
    10: "#1E1A22", 20: "#332E37", 30: "#4A444E", 40: "#625B66",
    50: "#7B7480", 60: "#958E9A", 70: "#B0A8B5", 80: "#CBC3D1",
    90: "#E8DEF0", 95: "#F6EDFD", 99: "#FEFBFF",
  },
  tertiary: {
    10: "#31101D", 20: "#4A2532", 30: "#633B48", 40: "#7D5260",
    50: "#986C79", 60: "#B48593", 70: "#D09FAE", 80: "#EDB8C9",
    90: "#FFD9E2", 95: "#FFECF1", 99: "#FFFBFF",
  },
  error: {
    10: "#410E0B", 20: "#601410", 30: "#8C1D18", 40: "#B3261E",
    50: "#DC362E", 60: "#E46962", 70: "#EC928E", 80: "#F2B8B5",
    90: "#F9DEDC", 95: "#FCEEEE", 99: "#FFFBF9",
  },
  neutral: {
    0: "#000000", 10: "#1C1B1F", 20: "#313033", 30: "#484649",
    40: "#605D62", 50: "#787579", 60: "#939094", 70: "#AEAAAE",
    80: "#C9C5CA", 90: "#E6E1E5", 95: "#F4EFF4", 99: "#FFFBFE", 100: "#FFFFFF",
  },
  neutralVariant: {
    10: "#1D1A22", 20: "#322F37", 30: "#49454F", 40: "#605D66",
    50: "#79747E", 60: "#938F99", 70: "#AEA9B4", 80: "#CAC4D0",
    90: "#E7E0EC", 95: "#F5EEFA", 99: "#FFFBFE",
  },
} as const;

// ---------- Typography (M3 type scale) ----------
export const m3Typography = {
  display: {
    large:  { size: "57px", line: "64px", tracking: "-0.25px", weight: 400 },
    medium: { size: "45px", line: "52px", tracking: "0px",     weight: 400 },
    small:  { size: "36px", line: "44px", tracking: "0px",     weight: 400 },
  },
  headline: {
    large:  { size: "32px", line: "40px", tracking: "0px",    weight: 400 },
    medium: { size: "28px", line: "36px", tracking: "0px",    weight: 400 },
    small:  { size: "24px", line: "32px", tracking: "0px",    weight: 400 },
  },
  title: {
    large:  { size: "22px", line: "28px", tracking: "0px",    weight: 500 },
    medium: { size: "16px", line: "24px", tracking: "0.15px", weight: 500 },
    small:  { size: "14px", line: "20px", tracking: "0.1px",  weight: 500 },
  },
  body: {
    large:  { size: "16px", line: "24px", tracking: "0.5px",  weight: 400 },
    medium: { size: "14px", line: "20px", tracking: "0.25px", weight: 400 },
    small:  { size: "12px", line: "16px", tracking: "0.4px",  weight: 400 },
  },
  label: {
    large:  { size: "14px", line: "20px", tracking: "0.1px",  weight: 500 },
    medium: { size: "12px", line: "16px", tracking: "0.5px",  weight: 500 },
    small:  { size: "11px", line: "16px", tracking: "0.5px",  weight: 500 },
  },
} as const;

// ---------- Shape (corner radius) ----------
export const m3Shape = {
  none: "0px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "28px",
  full: "9999px",
} as const;

// ---------- Elevation ----------
export const m3Elevation = {
  level0: "none",
  level1: "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
  level2: "0px 1px 2px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
  level3: "0px 1px 3px rgba(0,0,0,0.30), 0px 4px 8px 3px rgba(0,0,0,0.15)",
  level4: "0px 2px 3px rgba(0,0,0,0.30), 0px 6px 10px 4px rgba(0,0,0,0.15)",
  level5: "0px 4px 4px rgba(0,0,0,0.30), 0px 8px 12px 6px rgba(0,0,0,0.15)",
} as const;

// ---------- Motion ----------
export const m3Motion = {
  duration: {
    short1: "50ms",  short2: "100ms", short3: "150ms", short4: "200ms",
    medium1: "250ms", medium2: "300ms", medium3: "350ms", medium4: "400ms",
    long1: "450ms",  long2: "500ms",  long3: "550ms",  long4: "600ms",
  },
  easing: {
    standard:           "cubic-bezier(0.2, 0, 0, 1)",
    standardAccelerate: "cubic-bezier(0.3, 0, 1, 1)",
    standardDecelerate: "cubic-bezier(0, 0, 0, 1)",
    emphasized:         "cubic-bezier(0.2, 0, 0, 1)",
    emphasizedAccelerate:"cubic-bezier(0.3, 0, 0.8, 0.15)",
    emphasizedDecelerate:"cubic-bezier(0.05, 0.7, 0.1, 1)",
  },
} as const;

// ---------- Spacing (4dp scale) ----------
export const m3Spacing = {
  0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px",
  5: "20px", 6: "24px", 7: "28px", 8: "32px", 10: "40px",
  12: "48px", 14: "56px", 16: "64px", 20: "80px", 24: "96px",
} as const;