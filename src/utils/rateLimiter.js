// Rate limiting utility for API protection

export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute by default
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
  
  getResetTime(identifier = 'default') {
    if (!this.requests.has(identifier)) {
      return 0;
    }
    
    const userRequests = this.requests.get(identifier);
    if (userRequests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.windowMs;
  }
  
  reset(identifier = 'default') {
    this.requests.delete(identifier);
  }
  
  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Pre-configured limiters for different use cases
export const authLimiter = new RateLimiter(5, 60000); // 5 login attempts per minute
export const uploadLimiter = new RateLimiter(10, 60000); // 10 uploads per minute
export const searchLimiter = new RateLimiter(30, 60000); // 30 searches per minute
export const createProductLimiter = new RateLimiter(3, 300000); // 3 products per 5 minutes
export const contactLimiter = new RateLimiter(10, 300000); // 10 contact messages per 5 minutes

// Cleanup old entries every 5 minutes
setInterval(() => {
  authLimiter.cleanup();
  uploadLimiter.cleanup();
  searchLimiter.cleanup();
  createProductLimiter.cleanup();
  contactLimiter.cleanup();
}, 300000);
