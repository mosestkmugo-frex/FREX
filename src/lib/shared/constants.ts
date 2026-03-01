/** FREX pricing and config (Section 6.3, 8.2) – ZAR */
export const PRICING = {
  /** Distance (ZAR/km) by route type */
  distancePerKm: {
    urban: 24,
    intercity: 18,
    rural: 14,
  },
  /** Load class fees (ZAR) */
  loadClassFee: {
    nano: 60,
    micro: 120,
    mega: 350,
    xl: 0, // custom quote
  },
  /** Add-ons */
  stairsPerFlight: 80,
  whiteGloveMultiplier: 0.2,
  afterHoursMultiplier: 0.25,
  /** Insurance */
  insuranceRate: 0.015,
  insuranceMinZar: 75,
  basicCoverageZar: 50_000,
  /** Upgrades */
  insuranceSilver: { coverage: 250_000, premium: 75 },
  insuranceGold: { coverage: 500_000, premium: 150 },
  insurancePlatinum: { coverage: 1_000_000, premium: 250 },
} as const;

/** Peak hours (Section 6.3) – peak pricing +15% */
export const PEAK_HOURS = [
  { start: 7, end: 9 },
  { start: 16, end: 18 },
];
export const PEAK_MULTIPLIER = 1.15;

/** Trust tiers (Section 9.1) */
export const TRUST_TIERS = {
  bronze: { min: 0, max: 3.9 },
  silver: { min: 4.0, max: 4.4 },
  gold: { min: 4.5, max: 4.7 },
  platinum: { min: 4.8, max: 5.0 },
} as const;

/** Subscription tiers – monthly ZAR */
export const SUBSCRIPTIONS = {
  shipper: { starter: 499, growth: 1999, enterprise: 4999 },
  driver: { flexPro: 199, flexPrime: 399 },
  storage: { host: 399, hub: 1499 },
} as const;

/** Currency codes and display */
export const CURRENCIES = {
  ZAR: { symbol: 'R', name: 'South African Rand' },
  BWP: { symbol: 'P', name: 'Botswana Pula' },
  NAD: { symbol: '$', name: 'Namibian Dollar' },
  USD: { symbol: '$', name: 'US Dollar' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  MZN: { symbol: 'MT', name: 'Mozambican Metical' },
} as const;

/** API route prefixes */
export const API_PREFIX = '/api';
