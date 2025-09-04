import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { encryptCalendarUrl, decryptCalendarUrl, validateCalendarUrl, sanitizeUrlForLogging, getDefaultPrivacySettings, validatePrivacySettings } from "@/lib/calendar-service";
import { logCalendarUrlOperation } from "@/lib/audit-logger";

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

    const { url, privacySettings } = await request.json();

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Calendar URL is required" },
        { status: 400 }
      );
    }

    // Enhanced URL validation with security checks
    const urlValidation = validateCalendarUrl(url);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      );
    }

    // Validate privacy settings if provided
    if (privacySettings) {
      const privacyValidation = validatePrivacySettings(privacySettings);
      if (!privacyValidation.isValid) {
        return NextResponse.json(
          { error: privacyValidation.error },
          { status: 400 }
        );
      }
    }

    // Encrypt the calendar URL for secure storage
    const encryptedUrl = encryptCalendarUrl(url);

    // Log the action for audit purposes
    logCalendarUrlOperation('calendar_url_updated', user.id, url);

    // Update the vendor profile with the encrypted calendar URL
    const { error: updateError } = await supabase
      .from("vendor_profiles")
      .update({ 
        external_calendar_url: encryptedUrl,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating vendor profile:", updateError);
      return NextResponse.json(
        { error: "Failed to save calendar URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Calendar URL saved successfully",
      lastSync: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Calendar link API error:", error instanceof Error ? error.message : 'Unknown error');
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
      .select("external_calendar_url, updated_at")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching vendor profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch calendar URL" },
        { status: 500 }
      );
    }

    // Decrypt the URL if it exists
    let decryptedUrl = null;
    let lastSync = null;
    
    if (profile?.external_calendar_url) {
      try {
        decryptedUrl = decryptCalendarUrl(profile.external_calendar_url);
        lastSync = profile.updated_at;
      } catch (error) {
        console.error("Error decrypting calendar URL:", error);
        // If decryption fails, treat as disconnected
        return NextResponse.json({
          url: null,
          status: "disconnected",
          error: "Calendar URL corrupted"
        });
      }
    }

    return NextResponse.json({
      url: decryptedUrl,
      status: decryptedUrl ? "connected" : "disconnected",
      lastSync,
    });

  } catch (error) {
    console.error("Calendar link GET API error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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

    // Log the action for audit purposes
    logCalendarUrlOperation('calendar_url_removed', user.id);

    // Remove the calendar URL
    const { error: updateError } = await supabase
      .from("vendor_profiles")
      .update({ 
        external_calendar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error removing calendar URL:", updateError);
      return NextResponse.json(
        { error: "Failed to remove calendar URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Calendar URL removed successfully",
    });

  } catch (error) {
    console.error("Calendar link DELETE API error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
