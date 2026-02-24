import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.shipper_id !== user.id && booking.driver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [pickup, dropoff, items, driver] = await Promise.all([
    booking.pickup_address_id ? supabase.from('addresses').select('*').eq('id', booking.pickup_address_id).single() : { data: null },
    booking.dropoff_address_id ? supabase.from('addresses').select('*').eq('id', booking.dropoff_address_id).single() : { data: null },
    supabase.from('booking_items').select('*').eq('booking_id', id),
    booking.driver_id ? supabase.from('profiles').select('id, email').eq('id', booking.driver_id).single() : { data: null },
  ]);

  return NextResponse.json({
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    totalAmountZar: booking.total_amount_zar,
    driverEarningsZar: booking.driver_earnings_zar,
    pickupAddress: pickup.data,
    dropoffAddress: dropoff.data,
    items: items.data ?? [],
    driver: driver.data,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const action = body.action as string;

  if (action === 'accept') {
    const { data: booking } = await supabase.from('bookings').select('driver_id, status').eq('id', id).single();
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.driver_id) return NextResponse.json({ error: 'Already assigned' }, { status: 409 });
    const { data: updated, error } = await supabase
      .from('bookings')
      .update({ driver_id: user.id, status: 'driver_en_route' })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(updated);
  }

  if (action === 'status') {
    const status = body.status as string;
    const allowed = ['driver_en_route', 'pickup', 'in_transit', 'delivery', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    const { data: booking } = await supabase.from('bookings').select('shipper_id, driver_id').eq('id', id).single();
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.driver_id !== user.id && booking.shipper_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const updates: Record<string, unknown> = { status };
    if (status === 'pickup') updates.pickup_at = new Date().toISOString();
    if (status === 'completed') updates.delivered_at = new Date().toISOString();
    const { data: updated, error } = await supabase.from('bookings').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
