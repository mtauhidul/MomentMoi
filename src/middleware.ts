import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/event']
  const authRoutes = ['/auth/login', '/auth/register', '/auth/reset-password']

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes
  if (user && isAuthRoute) {
    // Get user profile to determine appropriate dashboard
    try {
      // Optimized query: only fetch necessary fields and add error handling
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Middleware profile fetch error:', error.code, error.message)

        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, redirect to onboarding
          console.log('Profile not found, redirecting to onboarding')
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        // For other errors, fallback to dashboard
        console.error('Profile fetch failed, falling back to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // If profile exists and user is onboarded, redirect to appropriate dashboard
      if (profile && profile.onboarding_completed) {
        const dashboardUrl = '/dashboard' // All user types use the same dashboard route now
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      } else {
        // User not onboarded, redirect to onboarding
        console.log('User not onboarded, redirecting to onboarding')
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } catch (error) {
      console.error('Unexpected error in middleware profile fetch:', error)
      // Fallback to dashboard if unexpected error occurs
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
