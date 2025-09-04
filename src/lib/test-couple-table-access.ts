import { createClientComponentClient } from './supabase';

export async function testCoupleTableAccess() {
  const supabase = createClientComponentClient();
  
  try {
    console.log('Testing couple_profiles table access...');
    
    // Test 1: Check if table exists by trying to select from it
    const { data: selectData, error: selectError } = await supabase
      .from('couple_profiles')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('Error selecting from couple_profiles:', selectError);
      return {
        success: false,
        error: selectError.message,
        tableExists: false
      };
    }
    
    console.log('✅ couple_profiles table exists and is accessible');
    
    // Test 2: Check table structure
    const { data: structureData, error: structureError } = await supabase
      .from('couple_profiles')
      .select('id, user_id, partner_id, partner_name, partner_email, created_at, updated_at')
      .limit(0);
    
    if (structureError) {
      console.error('Error checking table structure:', structureError);
      return {
        success: false,
        error: structureError.message,
        tableExists: true,
        structureValid: false
      };
    }
    
    console.log('✅ couple_profiles table structure is valid');
    
    // Test 3: Try to insert a test record (will be rolled back)
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    const { data: insertData, error: insertError } = await supabase
      .from('couple_profiles')
      .insert({
        user_id: testUserId,
        partner_name: 'Test Partner',
        partner_email: 'test@example.com'
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
      return {
        success: false,
        error: insertError.message,
        tableExists: true,
        structureValid: true,
        insertPermission: false
      };
    }
    
    console.log('✅ couple_profiles table allows inserts');
    
    // Test 4: Try to update a test record
    const { data: updateData, error: updateError } = await supabase
      .from('couple_profiles')
      .update({
        partner_name: 'Updated Test Partner'
      })
      .eq('user_id', testUserId)
      .select();
    
    if (updateError) {
      console.error('Error updating test record:', updateError);
      return {
        success: false,
        error: updateError.message,
        tableExists: true,
        structureValid: true,
        insertPermission: true,
        updatePermission: false
      };
    }
    
    console.log('✅ couple_profiles table allows updates');
    
    // Clean up test data
    await supabase
      .from('couple_profiles')
      .delete()
      .eq('user_id', testUserId);
    
    console.log('✅ Test cleanup completed');
    
    return {
      success: true,
      tableExists: true,
      structureValid: true,
      insertPermission: true,
      updatePermission: true,
      message: 'All couple_profiles table tests passed'
    };
    
  } catch (error) {
    console.error('Exception during couple_profiles table test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tableExists: false
    };
  }
}
