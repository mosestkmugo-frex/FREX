/** User roles per FREX spec Section 1 */
export type UserRole = 'shipper' | 'driver' | 'logistics_company' | 'storage_provider';

/** Verification statuses per spec */
export type VerificationStatus =
  | 'pending'
  | 'partially_verified'
  | 'fully_verified'
  | 'flagged'
  | 'suspended';

/** Booking/job status lifecycle */
export type BookingStatus =
  | 'draft'
  | 'booked'
  | 'driver_en_route'
  | 'pickup'
  | 'in_transit'
  | 'delivery'
  | 'completed'
  | 'cancelled';

/** Load class for pricing (Section 6.3) */
export type LoadClass = 'nano' | 'micro' | 'mega' | 'xl';

/** Vehicle type categories */
export type VehicleType =
  | 'bakkie'
  | 'van'
  | 'panel_van'
  | 'box_truck'
  | 'flatbed'
  | 'refrigerated'
  | 'moving_van'
  | 'crane'
  | 'tipper'
  | 'tanker'
  | 'medical_waste'
  | 'other';

export interface UserBase {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  verificationStatus: VerificationStatus;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShipperProfile {
  userId: string;
  businessName?: string;
  businessType?: 'individual' | 'sme' | 'corporate' | 'retailer' | 'manufacturer';
  vatNumber?: string;
  defaultPaymentMethod?: string;
}

export interface DriverProfile {
  userId: string;
  fullName: string;
  licenseNumber?: string;
  licenseCode?: string;
  vehicleId?: string;
  rating: number;
  acceptanceRate: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingItem {
  type: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValueZar: number;
  description?: string;
  photos?: string[];
  specialRequirements?: string[];
}

export interface BookingCreateInput {
  pickup: Address;
  dropoff: Address;
  items: BookingItem[];
  specialRequirements?: string[];
  declaredValueZar: number;
  preferredVehicleType?: VehicleType;
  scheduledAt?: string;
}

export interface PriceBreakdown {
  baseFareZar: number;
  distanceChargeZar: number;
  loadClassFeeZar: number;
  addOnsZar: number;
  insuranceZar: number;
  subtotalZar: number;
  vatZar: number;
  totalZar: number;
  currency: string;
}

export interface RatingInput {
  bookingId: string;
  score: number;
  comment?: string;
  criteria?: Record<string, number>;
}

export type SupportedCurrency = 'ZAR' | 'BWP' | 'NAD' | 'USD' | 'KES' | 'MZN';
export type SupportedLanguage =
  | 'en'
  | 'zu'
  | 'xh'
  | 'af'
  | 'pt'
  | 'sw';
