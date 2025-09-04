-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_gallery ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_type_value TEXT;
BEGIN
  -- Input validation and sanitization
  user_full_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  user_type_value := COALESCE(TRIM(NEW.raw_user_meta_data->>'user_type'), 'viewer');

  -- Validate user_type is one of the allowed values
  IF user_type_value NOT IN ('planner', 'vendor', 'viewer') THEN
    user_type_value := 'viewer';
  END IF;

  -- Insert with validated data
  INSERT INTO public.profiles (id, email, full_name, user_type, avatar_url, location_preference, onboarding_completed, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_type_value::public."UserType",
    NULL,
    NULL,
    false,
    NEW.created_at,
    NEW.updated_at
  );

  -- Log the profile creation for audit purposes
  RAISE LOG 'Profile created for user % with type %', NEW.id, user_type_value;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles table policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Couple profiles policies
CREATE POLICY "Users can view their own couple profile" ON public.couple_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own couple profile" ON public.couple_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Partners can view couple profiles they're part of" ON public.couple_profiles
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Service role can manage all couple profiles" ON public.couple_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Vendor profiles policies
CREATE POLICY "Users can view their own vendor profile" ON public.vendor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own vendor profile" ON public.vendor_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view verified vendor profiles" ON public.vendor_profiles
  FOR SELECT USING (verified = true);

CREATE POLICY "Service role can manage all vendor profiles" ON public.vendor_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Vendor contacts policies
CREATE POLICY "Users can manage their own vendor contacts" ON public.vendor_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_contacts.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view vendor contacts for verified vendors" ON public.vendor_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_contacts.vendor_id
      AND vendor_profiles.verified = true
    )
  );

-- Vendor locations policies
CREATE POLICY "Users can manage their own vendor locations" ON public.vendor_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_locations.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view vendor locations for verified vendors" ON public.vendor_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_locations.vendor_id
      AND vendor_profiles.verified = true
    )
  );

-- Events policies
CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = planner_id);

CREATE POLICY "Users can manage their own events" ON public.events
  FOR ALL USING (auth.uid() = planner_id);

CREATE POLICY "Service role can manage all events" ON public.events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Service categories policies (public read)
CREATE POLICY "Public can view service categories" ON public.service_categories
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage service categories" ON public.service_categories
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Vendor services policies
CREATE POLICY "Users can manage their own vendor services" ON public.vendor_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_services.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view vendor services for verified vendors" ON public.vendor_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_services.vendor_id
      AND vendor_profiles.verified = true
    )
  );

-- Vendor inquiries policies
CREATE POLICY "Users can view inquiries for their vendors" ON public.vendor_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_inquiries.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage inquiries for their vendors" ON public.vendor_inquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_inquiries.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

-- Vendor bookings policies
CREATE POLICY "Users can view bookings for their vendors" ON public.vendor_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_bookings.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage bookings for their vendors" ON public.vendor_bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_bookings.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

-- Guests policies
CREATE POLICY "Users can view guests for their events" ON public.guests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guests.event_id
      AND events.planner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage guests for their events" ON public.guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guests.event_id
      AND events.planner_id = auth.uid()
    )
  );

-- Guest groups policies
CREATE POLICY "Users can manage guest groups for their events" ON public.guest_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guest_groups.event_id
      AND events.planner_id = auth.uid()
    )
  );

-- Guest communications policies
CREATE POLICY "Users can manage guest communications for their events" ON public.guest_communications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.guests g
      JOIN public.events e ON g.event_id = e.id
      WHERE g.id = guest_communications.guest_id
      AND e.planner_id = auth.uid()
    )
  );

-- Checklist items policies
CREATE POLICY "Users can manage checklist items for their events" ON public.checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = checklist_items.event_id
      AND events.planner_id = auth.uid()
    )
  );

-- Budget items policies
CREATE POLICY "Users can manage budget items for their events" ON public.budget_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = budget_items.event_id
      AND events.planner_id = auth.uid()
    )
  );

-- Vendor availability policies
CREATE POLICY "Users can manage availability for their vendors" ON public.vendor_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_availability.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view availability for verified vendors" ON public.vendor_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_availability.vendor_id
      AND vendor_profiles.verified = true
    )
  );

-- Vendor analytics policies
CREATE POLICY "Users can view analytics for their vendors" ON public.vendor_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_analytics.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage analytics for their vendors" ON public.vendor_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_analytics.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

-- Vendor favorites policies
CREATE POLICY "Users can manage their own favorites" ON public.vendor_favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view vendor favorites" ON public.vendor_favorites
  FOR SELECT USING (true);

-- Vendor gallery policies
CREATE POLICY "Users can manage gallery for their vendors" ON public.vendor_gallery
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_gallery.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view gallery for verified vendors" ON public.vendor_gallery
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = vendor_gallery.vendor_id
      AND vendor_profiles.verified = true
    )
  );
