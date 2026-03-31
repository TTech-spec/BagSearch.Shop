// SECURITY FIXES IMPLEMENTATION
// Add these components to enhance your application security

// 1. SECURE FILE UPLOAD VALIDATION
// Add to createProduct.jsx or create as separate utility

export const validateFile = (file) => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_DIMENSION = 4096; // 4K pixels max
  
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }
  
  // Check file size
  if (file.size > MAX_SIZE) {
    throw new Error('File size must be less than 5MB');
  }
  
  // Check filename for suspicious patterns
  const suspiciousPatterns = [
    /\.php$/, /\.js$/, /\.exe$/, /\.bat$/, /\.cmd$/,
    /\.sh$/, /\.ps1$/, /\.vbs$/, /\.jar$/, /\.com$/
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    throw new Error('Invalid file type detected');
  }
  
  return true;
};

// 2. INPUT SANITIZATION UTILITIES
export const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, maxLength); // Limit length
};

export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;
  
  // Basic HTML sanitization
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '');
};

// 3. RATE LIMITING COMPONENT
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  isAllowed(identifier = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    
    // Remove old requests
    const validRequests = userRequests.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }
  
  getRemainingRequests(identifier = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }
    
    const userRequests = this.requests.get(identifier);
    const validRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// 4. SECURITY HEADERS MIDDLEWARE
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// 5. ENHANCED ERROR HANDLING
export class SecureErrorHandler {
  static handleError(error, context = '') {
    // Log detailed error for debugging
    console.error(`Security Error [${context}]:`, error);
    
    // Return generic error to client
    const genericErrors = {
      'default': 'An error occurred. Please try again.',
      'auth': 'Authentication failed. Please log in again.',
      'permission': 'You do not have permission to perform this action.',
      'rate_limit': 'Too many requests. Please try again later.',
      'file_upload': 'File upload failed. Please check your file and try again.',
      'validation': 'Invalid input. Please check your data and try again.'
    };
    
    const errorType = this.categorizeError(error);
    return {
      message: genericErrors[errorType] || genericErrors.default,
      type: errorType,
      timestamp: new Date().toISOString()
    };
  }
  
  static categorizeError(error) {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('auth') || message.includes('unauthorized')) return 'auth';
    if (message.includes('permission') || message.includes('forbidden')) return 'permission';
    if (message.includes('rate') || message.includes('limit')) return 'rate_limit';
    if (message.includes('file') || message.includes('upload')) return 'file_upload';
    if (message.includes('validation') || message.includes('invalid')) return 'validation';
    
    return 'default';
  }
}

// 6. SESSION SECURITY ENHANCEMENT
export class SessionManager {
  constructor() {
    this.maxConcurrentSessions = 3;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.sessions = new Map();
  }
  
  createSession(userId, deviceInfo) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId,
      deviceInfo,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true
    };
    
    // Clean old sessions
    this.cleanOldSessions(userId);
    
    // Check concurrent session limit
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive);
    
    if (userSessions.length >= this.maxConcurrentSessions) {
      // Deactivate oldest session
      const oldestSession = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
      oldestSession.isActive = false;
    }
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }
  
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }
    
    // Check timeout
    if (Date.now() - session.lastActivity > this.sessionTimeout) {
      session.isActive = false;
      return false;
    }
    
    session.lastActivity = Date.now();
    return true;
  }
  
  cleanOldSessions(userId) {
    const now = Date.now();
    const timeout = this.sessionTimeout;
    
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId && 
          (now - session.lastActivity > timeout || !session.isActive)) {
        this.sessions.delete(sessionId);
      }
    }
  }
  
  generateSessionId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  getActiveSessions(userId) {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive);
  }
}

// 7. SECURITY MONITORING
export class SecurityMonitor {
  constructor() {
    this.suspiciousActivities = new Map();
    this.alerts = [];
  }
  
  logSuspiciousActivity(type, details, userId = 'anonymous') {
    const activity = {
      type,
      details,
      userId,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };
    
    if (!this.suspiciousActivities.has(userId)) {
      this.suspiciousActivities.set(userId, []);
    }
    
    this.suspiciousActivities.get(userId).push(activity);
    
    // Check for patterns
    this.analyzePattern(userId);
  }
  
  analyzePattern(userId) {
    const activities = this.suspiciousActivities.get(userId) || [];
    const recentActivities = activities.filter(
      a => Date.now() - new Date(a.timestamp).getTime() < 60000 // Last minute
    );
    
    // Multiple failed login attempts
    const failedLogins = recentActivities.filter(a => a.type === 'failed_login');
    if (failedLogins.length >= 5) {
      this.raiseAlert('BRUTE_FORCE', userId, failedLogins);
    }
    
    // Multiple file upload attempts
    const failedUploads = recentActivities.filter(a => a.type === 'failed_upload');
    if (failedUploads.length >= 10) {
      this.raiseAlert('MALICIOUS_UPLOAD', userId, failedUploads);
    }
  }
  
  raiseAlert(type, userId, activities) {
    const alert = {
      id: this.generateAlertId(),
      type,
      userId,
      activities,
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(type)
    };
    
    this.alerts.push(alert);
    console.warn('SECURITY ALERT:', alert);
    
    // Here you could also send to external monitoring service
  }
  
  getSeverity(type) {
    const severities = {
      'BRUTE_FORCE': 'HIGH',
      'MALICIOUS_UPLOAD': 'HIGH',
      'XSS_ATTEMPT': 'CRITICAL',
      'SQL_INJECTION': 'CRITICAL',
      'RATE_LIMIT_EXCEEDED': 'MEDIUM'
    };
    
    return severities[type] || 'LOW';
  }
  
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getAlerts(severity = null) {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return this.alerts;
  }
}

// 8. USAGE EXAMPLES
/*
// File Upload Security
try {
  validateFile(file);
  // Proceed with upload
} catch (error) {
  const secureError = SecureErrorHandler.handleError(error, 'file_upload');
  // Show secure error to user
}

// Rate Limiting
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
if (!rateLimiter.isAllowed(userId)) {
  const error = SecureErrorHandler.handleError(new Error('Rate limit exceeded'), 'rate_limit');
  // Return error response
}

// Session Management
const sessionManager = new SessionManager();
const sessionId = sessionManager.createSession(userId, deviceInfo);
if (!sessionManager.validateSession(sessionId)) {
  // Force logout
}

// Security Monitoring
const monitor = new SecurityMonitor();
monitor.logSuspiciousActivity('failed_login', { ip, userAgent }, userId);
*/

export default {
  validateFile,
  sanitizeInput,
  sanitizeHtml,
  RateLimiter,
  securityHeaders,
  SecureErrorHandler,
  SessionManager,
  SecurityMonitor
};
