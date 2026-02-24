-- FREX – Supabase schema (replaces Prisma/Postgres)
-- Auth: Supabase Auth (auth.users). This migration adds public schema + RLS.

-- Enums (match Prisma)
CREATE TYPE user_role AS ENUM ('shipper', 'driver', 'logistics_company', 'storage_provider');
CREATE TYPE verification_status AS ENUM ('pending', 'partially_verified', 'fully_verified', 'flagged', 'suspended');
CREATE TYPE booking_status AS ENUM ('draft', 'booked', 'driver_en_route', 'pickup', 'in_transit', 'delivery', 'completed', 'cancelled');
CREATE TYPE load_class AS ENUM ('nano', 'micro', 'mega', 'xl');
CREATE TYPE vehicle_type AS ENUM ('bakkie', 'van', 'panel_van', 'box_truck', 'flatbed', 'refrigerated', 'moving_van', 'crane', 'tipper', 'tanker', 'medical_waste', 'other');

-- Profiles: one row per auth.users (id = auth.uid())
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  role user_role NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  trust_score float NOT NULL DEFAULT 3.0,
  avatar_url text,
  device_fingerprint text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email),
  UNIQUE(phone)
);

-- Shipper profile
CREATE TABLE public.shipper_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text,
  business_type text,
  vat_number text,
  default_payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Driver profile
CREATE TABLE public.driver_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  license_number text,
  license_code text,
  rating float NOT NULL DEFAULT 0,
  acceptance_rate float NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  vehicle_id uuid UNIQUE
);

-- Vehicle (referenced by driver_profiles)
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  color text,
  capacity_kg float,
  length_cm float,
  width_cm float,
  height_cm float,
  vehicle_type vehicle_type NOT NULL,
  registration text
);

ALTER TABLE public.driver_profiles
  ADD CONSTRAINT driver_profiles_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);

-- Logistics / Storage profiles
CREATE TABLE public.logistics_company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  registration_no text,
  tax_number text,
  fleet_size int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.storage_provider_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_name text NOT NULL,
  address text,
  capacity_sqm float,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Addresses
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  province text,
  postal_code text,
  country text NOT NULL DEFAULT 'ZA',
  latitude float,
  longitude float
);

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  shipper_id uuid NOT NULL REFERENCES public.profiles(id),
  driver_id uuid REFERENCES public.profiles(id),
  status booking_status NOT NULL DEFAULT 'draft',
  load_class load_class NOT NULL,
  vehicle_type vehicle_type,
  total_amount_zar decimal(12,2) NOT NULL,
  platform_fee_zar decimal(12,2) NOT NULL,
  driver_earnings_zar decimal(12,2),
  declared_value_zar decimal(12,2) NOT NULL,
  distance_km float,
  route_type text,
  scheduled_at timestamptz,
  pickup_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  pickup_address_id uuid REFERENCES public.addresses(id),
  dropoff_address_id uuid REFERENCES public.addresses(id)
);

-- Booking items
CREATE TABLE public.booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type text NOT NULL,
  weight_kg float NOT NULL,
  length_cm float NOT NULL,
  width_cm float NOT NULL,
  height_cm float NOT NULL,
  declared_value_zar decimal(12,2) NOT NULL,
  description text,
  photos text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount_zar decimal(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  method text NOT NULL,
  status text NOT NULL,
  external_id text,
  paid_at timestamptz,
  payout_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tracking events
CREATE TABLE public.tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status booking_status NOT NULL,
  latitude float,
  longitude float,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ratings
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES public.profiles(id),
  rated_id uuid NOT NULL REFERENCES public.profiles(id),
  score int NOT NULL,
  comment text,
  criteria jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_bookings_shipper ON public.bookings(shipper_id);
CREATE INDEX idx_bookings_driver ON public.bookings(driver_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_tracking_events_booking ON public.tracking_events(booking_id);
CREATE INDEX idx_ratings_rated ON public.ratings(rated_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipper_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS: profiles – users can read/update own
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- RLS: role profiles – own row only
CREATE POLICY "Own shipper profile" ON public.shipper_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own driver profile" ON public.driver_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own logistics profile" ON public.logistics_company_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own storage profile" ON public.storage_provider_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own vehicle" ON public.vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.driver_profiles d WHERE d.vehicle_id = vehicles.id AND d.user_id = auth.uid())
);

-- RLS: addresses – no direct user ownership; accessed via bookings. Allow insert/select for authenticated.
CREATE POLICY "Authenticated can manage addresses" ON public.addresses FOR ALL USING (auth.role() = 'authenticated');

-- RLS: bookings – shipper sees own; driver sees assigned or available (booked, no driver)
CREATE POLICY "Shipper bookings" ON public.bookings FOR ALL USING (shipper_id = auth.uid());
CREATE POLICY "Driver assigned bookings" ON public.bookings FOR ALL USING (driver_id = auth.uid());
CREATE POLICY "Driver see available" ON public.bookings FOR SELECT USING (
  status = 'booked' AND driver_id IS NULL
);
-- Driver can accept (update driver_id and status) when booking is available
CREATE POLICY "Driver accept booking" ON public.bookings FOR UPDATE USING (
  status = 'booked' AND driver_id IS NULL
);

-- RLS: booking_items – via booking access
CREATE POLICY "Booking items via booking" ON public.booking_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_items.booking_id AND (b.shipper_id = auth.uid() OR b.driver_id = auth.uid()))
);

-- RLS: payments – user sees own
CREATE POLICY "Own payments" ON public.payments FOR ALL USING (user_id = auth.uid());

-- RLS: tracking_events – shipper/driver of booking
CREATE POLICY "Tracking via booking" ON public.tracking_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = tracking_events.booking_id AND (b.shipper_id = auth.uid() OR b.driver_id = auth.uid()))
);

-- RLS: ratings – read for booking parties; insert for authenticated
CREATE POLICY "Ratings for booking parties" ON public.ratings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = ratings.booking_id AND (b.shipper_id = auth.uid() OR b.driver_id = auth.uid()))
);
CREATE POLICY "Authenticated insert ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Trigger: create profile on signup (run as postgres / service role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'shipper'),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run after auth.users insert (in Supabase dashboard or migration with proper role)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: create profile when a new auth user is created (Supabase Auth signup)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
