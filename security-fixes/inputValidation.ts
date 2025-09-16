import DOMPurify from 'dompurify';

// Comprehensive input validation utilities
export class InputValidator {
  
  // Text validation with size limits
  static validateText(text: string, maxLength: number = 10000): string {
    if (typeof text !== 'string') {
      throw new Error('Input must be a string');
    }
    
    if (text.length > maxLength) {
      throw new Error(`Text too long. Maximum ${maxLength} characters allowed`);
    }
    
    // Sanitize HTML content
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: []
    });
  }
  
  // Email validation
  static validateEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.validateText(email, 254);
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }
  
  // File validation
  static validateFile(file: File, allowedTypes: string[], maxSize: number = 10 * 1024 * 1024): void {
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }
    
    // Check MIME type as well
    const allowedMimeTypes = {
      'txt': 'text/plain',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4'
    };
    
    const expectedMimeType = allowedMimeTypes[fileExtension as keyof typeof allowedMimeTypes];
    if (expectedMimeType && file.type !== expectedMimeType) {
      throw new Error('File type mismatch with extension');
    }
  }
  
  // Meeting summary validation
  static validateMeetingSummary(summary: any): void {
    if (!summary || typeof summary !== 'object') {
      throw new Error('Invalid summary format');
    }
    
    // Validate required fields
    const requiredFields = ['title', 'attendees', 'summary', 'keyPoints', 'actionItems', 'decisions'];
    
    for (const field of requiredFields) {
      if (!(field in summary)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate and sanitize string fields
    summary.title = this.validateText(summary.title, 200);
    summary.summary = this.validateText(summary.summary, 5000);
    
    // Validate arrays
    if (!Array.isArray(summary.attendees)) {
      throw new Error('Attendees must be an array');
    }
    
    summary.attendees = summary.attendees.map((attendee: any) => {
      if (typeof attendee !== 'string') {
        throw new Error('Attendee names must be strings');
      }
      return this.validateText(attendee, 100);
    });
    
    // Validate key points
    if (!Array.isArray(summary.keyPoints)) {
      throw new Error('Key points must be an array');
    }
    
    summary.keyPoints = summary.keyPoints.map((point: any) => {
      if (typeof point !== 'string') {
        throw new Error('Key points must be strings');
      }
      return this.validateText(point, 500);
    });
    
    // Validate decisions
    if (!Array.isArray(summary.decisions)) {
      throw new Error('Decisions must be an array');
    }
    
    summary.decisions = summary.decisions.map((decision: any) => {
      if (typeof decision !== 'string') {
        throw new Error('Decisions must be strings');
      }
      return this.validateText(decision, 500);
    });
    
    // Validate action items
    if (!Array.isArray(summary.actionItems)) {
      throw new Error('Action items must be an array');
    }
    
    summary.actionItems = summary.actionItems.map((item: any) => {
      if (!item || typeof item !== 'object') {
        throw new Error('Action items must be objects');
      }
      
      if (typeof item.task !== 'string' || typeof item.owner !== 'string') {
        throw new Error('Action item task and owner must be strings');
      }
      
      return {
        task: this.validateText(item.task, 300),
        owner: this.validateText(item.owner, 100)
      };
    });
  }
  
  // Rate limiting helper
  static createRateLimiter(maxRequests: number, timeWindowMs: number) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the time window
      const validRequests = userRequests.filter(time => now - time < timeWindowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true;
    };
  }
}

// Enhanced error handling
export class SecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Consider removing unsafe-inline in production
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://*.convex.cloud", "https://api.polar.sh"],
  'font-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};
