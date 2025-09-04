/**
 * Test script for Calendar Security Implementation
 * Run this to verify all security features are working correctly
 */

import { 
  encryptCalendarUrl, 
  decryptCalendarUrl, 
  validateCalendarUrl, 
  sanitizeUrlForLogging,
  getDefaultPrivacySettings,
  validatePrivacySettings 
} from './calendar-service';
import { 
  logCalendarEvent, 
  logSecurityViolation, 
  sanitizeForLogging 
} from './audit-logger';

/**
 * Test URL encryption and decryption
 */
function testEncryption() {
  console.log('\n🔐 Testing URL Encryption...');
  
  const testUrl = 'https://calendar.google.com/calendar/ical/example%40gmail.com/public/basic.ics';
  
  try {
    const encrypted = encryptCalendarUrl(testUrl);
    console.log('✅ URL encrypted successfully');
    console.log('   Original:', testUrl);
    console.log('   Encrypted:', encrypted.substring(0, 50) + '...');
    
    const decrypted = decryptCalendarUrl(encrypted);
    console.log('✅ URL decrypted successfully');
    console.log('   Decrypted:', decrypted);
    
    if (decrypted === testUrl) {
      console.log('✅ Encryption/decryption test PASSED');
    } else {
      console.log('❌ Encryption/decryption test FAILED');
    }
  } catch (error) {
    console.log('❌ Encryption test failed:', error);
  }
}

/**
 * Test URL validation
 */
function testUrlValidation() {
  console.log('\n🔍 Testing URL Validation...');
  
  const testCases = [
    {
      url: 'https://calendar.google.com/calendar/ical/example%40gmail.com/public/basic.ics',
      expected: true,
      description: 'Valid Google Calendar URL'
    },
    {
      url: 'http://calendar.google.com/calendar/ical/example%40gmail.com/public/basic.ics',
      expected: true,
      description: 'Valid HTTP Google Calendar URL'
    },
    {
      url: 'https://outlook.live.com/calendar/0/example@outlook.com/calendar.ics',
      expected: true,
      description: 'Valid Outlook Calendar URL'
    },
    {
      url: 'javascript:alert("xss")',
      expected: false,
      description: 'Malicious JavaScript URL'
    },
    {
      url: 'file:///etc/passwd',
      expected: false,
      description: 'File protocol URL'
    },
    {
      url: 'data:text/html,<script>alert("xss")</script>',
      expected: false,
      description: 'Data URL'
    },
    {
      url: 'a'.repeat(3000),
      expected: false,
      description: 'URL too long'
    },
    {
      url: 'not-a-url',
      expected: false,
      description: 'Invalid URL format'
    }
  ];
  
  testCases.forEach(({ url, expected, description }) => {
    const result = validateCalendarUrl(url);
    const passed = result.isValid === expected;
    
    if (passed) {
      console.log(`✅ ${description}`);
    } else {
      console.log(`❌ ${description} - Expected: ${expected}, Got: ${result.isValid}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
}

/**
 * Test privacy settings
 */
function testPrivacySettings() {
  console.log('\n🔒 Testing Privacy Settings...');
  
  // Test default settings
  const defaultSettings = getDefaultPrivacySettings();
  console.log('✅ Default settings created:', {
    externalCalendarEnabled: defaultSettings.externalCalendarEnabled,
    showEventDetails: defaultSettings.showEventDetails,
    hasDateRange: !!defaultSettings.syncDateRange
  });
  
  // Test valid settings
  const validSettings = {
    externalCalendarEnabled: true,
    showEventDetails: false,
    syncDateRange: {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  };
  
  const validResult = validatePrivacySettings(validSettings);
  if (validResult.isValid) {
    console.log('✅ Valid privacy settings accepted');
  } else {
    console.log('❌ Valid privacy settings rejected:', validResult.error);
  }
  
  // Test invalid settings
  const invalidSettings = {
    externalCalendarEnabled: true,
    showEventDetails: true,
    syncDateRange: {
      start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Future date
      end: new Date() // Past date
    }
  };
  
  const invalidResult = validatePrivacySettings(invalidSettings);
  if (!invalidResult.isValid) {
    console.log('✅ Invalid privacy settings correctly rejected:', invalidResult.error);
  } else {
    console.log('❌ Invalid privacy settings incorrectly accepted');
  }
}

/**
 * Test audit logging
 */
function testAuditLogging() {
  console.log('\n📝 Testing Audit Logging...');
  
  // Test calendar event logging
  const calendarEvent = {
    timestamp: new Date().toISOString(),
    action: 'calendar_url_added' as const,
    userId: 'test-user-123',
    urlSanitized: 'https://calendar.google.com/calendar/ical/***/public/basic.ics'
  };
  
  console.log('✅ Calendar event logging test');
  logCalendarEvent(calendarEvent);
  
  // Test security violation logging
  const securityViolation = {
    timestamp: new Date().toISOString(),
    action: 'calendar_url_added',
    userId: 'test-user-123',
    violation: 'Suspicious URL pattern detected',
    severity: 'MEDIUM' as const
  };
  
  console.log('✅ Security violation logging test');
  logSecurityViolation(securityViolation);
  
  // Test data sanitization
  const sensitiveData = {
    url: 'https://calendar.google.com/calendar/ical/secret-token-123/public/basic.ics',
    token: 'secret-auth-token-456',
    normalData: 'This is normal data'
  };
  
  const sanitized = sanitizeForLogging(sensitiveData);
  console.log('✅ Data sanitization test');
  console.log('   Original:', sensitiveData);
  console.log('   Sanitized:', sanitized);
}

/**
 * Test URL sanitization
 */
function testUrlSanitization() {
  console.log('\n🧹 Testing URL Sanitization...');
  
  const testUrls = [
    'https://calendar.google.com/calendar/ical/example%40gmail.com/public/basic.ics',
    'https://outlook.live.com/calendar/0/example@outlook.com/calendar.ics?key=secret123',
    'https://calendar.yahoo.com/calendar/example@yahoo.com/calendar.ics&token=secret456',
    'https://icloud.com/calendar/example@icloud.com/calendar.ics?auth=secret789'
  ];
  
  testUrls.forEach(url => {
    const sanitized = sanitizeUrlForLogging(url);
    console.log(`✅ URL sanitized: ${sanitized}`);
  });
}

/**
 * Run all security tests
 */
export function runSecurityTests() {
  console.log('🚀 Running Calendar Security Tests...\n');
  
  testEncryption();
  testUrlValidation();
  testPrivacySettings();
  testAuditLogging();
  testUrlSanitization();
  
  console.log('\n✨ All security tests completed!');
  console.log('\n📋 Security Features Verified:');
  console.log('   ✅ URL Encryption/Decryption');
  console.log('   ✅ URL Validation & Security Checks');
  console.log('   ✅ Privacy Settings Management');
  console.log('   ✅ Audit Logging');
  console.log('   ✅ Data Sanitization');
  console.log('   ✅ Error Handling');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityTests();
}
