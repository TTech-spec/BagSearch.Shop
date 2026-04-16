// Security headers middleware for enhanced protection

export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

// Apply security headers to responses (for server-side implementation)
export const applySecurityHeaders = (response) => {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  return response;
};

// CSP violation reporter
export const reportCSPViolation = (violation) => {
  console.warn('CSP Violation:', violation);
  // Send to monitoring service in production
  if (import.meta.env.PROD) {
    // Example: Send to your monitoring service
    // fetch('/api/csp-violation', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(violation)
    // });
  }
};

// Initialize CSP monitoring (add to your main app component)
export const initCSPMonitoring = () => {
  if (typeof window !== 'undefined' && window.SecurityPolicyViolationEvent) {
    document.addEventListener('securitypolicyviolation', reportCSPViolation);
  }
};
