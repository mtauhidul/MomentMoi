import { createClientComponentClient } from './supabase';

export async function testCoupleFields() {
  const supabase = createClientComponentClient();
  
  try {
    // Try to query the couple_profiles table to see if it exists
    const { data: coupleData, error: coupleError } = await supabase
      .from('couple_profiles')
      .select('partner_name, partner_email')
      .limit(1);
    
        if (coupleError) {
      console.error('Couple profiles table test error:', coupleError);
      return {
        success: false,
        error: coupleError.message,
        fieldsExist: false
      };
    }

    // Try to query the events table to see if it exists
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('event_type, event_date, location, guest_count, event_style, budget_range, planning_stage')
      .limit(1);
    
    if (eventsError) {
      console.error('Events table test error:', eventsError);
      return {
        success: false,
        error: eventsError.message,
        fieldsExist: false
      };
    }
    
    console.log('Database fields test successful:', { coupleData, eventsData });
    return {
      success: true,
      fieldsExist: true,
      data: { coupleData, eventsData }
    };
  } catch (error) {
    console.error('Database fields test exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fieldsExist: false
    };
  }
}

// Keep the old function name for backward compatibility
export const testPlannerFields = testCoupleFields;
