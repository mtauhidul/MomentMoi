import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton instance to prevent multiple clients
let _supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Client-side Supabase client (for use in client components)
export const createClientComponentClient = () => {
  if (!_supabaseClient) {
    _supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
}
