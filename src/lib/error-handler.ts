// Error handling utilities for the vendor dashboard

export interface DashboardError {
  type: 'network' | 'auth' | 'data' | 'validation' | 'permission' | 'unknown';
  message: string;
  userMessage: string;
  retryable: boolean;
  code?: string;
  details?: any;
}

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  vendorId?: string;
  timestamp: Date;
}

// Error categorization
export function categorizeError(error: any, context?: ErrorContext): DashboardError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || error?.status || error?.statusCode;
  
  // Network errors
  if (
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('fetch') ||
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.toLowerCase().includes('connection') ||
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'TIMEOUT' ||
    errorCode === 0 ||
    errorCode === 408 ||
    errorCode === 502 ||
    errorCode === 503 ||
    errorCode === 504
  ) {
    return {
      type: 'network',
      message: errorMessage,
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
      retryable: true,
      code: errorCode,
      details: { context }
    };
  }

  // Authentication errors
  if (
    errorMessage.toLowerCase().includes('auth') ||
    errorMessage.toLowerCase().includes('unauthorized') ||
    errorMessage.toLowerCase().includes('forbidden') ||
    errorMessage.toLowerCase().includes('token') ||
    errorMessage.toLowerCase().includes('session') ||
    errorCode === 'UNAUTHORIZED' ||
    errorCode === 'FORBIDDEN' ||
    errorCode === 401 ||
    errorCode === 403
  ) {
    return {
      type: 'auth',
      message: errorMessage,
      userMessage: 'Your session has expired. Please log in again to continue.',
      retryable: false,
      code: errorCode,
      details: { context }
    };
  }

  // Permission errors
  if (
    errorMessage.toLowerCase().includes('permission') ||
    errorMessage.toLowerCase().includes('access denied') ||
    errorMessage.toLowerCase().includes('not allowed') ||
    errorCode === 'PERMISSION_DENIED' ||
    errorCode === 403
  ) {
    return {
      type: 'permission',
      message: errorMessage,
      userMessage: 'You don\'t have permission to perform this action. Please contact support if you believe this is an error.',
      retryable: false,
      code: errorCode,
      details: { context }
    };
  }

  // Validation errors
  if (
    errorMessage.toLowerCase().includes('validation') ||
    errorMessage.toLowerCase().includes('invalid') ||
    errorMessage.toLowerCase().includes('required') ||
    errorMessage.toLowerCase().includes('format') ||
    errorCode === 'VALIDATION_ERROR' ||
    errorCode === 400
  ) {
    return {
      type: 'validation',
      message: errorMessage,
      userMessage: 'The provided data is invalid. Please check your input and try again.',
      retryable: true,
      code: errorCode,
      details: { context }
    };
  }

  // Database/Data errors
  if (
    errorMessage.toLowerCase().includes('database') ||
    errorMessage.toLowerCase().includes('query') ||
    errorMessage.toLowerCase().includes('sql') ||
    errorMessage.toLowerCase().includes('data') ||
    errorMessage.toLowerCase().includes('record') ||
    errorMessage.toLowerCase().includes('not found') ||
    errorCode === 'DATA_ERROR' ||
    errorCode === 404 ||
    errorCode === 500
  ) {
    return {
      type: 'data',
      message: errorMessage,
      userMessage: 'Unable to load or save data. Please try again or contact support if the problem persists.',
      retryable: true,
      code: errorCode,
      details: { context }
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    retryable: true,
    code: errorCode,
    details: { context }
  };
}

// Error logging
export function logError(error: DashboardError, context?: ErrorContext) {
  const logData = {
    ...error,
    context: context || {},
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Dashboard Error:', logData);
  }

  // Production error logging (TODO: Integrate with error tracking service)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    console.error('Production Error:', {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      timestamp: logData.timestamp,
      component: context?.component,
      action: context?.action
    });
  }
}

// Error recovery strategies
export function getErrorRecoveryStrategy(error: DashboardError): {
  action: 'retry' | 'redirect' | 'refresh' | 'contact_support' | 'none';
  delay?: number;
  maxRetries?: number;
} {
  switch (error.type) {
    case 'network':
      return {
        action: 'retry',
        delay: 2000, // 2 seconds
        maxRetries: 3
      };
    
    case 'auth':
      return {
        action: 'redirect',
        delay: 1000 // 1 second before redirect
      };
    
    case 'data':
      return {
        action: 'retry',
        delay: 1000,
        maxRetries: 2
      };
    
    case 'validation':
      return {
        action: 'retry',
        delay: 0,
        maxRetries: 1
      };
    
    case 'permission':
      return {
        action: 'contact_support'
      };
    
    case 'unknown':
    default:
      return {
        action: 'retry',
        delay: 3000,
        maxRetries: 1
      };
  }
}

// Error message formatting
export function formatErrorMessage(error: DashboardError, includeDetails = false): string {
  let message = error.userMessage;
  
  if (includeDetails && error.details?.context) {
    const context = error.details.context;
    message += ` (Component: ${context.component}, Action: ${context.action})`;
  }
  
  return message;
}

// Error boundary error handler
export function handleErrorBoundaryError(error: Error, errorInfo: React.ErrorInfo, context?: ErrorContext) {
  const dashboardError = categorizeError(error, context);
  logError(dashboardError, context);
  
  // Return the categorized error for the error boundary to handle
  return dashboardError;
}

// Supabase error handling
export function handleSupabaseError(error: any, context?: ErrorContext): DashboardError {
  // Handle Supabase-specific error codes
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116': // No rows returned
        return {
          type: 'data',
          message: error.message,
          userMessage: 'The requested data was not found.',
          retryable: false,
          code: error.code,
          details: { context }
        };
      
      case 'PGRST301': // JWT expired
        return {
          type: 'auth',
          message: error.message,
          userMessage: 'Your session has expired. Please log in again.',
          retryable: false,
          code: error.code,
          details: { context }
        };
      
      case 'PGRST302': // JWT invalid
        return {
          type: 'auth',
          message: error.message,
          userMessage: 'Authentication failed. Please log in again.',
          retryable: false,
          code: error.code,
          details: { context }
        };
      
      case 'PGRST303': // JWT missing
        return {
          type: 'auth',
          message: error.message,
          userMessage: 'Please log in to continue.',
          retryable: false,
          code: error.code,
          details: { context }
        };
      
      case 'PGRST304': // RLS policy violation
        return {
          type: 'permission',
          message: error.message,
          userMessage: 'You don\'t have permission to access this data.',
          retryable: false,
          code: error.code,
          details: { context }
        };
      
      default:
        return categorizeError(error, context);
    }
  }
  
  return categorizeError(error, context);
}

// Retry mechanism
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: ErrorContext
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  // Log the final error
  const dashboardError = handleSupabaseError(lastError, context);
  logError(dashboardError, context);
  
  throw new Error(dashboardError.userMessage);
}

// Error context helpers
export function createErrorContext(component: string, action: string, userId?: string, vendorId?: string): ErrorContext {
  return {
    component,
    action,
    userId,
    vendorId,
    timestamp: new Date()
  };
}

// Error message constants for common dashboard operations
export const DASHBOARD_ERROR_MESSAGES = {
  STATS_LOAD_FAILED: 'Unable to load dashboard statistics',
  INQUIRIES_LOAD_FAILED: 'Unable to load recent inquiries',
  PROFILE_LOAD_FAILED: 'Unable to load profile information',
  GROWTH_CALC_FAILED: 'Unable to calculate growth metrics',
  REFRESH_FAILED: 'Unable to refresh dashboard data',
  REAL_TIME_CONNECTION_FAILED: 'Real-time updates are temporarily unavailable',
  CACHE_LOAD_FAILED: 'Unable to load cached data',
  VENDOR_ID_FETCH_FAILED: 'Unable to load vendor information'
} as const;

// Auth-specific error handling
export interface AuthError extends DashboardError {
  authAction: 'signup' | 'signin' | 'signout' | 'reset_password' | 'session_refresh';
  userData?: {
    email?: string;
    userType?: string;
    userId?: string;
  };
}

export function categorizeAuthError(error: any, authAction: AuthError['authAction'], userData?: AuthError['userData']): AuthError {
  const baseError = categorizeError(error);

  // Specific auth error handling
  let userMessage = baseError.userMessage;

  // Customize messages for specific auth scenarios
  switch (authAction) {
    case 'signup':
      if (error?.message?.includes('User already registered')) {
        userMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error?.message?.includes('Password should be at least')) {
        userMessage = 'Password must be at least 6 characters long and contain a mix of letters and numbers.';
      } else if (error?.message?.includes('Invalid email')) {
        userMessage = 'Please enter a valid email address.';
      }
      break;

    case 'signin':
      if (error?.message?.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error?.message?.includes('Email not confirmed')) {
        userMessage = 'Please check your email and click the confirmation link before logging in.';
      }
      break;

    case 'reset_password':
      if (error?.message?.includes('User not found')) {
        userMessage = 'No account found with this email address.';
      }
      break;
  }

  return {
    ...baseError,
    userMessage,
    authAction,
    userData
  };
}

export function logAuthError(error: AuthError, additionalContext?: Record<string, any>) {
  const logData = {
    ...error,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    additionalContext: additionalContext || {},
    environment: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
  };

  // Console logging with structured format
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔐 Auth Error: ${error.authAction.toUpperCase()}`);
    console.error('Error Details:', {
      type: error.type,
      message: error.message,
      code: error.code,
      userMessage: error.userMessage,
      userData: error.userData,
      retryable: error.retryable
    });
    console.error('Context:', logData.additionalContext);
    console.error('Stack:', error.details);
    console.groupEnd();
  }

  // Production error logging
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    console.error('AUTH_ERROR:', JSON.stringify({
      timestamp: logData.timestamp,
      action: error.authAction,
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      email: error.userData?.email ? error.userData.email.split('@')[0] + '@***' : undefined,
      userType: error.userData?.userType,
      userId: error.userData?.userId,
      url: logData.url,
      additionalContext: sanitizeAuthContext(additionalContext)
    }, null, 2));
  }

  // Also log to general error handler
  logError(error);
}

// Sanitize sensitive auth context data
function sanitizeAuthContext(context?: Record<string, any>): Record<string, any> {
  if (!context) return {};

  const sanitized = { ...context };
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeAuthContext(sanitized[key]);
    }
  }

  return sanitized;
}

// Auth operation success logging
export function logAuthSuccess(authAction: AuthError['authAction'], userData?: AuthError['userData'], additionalContext?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    action: authAction,
    success: true,
    userData: {
      ...userData,
      email: userData?.email ? userData.email.split('@')[0] + '@***' : undefined
    },
    additionalContext: sanitizeAuthContext(additionalContext),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Auth Success: ${authAction.toUpperCase()}`, logData);
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('AUTH_SUCCESS:', JSON.stringify(logData, null, 2));
  }
}

// Auth retry mechanism with enhanced logging
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  authAction: AuthError['authAction'],
  userData?: AuthError['userData'],
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();

      // Log successful retry
      if (attempt > 1) {
        logAuthSuccess(authAction, userData, {
          retryAttempt: attempt,
          totalAttempts: maxRetries,
          finalDelay: delay * (attempt - 1)
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      const authError = categorizeAuthError(error, authAction, userData);
      logAuthError(authError, {
        retryAttempt: attempt,
        maxRetries,
        willRetry: attempt < maxRetries,
        delay: delay * attempt
      });

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  // Log final failure
  const finalError = categorizeAuthError(lastError, authAction, userData);
  logAuthError(finalError, {
    totalAttempts: maxRetries,
    finalFailure: true
  });

  throw new Error(finalError.userMessage);
}
