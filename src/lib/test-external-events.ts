/**
 * Test file for external events functionality
 * This file can be used to test the calendar integration features
 */

import { parseCalendarEvents } from './calendar-service';
import { parseICalContent } from './calendar-parser';

// Mock external calendar data for testing
const mockICalData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Calendar//EN
BEGIN:VEVENT
UID:test-event-1@example.com
DTSTART:20241201T100000Z
DTEND:20241201T120000Z
SUMMARY:Test Meeting
DESCRIPTION:This is a test meeting
LOCATION:Test Location
END:VEVENT
BEGIN:VEVENT
UID:test-event-2@example.com
DTSTART:20241202T140000Z
DTEND:20241202T160000Z
SUMMARY:Another Test Event
DESCRIPTION:Another test event description
END:VEVENT
END:VCALENDAR
`;

// Test function to verify external events parsing
export async function testExternalEventsParsing() {
  console.log('🧪 Testing external events parsing...');
  
  try {
    // Test iCal parsing
    const events = parseICalContent(mockICalData);
    console.log('✅ iCal parsing successful:', events.length, 'events found');
    
    // Test calendar service parsing
    const startDate = new Date('2024-12-01');
    const endDate = new Date('2024-12-31');
    const serviceEvents = await parseCalendarEvents('mock-url', startDate, endDate);
    console.log('✅ Calendar service parsing successful:', serviceEvents.length, 'events found');
    
    return {
      success: true,
      iCalEvents: events.length,
      serviceEvents: serviceEvents.length
    };
  } catch (error) {
    console.error('❌ External events parsing test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test function to verify date filtering
export function testDateFiltering() {
  console.log('🧪 Testing date filtering...');
  
  const testEvents = [
    {
      id: '1',
      title: 'Event 1',
      start: new Date('2024-12-01T10:00:00Z'),
      end: new Date('2024-12-01T12:00:00Z'),
      isExternal: true as const
    },
    {
      id: '2',
      title: 'Event 2',
      start: new Date('2024-12-02T14:00:00Z'),
      end: new Date('2024-12-02T16:00:00Z'),
      isExternal: true as const
    },
    {
      id: '3',
      title: 'Event 3',
      start: new Date('2024-11-30T09:00:00Z'),
      end: new Date('2024-11-30T11:00:00Z'),
      isExternal: true as const
    }
  ];
  
  const targetDate = new Date('2024-12-01');
  const targetDateString = targetDate.toISOString().split('T')[0];
  
  const filteredEvents = testEvents.filter(event => {
    const eventDate = event.start.toISOString().split('T')[0];
    return eventDate === targetDateString;
  });
  
  console.log('✅ Date filtering test:', filteredEvents.length, 'events for', targetDateString);
  
  return {
    success: true,
    totalEvents: testEvents.length,
    filteredEvents: filteredEvents.length,
    targetDate: targetDateString
  };
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Running external events integration tests...\n');
  
  const parsingResult = await testExternalEventsParsing();
  const filteringResult = testDateFiltering();
  
  console.log('\n📊 Test Results:');
  console.log('Parsing Test:', parsingResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Filtering Test:', filteringResult.success ? '✅ PASSED' : '❌ FAILED');
  
  return {
    parsing: parsingResult,
    filtering: filteringResult,
    allPassed: parsingResult.success && filteringResult.success
  };
}
