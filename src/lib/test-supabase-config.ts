export function testSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Supabase Configuration Test:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  
  if (!supabaseUrl) {
    return { success: false, error: 'NEXT_PUBLIC_SUPABASE_URL is not set' }
  }
  
  if (!supabaseAnonKey) {
    return { success: false, error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set' }
  }
  
  if (!supabaseUrl.startsWith('https://')) {
    return { success: false, error: 'NEXT_PUBLIC_SUPABASE_URL should start with https://' }
  }
  
  return { success: true }
}
