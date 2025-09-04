import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { parseCalendarEvents, decryptCalendarUrl, sanitizeUrlForLogging, getDefaultPrivacySettings } from '@/lib/calendar-service';
import { logCalendarEventsFetch } from '@/lib/audit-logger';
import type { Database } from '@/types/database';

// Validation schema for date range
const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// Validation schema for privacy settings
const privacySettingsSchema = z.object({
  showEventDetails: z.boolean().optional(),
  externalCalendarEnabled: z.boolean().optional(),
}).optional();

interface ExternalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  isExternal: true;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 External events API called");
    
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("❌ Auth error:", authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log("✅ User authenticated:", user.email);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const privacySettingsParam = searchParams.get('privacySettings');

    console.log("📅 Date range:", { startDate, endDate });

    // Validate date range
    const dateValidation = dateRangeSchema.safeParse({
      startDate,
      endDate,
    });

    if (!dateValidation.success) {
      console.log("❌ Date validation failed:", dateValidation.error.issues);
      return NextResponse.json(
        { error: 'Invalid date range', details: dateValidation.error.issues },
        { status: 400 }
      );
    }

    // Parse privacy settings if provided
    let privacySettings = getDefaultPrivacySettings();
    if (privacySettingsParam) {
      try {
        const parsedSettings = JSON.parse(privacySettingsParam);
        const privacyValidation = privacySettingsSchema.safeParse(parsedSettings);
        if (privacyValidation.success) {
          privacySettings = { ...privacySettings, ...privacyValidation.data };
        }
      } catch (error) {
        console.warn('Invalid privacy settings provided:', error);
      }
    }

    console.log("🔒 Privacy settings:", privacySettings);

    // Check if external calendar is enabled
    if (privacySettings.externalCalendarEnabled === false) {
      console.log("❌ External calendar is disabled");
      return NextResponse.json({
        events: [],
        lastSync: null,
        totalCount: 0,
        message: 'External calendar is disabled'
      });
    }

    // Get vendor profile with encrypted calendar URL
    const { data: vendorProfile, error: profileError } = await supabase
      .from('vendor_profiles')
      .select('external_calendar_url')
      .eq('user_id', user.id)
      .single();

    if (profileError || !vendorProfile) {
      console.log("❌ Vendor profile error:", profileError);
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    console.log("✅ Vendor profile found, has calendar URL:", !!vendorProfile.external_calendar_url);

    if (!vendorProfile.external_calendar_url) {
      console.log("❌ No external calendar URL found");
      return NextResponse.json({
        events: [],
        lastSync: null,
        totalCount: 0,
        message: 'No external calendar connected'
      });
    }

    // Decrypt the calendar URL
    let decryptedUrl: string;
    try {
      decryptedUrl = decryptCalendarUrl(vendorProfile.external_calendar_url);
      console.log("✅ Calendar URL decrypted successfully");
    } catch (error) {
      console.error('❌ Error decrypting calendar URL:', error);
      return NextResponse.json(
        { error: 'Calendar URL corrupted' },
        { status: 500 }
      );
    }

    // Fetch external events using the calendar service with privacy controls
    const startDateTime = new Date(dateValidation.data.startDate);
    const endDateTime = new Date(dateValidation.data.endDate);
    
    console.log("📅 Fetching events for range:", startDateTime.toISOString(), "to", endDateTime.toISOString());
    
    const events = await parseCalendarEvents(
      decryptedUrl,
      startDateTime,
      endDateTime,
      privacySettings
    );

    console.log("✅ Parsed events:", events.length, "events found");

    // Log the request for audit purposes
    logCalendarEventsFetch(
      user.id,
      decryptedUrl,
      events.length,
      {
        start: dateValidation.data.startDate,
        end: dateValidation.data.endDate,
      },
      {
        showEventDetails: privacySettings.showEventDetails,
        externalCalendarEnabled: privacySettings.externalCalendarEnabled,
      }
    );
    
    return NextResponse.json({
      events,
      lastSync: new Date().toISOString(),
      totalCount: events.length,
      privacySettings: {
        showEventDetails: privacySettings.showEventDetails,
        externalCalendarEnabled: privacySettings.externalCalendarEnabled,
      },
    });

  } catch (error) {
    console.error('❌ External events API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
