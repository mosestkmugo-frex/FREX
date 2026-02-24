import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { calculatePrice } from '@frex/shared';
import type { LoadClass, VehicleType } from '@frex/shared';

function generateBookingReference(): string {
  const chars = '0123456789ABCDEF';
  let s = 'FRX-';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('ZA'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const itemSchema = z.object({
  type: z.string(),
  weightKg: z.number(),
  lengthCm: z.number(),
  widthCm: z.number(),
  heightCm: z.number(),
  declaredValueZar: z.number(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

const createSchema = z.object({
  pickup: addressSchema,
  dropoff: addressSchema,
  items: z.array(itemSchema).min(1),
  declaredValueZar: z.number(),
  preferredVehicleType: z.string().optional(),
  routeType: z.enum(['urban', 'intercity', 'rural']).default('urban'),
  scheduledAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const available = searchParams.get('available') === 'true';

  if (available) {
    const { data: availableBookings, error } = await supabase
      .from('bookings')
      .select('id, reference, status, total_amount_zar, driver_earnings_zar, pickup_address_id, dropoff_address_id')
      .eq('status', 'booked')
      .is('driver_id', null)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const ids = [...new Set((availableBookings ?? []).flatMap((b: { pickup_address_id?: string; dropoff_address_id?: string }) => [b.pickup_address_id, b.dropoff_address_id]).filter(Boolean))];
    const { data: addrs } = ids.length ? await supabase.from('addresses').select('id, line1, city').in('id', ids) : { data: [] };
    const addrMap = Object.fromEntries((addrs ?? []).map((a: { id: string; line1: string; city: string }) => [a.id, a]));
    const withAddresses = (availableBookings ?? []).map((b: Record<string, unknown>) => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      totalAmountZar: b.total_amount_zar,
      driverEarningsZar: b.driver_earnings_zar,
      driverId: b.driver_id,
      pickupAddress: b.pickup_address_id ? addrMap[b.pickup_address_id as string] : null,
      dropoffAddress: b.dropoff_address_id ? addrMap[b.dropoff_address_id as string] : null,
    }));
    return NextResponse.json(withAddresses);
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'shipper';
  let query = supabase
    .from('bookings')
    .select(`
      id, reference, status, total_amount_zar, platform_fee_zar, driver_earnings_zar,
      declared_value_zar, created_at, shipper_id, driver_id,
      pickup_address_id, dropoff_address_id
    `)
    .order('created_at', { ascending: false });
  if (role === 'shipper') query = query.eq('shipper_id', user.id);
  else if (role === 'driver') query = query.eq('driver_id', user.id);

  const { data: bookings, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const addressIds = [...new Set((bookings ?? []).flatMap((b: { pickup_address_id?: string; dropoff_address_id?: string }) => [b.pickup_address_id, b.dropoff_address_id]).filter(Boolean))];
  const { data: addresses } = addressIds.length
    ? await supabase.from('addresses').select('id, line1, city').in('id', addressIds)
    : { data: [] };
  const addrMap = Object.fromEntries((addresses ?? []).map((a: { id: string; line1: string; city: string }) => [a.id, a]));

  const withAddresses = (bookings ?? []).map((b: Record<string, unknown>) => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    totalAmountZar: b.total_amount_zar,
    platformFeeZar: b.platform_fee_zar,
    driverEarningsZar: b.driver_earnings_zar,
    shipperId: b.shipper_id,
    driverId: b.driver_id,
    createdAt: b.created_at,
    pickupAddress: b.pickup_address_id ? addrMap[b.pickup_address_id as string] : null,
    dropoffAddress: b.dropoff_address_id ? addrMap[b.dropoff_address_id as string] : null,
  }));
  return NextResponse.json(withAddresses);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'shipper') {
    return NextResponse.json({ error: 'Only shippers can create bookings' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const { pickup, dropoff, items, declaredValueZar, routeType, preferredVehicleType, scheduledAt } = parsed.data;

  const distanceKm = 25;
  const loadClass: LoadClass = 'micro';
  const pricing = calculatePrice({
    distanceKm,
    routeType,
    loadClass,
    declaredValueZar,
  });
  const platformFeeZar = Math.round(pricing.totalZar * 0.15 * 100) / 100;
  const driverEarningsZar = Math.round((pricing.totalZar - platformFeeZar) * 100) / 100;

  const { data: pickupAddr, error: e1 } = await supabase
    .from('addresses')
    .insert({ line1: pickup.line1, line2: pickup.line2, city: pickup.city, province: pickup.province, postal_code: pickup.postalCode, country: pickup.country, latitude: pickup.latitude, longitude: pickup.longitude })
    .select('id')
    .single();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: dropoffAddr, error: e2 } = await supabase
    .from('addresses')
    .insert({ line1: dropoff.line1, line2: dropoff.line2, city: dropoff.city, province: dropoff.province, postal_code: dropoff.postalCode, country: dropoff.country, latitude: dropoff.latitude, longitude: dropoff.longitude })
    .select('id')
    .single();
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const reference = generateBookingReference();
  const { data: booking, error: e3 } = await supabase
    .from('bookings')
    .insert({
      reference,
      shipper_id: user.id,
      status: 'booked',
      load_class: loadClass,
      vehicle_type: (preferredVehicleType as VehicleType) ?? null,
      total_amount_zar: pricing.totalZar,
      platform_fee_zar: platformFeeZar,
      driver_earnings_zar: driverEarningsZar,
      declared_value_zar: declaredValueZar,
      distance_km: distanceKm,
      route_type: routeType,
      scheduled_at: scheduledAt ?? null,
      pickup_address_id: pickupAddr.id,
      dropoff_address_id: dropoffAddr.id,
    })
    .select()
    .single();
  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

  const { error: e4 } = await supabase.from('booking_items').insert(
    items.map((i) => ({
      booking_id: booking.id,
      type: i.type,
      weight_kg: i.weightKg,
      length_cm: i.lengthCm,
      width_cm: i.widthCm,
      height_cm: i.heightCm,
      declared_value_zar: i.declaredValueZar,
      description: i.description ?? null,
      photos: i.photos ?? [],
    }))
  );
  if (e4) return NextResponse.json({ error: e4.message }, { status: 500 });

  return NextResponse.json({ ...booking, priceBreakdown: pricing }, { status: 201 });
}
