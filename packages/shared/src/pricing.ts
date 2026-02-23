import type { LoadClass } from './types';
import { PRICING, PEAK_HOURS, PEAK_MULTIPLIER } from './constants';

export interface PricingInput {
  distanceKm: number;
  routeType: 'urban' | 'intercity' | 'rural';
  loadClass: LoadClass;
  declaredValueZar: number;
  addOns?: {
    stairsFlights?: number;
    whiteGlove?: boolean;
    afterHours?: boolean;
  };
  isPeak?: boolean;
  /** If not provided, derived from current time */
  timestamp?: Date;
}

function isPeakHour(date: Date): boolean {
  const hour = date.getHours();
  return PEAK_HOURS.some(({ start, end }) => hour >= start && hour < end);
}

export function calculatePrice(input: PricingInput): {
  baseFareZar: number;
  distanceChargeZar: number;
  loadClassFeeZar: number;
  addOnsZar: number;
  insuranceZar: number;
  peakZar: number;
  subtotalZar: number;
  vatZar: number;
  totalZar: number;
} {
  const now = input.timestamp ?? new Date();
  const peak = input.isPeak ?? isPeakHour(now);
  const ratePerKm = PRICING.distancePerKm[input.routeType];
  const distanceChargeZar = input.distanceKm * ratePerKm;
  const loadClassFeeZar =
    input.loadClass === 'xl' ? 0 : PRICING.loadClassFee[input.loadClass];
  let addOnsZar = 0;
  if (input.addOns?.stairsFlights) {
    addOnsZar += input.addOns.stairsFlights * PRICING.stairsPerFlight;
  }
  if (input.addOns?.whiteGlove) {
    addOnsZar += distanceChargeZar * PRICING.whiteGloveMultiplier;
  }
  if (input.addOns?.afterHours) {
    addOnsZar += distanceChargeZar * PRICING.afterHoursMultiplier;
  }
  const insuranceZar = Math.max(
    input.declaredValueZar * PRICING.insuranceRate,
    PRICING.insuranceMinZar
  );
  const baseFareZar = distanceChargeZar + loadClassFeeZar;
  let subtotalZar = baseFareZar + addOnsZar + insuranceZar;
  if (peak) {
    subtotalZar *= PEAK_MULTIPLIER;
  }
  const peakZar = peak ? subtotalZar - subtotalZar / PEAK_MULTIPLIER : 0;
  const vatZar = Math.round((subtotalZar * 0.15) * 100) / 100;
  const totalZar = Math.round((subtotalZar + vatZar) * 100) / 100;
  return {
    baseFareZar: Math.round(baseFareZar * 100) / 100,
    distanceChargeZar: Math.round(distanceChargeZar * 100) / 100,
    loadClassFeeZar,
    addOnsZar: Math.round(addOnsZar * 100) / 100,
    insuranceZar: Math.round(insuranceZar * 100) / 100,
    peakZar: Math.round(peakZar * 100) / 100,
    subtotalZar: Math.round(subtotalZar * 100) / 100,
    vatZar,
    totalZar,
  };
}
