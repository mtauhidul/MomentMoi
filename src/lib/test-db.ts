import { createClientComponentClient } from './supabase'

export async function testDatabaseConnection() {
  const supabase = createClientComponentClient()
  
  try {
    // Test basic connection
    console.log('Testing database connection...')
    
    // Test profiles table access
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('Profiles table error:', profilesError)
      return { success: false, error: profilesError }
    }
    
    console.log('Profiles table accessible:', profiles)
    
    console.log('Profiles table accessible:', profiles)
    
    return { success: true, data: { profiles } }
    
  } catch (error) {
    console.error('Database test failed:', error)
    return { success: false, error }
  }
}

export async function testUserRegistration(userData: {
  email: string
  password: string
  full_name: string
  user_type: 'couple' | 'vendor'
}) {
  const supabase = createClientComponentClient()
  
  try {
    console.log('Testing user registration...')
    
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          user_type: userData.user_type,
        },
      },
    })
    
    if (error) {
      console.error('Registration error:', error)
      return { success: false, error }
    }
    
    console.log('Registration successful:', data)
    
    // Test if profile was created
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        return { success: false, error: profileError }
      }
      
      console.log('Profile created:', profile)
      
      // Test role-specific profile
      if (userData.user_type === 'couple') {
        const { data: coupleProfile, error: coupleError } = await supabase
          .from('couple_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
        
        if (coupleError) {
          console.error('Couple profile error:', coupleError)
          return { success: false, error: coupleError }
        }
        
        console.log('Couple profile created:', coupleProfile)
      } else {
        const { data: vendorProfile, error: vendorError } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
        
        if (vendorError) {
          console.error('Vendor profile error:', vendorError)
          return { success: false, error: vendorError }
        }
        
        console.log('Vendor profile created:', vendorProfile)
      }
    }
    
    return { success: true, data }
    
  } catch (error) {
    console.error('Registration test failed:', error)
    return { success: false, error }
  }
}
