import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { validatePrivacySettings, getDefaultPrivacySettings } from '@/lib/calendar-service';
import { logPrivacySettingsUpdate } from '@/lib/audit-logger';

// Validation schema for privacy settings
const privacySettingsSchema = z.object({
  externalCalendarEnabled: z.boolean(),
  showEventDetails: z.boolean(),
  syncDateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate privacy settings
    const validation = privacySettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid privacy settings", details: validation.error.issues },
        { status: 400 }
      );
    }

    const privacySettings = validation.data;

    // Convert date strings to Date objects for validation
    const privacySettingsForValidation = {
      ...privacySettings,
      syncDateRange: privacySettings.syncDateRange ? {
        start: new Date(privacySettings.syncDateRange.start),
        end: new Date(privacySettings.syncDateRange.end)
      } : undefined
    };

    // Additional validation using the calendar service
    const privacyValidation = validatePrivacySettings(privacySettingsForValidation);
    if (!privacyValidation.isValid) {
      return NextResponse.json(
        { error: privacyValidation.error },
        { status: 400 }
      );
    }

    // Log the action for audit purposes
    logPrivacySettingsUpdate(user.id, {
      showEventDetails: privacySettings.showEventDetails,
      externalCalendarEnabled: privacySettings.externalCalendarEnabled,
    });

    // Store privacy settings in vendor profile
    const { error: updateError } = await supabase
      .from("vendor_profiles")
      .update({ 
        privacy_settings: privacySettings,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating vendor profile:", updateError);
      return NextResponse.json(
        { error: "Failed to save privacy settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Privacy settings saved successfully",
      settings: privacySettings,
    });

  } catch (error) {
    console.error("Calendar privacy API error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the vendor profile
    const { data: profile, error: profileError } = await supabase
      .from("vendor_profiles")
      .select("external_calendar_url, privacy_settings, updated_at")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching vendor profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch privacy settings" },
        { status: 500 }
      );
    }

    // Return stored privacy settings or defaults
    const settings = profile?.privacy_settings || getDefaultPrivacySettings();
    
    return NextResponse.json({
      settings,
      hasCalendarConnected: !!profile?.external_calendar_url,
      lastUpdated: profile?.updated_at,
    });

  } catch (error) {
    console.error("Calendar privacy GET API error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
