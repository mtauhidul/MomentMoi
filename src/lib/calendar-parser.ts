/**
 * Calendar Parser for iCal Format
 * Handles parsing of iCal (.ics) files and calendar URLs
 */

export interface ParsedEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  isAllDay: boolean;
}

export interface CalendarParseResult {
  events: ParsedEvent[];
  success: boolean;
  error?: string;
}

/**
 * Basic iCal parser - extracts events from iCal format
 * This is a simplified implementation for MVP
 */
export function parseICalContent(icalContent: string): ParsedEvent[] {
  console.log('🔍 Parsing iCal content...');
  const events: ParsedEvent[] = [];
  const lines = icalContent.split('\n');
  
  console.log('📄 iCal content has', lines.length, 'lines');
  
  let currentEvent: Partial<ParsedEvent> = {};
  let inEvent = false;
  let eventCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      eventCount++;
      console.log('📅 Starting event', eventCount);
    } else if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.title && currentEvent.start && currentEvent.end) {
        events.push({
          id: currentEvent.id || `event-${Date.now()}-${Math.random()}`,
          title: currentEvent.title,
          start: currentEvent.start,
          end: currentEvent.end,
          description: currentEvent.description,
          location: currentEvent.location,
          isAllDay: currentEvent.isAllDay || false,
        });
        console.log('✅ Added event:', currentEvent.title, 'at', currentEvent.start);
      } else {
        console.log('❌ Skipped incomplete event:', currentEvent);
      }
      inEvent = false;
      currentEvent = {};
    } else if (inEvent) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      switch (key) {
        case 'UID':
          currentEvent.id = value;
          break;
        case 'SUMMARY':
          currentEvent.title = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'DTSTART':
          currentEvent.start = parseICalDate(value);
          break;
        case 'DTEND':
          currentEvent.end = parseICalDate(value);
          break;
        case 'DTSTART;VALUE=DATE':
          currentEvent.start = parseICalDate(value);
          currentEvent.isAllDay = true;
          break;
        case 'DTEND;VALUE=DATE':
          currentEvent.end = parseICalDate(value);
          break;
      }
    }
  }
  
  console.log('✅ Parsed', events.length, 'valid events out of', eventCount, 'total events');
  return events;
}

/**
 * Parse iCal date format
 */
function parseICalDate(dateString: string): Date {
  // Handle different iCal date formats
  if (dateString.includes('T')) {
    // DateTime format: 20231201T120000Z or 20231201T120000
    const cleanDate = dateString.replace(/[TZ]/g, ' ').trim();
    return new Date(cleanDate);
  } else {
    // Date format: 20231201
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateString.substring(6, 8));
    return new Date(year, month, day);
  }
}

/**
 * Fetch and parse calendar from URL
 */
export async function fetchAndParseCalendar(url: string): Promise<CalendarParseResult> {
  try {
    console.log('🔍 Fetching calendar from URL...');
    const response = await fetch(url);
    
    console.log('📡 Calendar fetch response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ Calendar fetch failed:', response.status, response.statusText);
      return {
        events: [],
        success: false,
        error: `Failed to fetch calendar: ${response.status} ${response.statusText}`
      };
    }
    
    console.log('✅ Calendar fetch successful, parsing content...');
    const content = await response.text();
    console.log('📄 Calendar content length:', content.length, 'characters');
    
    const events = parseICalContent(content);
    console.log('✅ Parsed', events.length, 'events from calendar content');
    
    return {
      events,
      success: true
    };
  } catch (error) {
    console.error('❌ Calendar fetch/parse error:', error instanceof Error ? error.message : 'Unknown error');
    return {
      events: [],
      success: false,
      error: `Error fetching calendar: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(
  events: ParsedEvent[], 
  startDate: Date, 
  endDate: Date
): ParsedEvent[] {
  console.log('🔍 Filtering', events.length, 'events by date range:', startDate.toISOString(), 'to', endDate.toISOString());
  
  const filteredEvents = events.filter(event => {
    const isInRange = event.start >= startDate && event.start <= endDate;
    if (isInRange) {
      console.log('✅ Event in range:', event.title, 'at', event.start.toISOString());
    } else {
      console.log('❌ Event out of range:', event.title, 'at', event.start.toISOString());
    }
    return isInRange;
  });
  
  console.log('✅ Filtered to', filteredEvents.length, 'events in date range');
  return filteredEvents;
}

/**
 * Convert parsed events to external event format
 */
export function convertToExternalEvents(parsedEvents: ParsedEvent[]) {
  return parsedEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    description: event.description,
    location: event.location,
    isExternal: true as const,
  }));
}
