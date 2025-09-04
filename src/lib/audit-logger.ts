/**
 * Audit Logger for Calendar Security Events
 * Centralized logging for privacy and security compliance
 */

export interface AuditEvent {
  timestamp: string;
  action: string;
  userId: string;
  resource?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CalendarAuditEvent extends AuditEvent {
  action: 'calendar_url_added' | 'calendar_url_updated' | 'calendar_url_removed' | 'calendar_events_fetched' | 'privacy_settings_updated';
  urlSanitized?: string;
  eventCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  privacySettings?: {
    showEventDetails: boolean;
    externalCalendarEnabled: boolean;
  };
}

/**
 * Log calendar-related security events
 */
export function logCalendarEvent(event: CalendarAuditEvent): void {
  // In production, this would send to a proper audit log service
  // For now, we'll use structured console logging
  const logEntry = {
    ...event,
    severity: 'INFO',
    category: 'CALENDAR_SECURITY',
  };

  console.log('AUDIT_LOG:', JSON.stringify(logEntry, null, 2));

  // TODO: In production, send to:
  // - Structured logging service (e.g., DataDog, Splunk)
  // - Security monitoring system
  // - Compliance reporting system
}

/**
 * Log security violations or suspicious activities
 */
export function logSecurityViolation(event: AuditEvent & { violation: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }): void {
  const logEntry = {
    ...event,
    severity: event.severity,
    category: 'SECURITY_VIOLATION',
    violation: event.violation,
  };

  console.error('SECURITY_VIOLATION:', JSON.stringify(logEntry, null, 2));

  // TODO: In production, send to:
  // - Security incident response system
  // - Alerting system for high severity violations
  // - Compliance reporting system
}

/**
 * Log privacy-related events
 */
export function logPrivacyEvent(event: AuditEvent & { privacyAction: string; dataType: string }): void {
  const logEntry = {
    ...event,
    severity: 'INFO',
    category: 'PRIVACY',
    privacyAction: event.privacyAction,
    dataType: event.dataType,
  };

  console.log('PRIVACY_LOG:', JSON.stringify(logEntry, null, 2));

  // TODO: In production, send to:
  // - Privacy compliance system
  // - GDPR compliance reporting
  // - Data protection officer notifications
}

/**
 * Sanitize sensitive data for logging
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data === 'string') {
    // Remove potential sensitive information from URLs
    return data.replace(/[?&](key|token|auth|password)=[^&]*/gi, '$1=***');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase().includes('url') || key.toLowerCase().includes('token') || key.toLowerCase().includes('key')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Create audit trail for calendar operations
 */
export function createCalendarAuditTrail(
  action: CalendarAuditEvent['action'],
  userId: string,
  details?: Partial<CalendarAuditEvent>
): CalendarAuditEvent {
  return {
    timestamp: new Date().toISOString(),
    action,
    userId,
    ...details,
  };
}

/**
 * Log calendar URL operations
 */
export function logCalendarUrlOperation(
  action: 'calendar_url_added' | 'calendar_url_updated' | 'calendar_url_removed',
  userId: string,
  url?: string
): void {
  const event = createCalendarAuditTrail(action, userId, {
    urlSanitized: url ? sanitizeForLogging(url) : undefined,
  });
  
  logCalendarEvent(event);
}

/**
 * Log calendar events fetch operation
 */
export function logCalendarEventsFetch(
  userId: string,
  url: string,
  eventCount: number,
  dateRange: { start: string; end: string },
  privacySettings?: { showEventDetails: boolean; externalCalendarEnabled: boolean }
): void {
  const event = createCalendarAuditTrail('calendar_events_fetched', userId, {
    urlSanitized: sanitizeForLogging(url),
    eventCount,
    dateRange,
    privacySettings,
  });
  
  logCalendarEvent(event);
}

/**
 * Log privacy settings updates
 */
export function logPrivacySettingsUpdate(
  userId: string,
  settings: { showEventDetails: boolean; externalCalendarEnabled: boolean }
): void {
  const event = createCalendarAuditTrail('privacy_settings_updated', userId, {
    privacySettings: settings,
  });
  
  logCalendarEvent(event);
}
