import { createClientComponentClient } from './supabase'

export async function testProfileCreation(userId: string) {
  const supabase = createClientComponentClient()
  
  console.log('Testing profile creation for user:', userId)
  
  // First, check if profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  console.log('Existing profile check:', { existingProfile, checkError })
  
  if (existingProfile) {
    console.log('Profile already exists:', existingProfile)
    return { success: true, data: existingProfile }
  }
  
  // Try to create profile
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: 'test@example.com',
      full_name: 'Test User',
      user_type: 'viewer',
      onboarding_completed: false,
    })
    .select()
    .single()
  
  console.log('Profile creation result:', { newProfile, createError })
  
  if (createError) {
    console.error('Profile creation failed:', createError)
    console.error('Error details:', JSON.stringify(createError, null, 2))
  }
  
  return { success: !createError, data: newProfile, error: createError }
}
