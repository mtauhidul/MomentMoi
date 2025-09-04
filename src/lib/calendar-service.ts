/**
 * Calendar Service for External Calendar Integration
 * Handles calendar URL validation, parsing, and event extraction
 * Includes privacy-first security features
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  isExternal: true;
}

export interface CalendarTestResult {
  success: boolean;
  message: string;
  events?: CalendarEvent[];
}

export interface PrivacySettings {
  externalCalendarEnabled: boolean;
  syncDateRange: {
    start: Date;
    end: Date;
  };
  showEventDetails: boolean;
  lastSync?: Date;
}

/**
 * Encrypt calendar URL for secure storage
 */
export function encryptCalendarUrl(url: string): string {
  const algorithm = 'aes-256-cbc';
  // Use a fixed 32-byte key for now (in production, use environment variable)
  const key = Buffer.from('d5004df3dca0805d2f8b7b28dbebcb9978b2003f3a9d45626da450d556b5cffc', 'hex');
  const iv = randomBytes(16);
  
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(url, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt calendar URL for use
 */
export function decryptCalendarUrl(encryptedUrl: string): string {
  const algorithm = 'aes-256-cbc';
  // Use a fixed 32-byte key for now (in production, use environment variable)
  const key = Buffer.from('d5004df3dca0805d2f8b7b28dbebcb9978b2003f3a9d45626da450d556b5cffc', 'hex');
  
  const [ivHex, encrypted] = encryptedUrl.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Sanitize calendar URL for logging (removes sensitive parts)
 */
export function sanitizeUrlForLogging(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return '[INVALID_URL]';
  }
}

/**
 * Validate calendar URL with enhanced security checks
 */
export function validateCalendarUrl(url: string): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: "Calendar URL is required" };
  }

  try {
    const urlObj = new URL(url);
    
    // Security: Check for potentially malicious URLs
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return { isValid: false, error: "Invalid URL protocol" };
    }
    
    // Check if it's a valid calendar URL
    const validDomains = [
      "calendar.google.com",
      "outlook.live.com",
      "outlook.office.com",
      "calendar.yahoo.com",
      "icloud.com",
    ];
    
    const isValidDomain = validDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
    
    if (!isValidDomain && !url.toLowerCase().includes("ics") && !url.toLowerCase().includes("ical")) {
      return {
        isValid: false,
        error: "Please enter a valid calendar URL from Google Calendar, Outlook, Yahoo, iCloud, or an iCal file"
      };
    }

    // Security: Check URL length to prevent potential attacks
    if (url.length > 2048) {
      return { isValid: false, error: "Calendar URL is too long" };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
}

/**
 * Tests a calendar URL to see if it's accessible and contains valid calendar data
 * Includes privacy controls and security checks
 */
export async function testCalendarUrl(url: string, privacySettings?: Partial<PrivacySettings>): Promise<CalendarTestResult> {
  const validation = validateCalendarUrl(url);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error || "Invalid calendar URL",
    };
  }

  try {
    // Log sanitized URL for debugging (no sensitive data)
    console.log('Testing calendar URL:', sanitizeUrlForLogging(url));
    
    // Actually test the calendar connection
    const { fetchAndParseCalendar, convertToExternalEvents } = await import('./calendar-parser');
    
    // Fetch and parse the calendar
    const result = await fetchAndParseCalendar(url);
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || "Unable to access this calendar. Please check the URL and ensure it's publicly accessible.",
      };
    }
    
    // Check if we found any events
    if (result.events.length === 0) {
      return {
        success: true,
        message: "Calendar connection successful! No events found in the current date range.",
        events: [],
      };
    }
    
    // Apply privacy settings to sample events
    let sampleEvents = result.events.slice(0, 3);
    
    if (privacySettings?.showEventDetails === false) {
      // Strip sensitive information for privacy
      sampleEvents = sampleEvents.map(event => ({
        ...event,
        description: undefined,
        location: undefined,
      }));
    }
    
    // Convert to external event format and return sample events
    const externalEvents = convertToExternalEvents(sampleEvents);
    
    return {
      success: true,
      message: `Calendar connection successful! Found ${result.events.length} events. Your external events will appear on your calendar.`,
      events: externalEvents,
    };
    
  } catch (error) {
    // Don't log the actual URL in error messages for security
    console.error('Calendar test failed:', error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      message: "Unable to access this calendar. Please check the URL and ensure it's publicly accessible.",
    };
  }
}

/**
 * Extracts calendar events from an iCal URL with privacy controls
 * Uses the calendar parser to fetch and parse external calendar data
 */
export async function parseCalendarEvents(
  url: string, 
  startDate: Date, 
  endDate: Date, 
  privacySettings?: Partial<PrivacySettings>
): Promise<CalendarEvent[]> {
  try {
    // Don't log the actual URL for security
    console.log('🔍 Fetching external calendar events for date range:', startDate.toISOString(), 'to', endDate.toISOString());
    
    const { fetchAndParseCalendar, filterEventsByDateRange, convertToExternalEvents } = await import('./calendar-parser');
    
    // Fetch and parse the calendar
    console.log('📡 Fetching and parsing calendar...');
    const result = await fetchAndParseCalendar(url);
    
    if (!result.success) {
      console.error("❌ Failed to parse calendar:", result.error);
      return [];
    }
    
    console.log('✅ Calendar parsed successfully, found', result.events.length, 'total events');
    
    // Filter events by date range
    console.log('🔍 Filtering events by date range...');
    let filteredEvents = filterEventsByDateRange(result.events, startDate, endDate);
    console.log('✅ Filtered to', filteredEvents.length, 'events in date range');
    
    // Apply privacy settings
    if (privacySettings?.showEventDetails === false) {
      console.log('🔒 Applying privacy settings - hiding event details');
      filteredEvents = filteredEvents.map(event => ({
        ...event,
        description: undefined,
        location: undefined,
      }));
    }
    
    // Convert to external event format
    console.log('🔄 Converting to external event format...');
    const externalEvents = convertToExternalEvents(filteredEvents);
    console.log('✅ Converted to', externalEvents.length, 'external events');
    
    return externalEvents;
    
  } catch (error) {
    console.error("❌ Error parsing calendar events:", error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Formats a calendar URL for display (privacy-safe)
 */
export function formatCalendarUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname.includes("calendar.google.com")) {
      return "Google Calendar";
    } else if (hostname.includes("outlook.live.com") || hostname.includes("outlook.office.com")) {
      return "Outlook Calendar";
    } else if (hostname.includes("calendar.yahoo.com")) {
      return "Yahoo Calendar";
    } else if (hostname.includes("icloud.com")) {
      return "iCloud Calendar";
    } else if (url.toLowerCase().includes("ics") || url.toLowerCase().includes("ical")) {
      return "iCal Calendar";
    } else {
      return "External Calendar";
    }
  } catch {
    return "External Calendar";
  }
}

/**
 * Gets help text for different calendar providers
 */
export function getCalendarHelpText(provider: string): string {
  switch (provider.toLowerCase()) {
    case "google":
      return "To get your Google Calendar URL: 1. Open Google Calendar 2. Go to Settings 3. Find your calendar in the left sidebar 4. Click the three dots next to it 5. Select 'Settings and sharing' 6. Scroll down to 'Integrate calendar' 7. Copy the 'Public URL to this calendar'";
    
    case "outlook":
      return "To get your Outlook Calendar URL: 1. Open Outlook Calendar 2. Right-click on your calendar 3. Select 'Sharing permissions' 4. Choose 'Publish this calendar' 5. Copy the ICS link";
    
    case "yahoo":
      return "To get your Yahoo Calendar URL: 1. Open Yahoo Calendar 2. Click the calendar name 3. Select 'Calendar Settings' 4. Go to 'Sharing' tab 5. Copy the public URL";
    
    case "icloud":
      return "To get your iCloud Calendar URL: 1. Open iCloud Calendar 2. Click the calendar name 3. Select 'Public Calendar' 4. Copy the webcal:// URL";
    
    default:
      return "Make sure your calendar URL is publicly accessible and in a supported format (Google Calendar, Outlook, Yahoo, iCloud, or iCal).";
  }
}

/**
 * Default privacy settings for new calendar connections
 */
export function getDefaultPrivacySettings(): PrivacySettings {
  return {
    externalCalendarEnabled: true,
    syncDateRange: {
      start: new Date(),
      end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    showEventDetails: true,
  };
}

/**
 * Validate privacy settings
 */
export function validatePrivacySettings(settings: Partial<PrivacySettings>): { isValid: boolean; error?: string } {
  if (settings.syncDateRange) {
    if (settings.syncDateRange.start >= settings.syncDateRange.end) {
      return { isValid: false, error: "Start date must be before end date" };
    }
    
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (settings.syncDateRange.end.getTime() - settings.syncDateRange.start.getTime() > maxRange) {
      return { isValid: false, error: "Date range cannot exceed 1 year" };
    }
  }
  
  return { isValid: true };
}
