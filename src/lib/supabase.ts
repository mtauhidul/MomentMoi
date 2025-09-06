import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a singleton instance to prevent multiple clients
let _supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Client-side Supabase client (for use in client components)
export const createClientComponentClient = () => {
  // Check if we're in a build environment without environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // During build/SSR, return a mock client to prevent errors
      console.warn('Supabase environment variables not available during build');
      return null as any;
    } else {
      // In browser, show a more helpful error message
      console.error('Supabase configuration missing. Please check Vercel environment variables:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL');
      console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      // Return null instead of throwing to prevent app crashes
      return null as any;
    }
  }

  if (!_supabaseClient) {
    _supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
}
