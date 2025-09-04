import { createClientComponentClient } from './supabase'
import type { Database } from '@/types/database'

export async function createUserProfile(userId: string, userData: {
  email: string
  full_name: string
  user_type: 'planner' | 'vendor' | 'viewer'
}) {
  const supabase = createClientComponentClient()
  
  try {
    console.log('Creating profile for user:', userId, 'with data:', userData)
    
    // Create profile with better error handling
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userData.email,
        full_name: userData.full_name,
        user_type: userData.user_type,
        onboarding_completed: false,
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('Profile creation error:', profileError)
      console.error('Error details:', JSON.stringify(profileError, null, 2))
      
      // If it's a unique violation, the profile might already exist
      if (profileError.code === '23505') {
        console.log('Profile already exists, attempting to update...')
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: userData.email,
            full_name: userData.full_name,
            user_type: userData.user_type,
          })
          .eq('id', userId)
        
        if (updateError) {
          console.error('Profile update error:', updateError)
          return { success: false, error: updateError }
        }
        
        return { success: true, data: profileData }
      }
      
      return { success: false, error: profileError }
    }
    
    console.log('Profile created successfully:', profileData)
    
    // Create role-specific profile
    if (userData.user_type === 'planner') {
      console.log('Creating planner profile...')
      const { error: plannerError } = await supabase
        .from('couple_profiles')
        .insert({
          user_id: userId,
        })
      
      if (plannerError) {
        console.error('Planner profile creation error:', plannerError)
        return { success: false, error: plannerError }
      }
      console.log('Planner profile created successfully')
    } else if (userData.user_type === 'vendor') {
      // Vendor profiles will be created during onboarding
      // We don't create them here since they need the onboarding form data
      console.log('Vendor profile will be created during onboarding')
    } else if (userData.user_type === 'viewer') {
      // Viewers don't need additional profile tables - they just use the main profiles table
      // They can favorite vendors without needing extra profile data
      console.log('Viewer profile created successfully')
    }
    
    return { success: true, data: profileData }
    
  } catch (error) {
    console.error('Profile creation failed:', error)
    return { success: false, error }
  }
}

export async function getUserProfile(userId: string) {
  const supabase = createClientComponentClient()
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Profile fetch error:', error)
      return { success: false, error }
    }
    
    return { success: true, data }
    
  } catch (error) {
    console.error('Profile fetch failed:', error)
    return { success: false, error }
  }
}
