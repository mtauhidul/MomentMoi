import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Check if vendor_profiles table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('vendor_profiles')
      .select('count')
      .limit(1);

    // Get user profile
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get vendor profile
    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      debug: {
        userType: userProfile?.user_type || 'unknown',
        hasUserProfile: !!userProfile,
        hasVendorProfile: !!vendorProfile,
        onboardingCompleted: userProfile?.onboarding_completed || false,
        userProfileError: userProfileError?.message,
        vendorProfileError: vendorProfileError?.message,
      },
      vendorProfile: vendorProfile ? {
        id: vendorProfile.id,
        business_name: vendorProfile.business_name,
        external_calendar_url: vendorProfile.external_calendar_url ? '[ENCRYPTED]' : null,
        has_calendar_url: !!vendorProfile.external_calendar_url,
      } : null,
      tableExists: !tableError,
      tableError: tableError?.message,
    });

  } catch (error) {
    console.error("Debug vendor profile API error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
