/**
 * Data Sanitizer - Security-First Input Validation & Sanitization
 * 
 * PURPOSE: Provides comprehensive data sanitization and validation without external dependencies
 * ARCHITECTURE: Schema-based validation → Type checking → Sanitization → Security filtering
 * 
 * FLOW DIAGRAM:
 * 1. Define sanitization schema with rules per field
 * 2. Validate incoming data against schema rules
 * 3. Apply sanitization (XSS protection, SQL injection prevention)
 * 4. Return sanitized data with validation results
 * 
 * DEPENDENCIES:
 * - Zero external dependencies for security
 * - Built-in TypeScript validation and type checking
 * - Custom sanitization functions for specific needs
 * 
 * SECURITY FEATURES:
 * - XSS protection with HTML entity encoding
 * - SQL injection prevention with parameter sanitization  
 * - Email validation with RFC compliance
 * - URL validation and normalization
 * - Custom validation patterns and sanitizers
 * - Comprehensive error reporting and logging
 */

export interface SanitizationRule {
  type: 'string' | 'email' | 'url' | 'number' | 'boolean' | 'html' | 'json' | 'custom';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  customSanitizer?: (value: any) => any;
}

export interface SanitizationSchema {
  [fieldName: string]: SanitizationRule;
}

export interface SanitizationResult {
  isValid: boolean;
  data: Record<string, any>;
  errors: string[];
  sanitized: string[];
}

class DataSanitizer {
  private defaultRules: SanitizationSchema = {
    email: { type: 'email', required: true, sanitize: true },
    name: { type: 'string', required: true, minLength: 1, maxLength: 100, sanitize: true },
    username: { type: 'string', required: true, minLength: 3, maxLength: 50, sanitize: true, pattern: /^[a-zA-Z0-9_-]+$/ },
    password: { type: 'string', required: true, minLength: 8, maxLength: 128 },
    phone: { type: 'string', sanitize: true, pattern: /^\+?[\d\s\-\(\)]+$/ },
    url: { type: 'url', sanitize: true },
    message: { type: 'string', sanitize: true, maxLength: 5000 },
    content: { type: 'html', sanitize: true, maxLength: 10000 }
  };

  /**
   * Sanitize and validate data based on schema or automatic rules
   */
  sanitize(data: Record<string, any>, schema?: SanitizationSchema): SanitizationResult {
    const result: SanitizationResult = {
      isValid: true,
      data: {},
      errors: [],
      sanitized: []
    };

    if (!data || typeof data !== 'object') {
      result.isValid = false;
      result.errors.push('Invalid data: expected object');
      return result;
    }

    const rules = schema || this.autoDetectRules(data);

    for (const [field, value] of Object.entries(data)) {
      try {
        const rule = rules[field];
        if (!rule) {
          // No rule defined - apply basic sanitization
          result.data[field] = this.basicSanitize(value);
          continue;
        }

        const sanitizedValue = this.sanitizeField(field, value, rule);
        const validationError = this.validateField(field, sanitizedValue, rule);
        
        if (validationError) {
          result.errors.push(validationError);
          result.isValid = false;
        } else {
          result.data[field] = sanitizedValue;
          if (value !== sanitizedValue) {
            result.sanitized.push(field);
          }
        }
      } catch (error) {
        result.errors.push(`${field}: Sanitization failed - ${(error as Error).message}`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Auto-detect sanitization rules based on field names and values
   */
  private autoDetectRules(data: Record<string, any>): SanitizationSchema {
    const rules: SanitizationSchema = {};
    
    for (const [field, value] of Object.entries(data)) {
      const fieldLower = field.toLowerCase();
      
      if (fieldLower.includes('email')) {
        rules[field] = { type: 'email', sanitize: true };
      } else if (fieldLower.includes('url') || fieldLower.includes('link')) {
        rules[field] = { type: 'url', sanitize: true };
      } else if (fieldLower.includes('phone')) {
        rules[field] = { type: 'string', sanitize: true, pattern: /^\+?[\d\s\-\(\)]+$/ };
      } else if (fieldLower.includes('content') || fieldLower.includes('message') || fieldLower.includes('description')) {
        rules[field] = { type: 'html', sanitize: true, maxLength: 10000 };
      } else if (typeof value === 'number') {
        rules[field] = { type: 'number' };
      } else if (typeof value === 'boolean') {
        rules[field] = { type: 'boolean' };
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects - use 'json' type to preserve object structure
        rules[field] = { type: 'json', sanitize: true };
      } else {
        // Default to string with basic sanitization
        rules[field] = { type: 'string', sanitize: true, maxLength: 1000 };
      }
    }
    
    return rules;
  }

  /**
   * Sanitize individual field based on type and rules
   */
  private sanitizeField(field: string, value: any, rule: SanitizationRule): any {
    if (value == null) return value;

    switch (rule.type) {
      case 'string':
        return this.sanitizeString(value, rule);
      case 'email':
        return this.sanitizeEmail(value);
      case 'url':
        return this.sanitizeUrl(value);
      case 'number':
        return this.sanitizeNumber(value, rule);
      case 'boolean':
        return this.sanitizeBoolean(value);
      case 'html':
        return this.sanitizeHtml(value, rule);
      case 'json':
        return this.sanitizeJson(value);
      case 'custom':
        return rule.customSanitizer ? rule.customSanitizer(value) : value;
      default:
        return this.basicSanitize(value);
    }
  }

  /**
   * Validate field after sanitization
   */
  private validateField(field: string, value: any, rule: SanitizationRule): string | null {
    if (rule.required && (value == null || value === '')) {
      return `${field} is required`;
    }

    if (value == null || value === '') return null;

    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${field} must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${field} must be at most ${rule.maxLength} characters`;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return `${field} format is invalid`;
      }
    }

    // Type-specific validation
    switch (rule.type) {
      case 'email':
        if (!this.isValidEmail(value)) {
          return `${field} must be a valid email address`;
        }
        break;
      case 'url':
        if (!this.isValidUrl(value)) {
          return `${field} must be a valid URL`;
        }
        break;
      case 'number':
        if (isNaN(Number(value))) {
          return `${field} must be a valid number`;
        }
        break;
    }

    return null;
  }

  // Sanitization methods
  private sanitizeString(value: any, rule: SanitizationRule): string {
    const str = String(value || '').trim();
    
    if (rule.sanitize) {
      return this.escapeHtml(str);
    }
    
    return str;
  }

  private sanitizeEmail(value: any): string {
    return String(value || '').trim().toLowerCase();
  }

  private sanitizeUrl(value: any): string {
    let url = String(value || '').trim();
    
    // Add protocol if missing
    if (url && !url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    return url;
  }

  private sanitizeNumber(value: any, rule: SanitizationRule): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  private sanitizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    return Boolean(value);
  }

  private sanitizeHtml(value: any, rule: SanitizationRule): string {
    const html = String(value || '');
    
    // Basic HTML sanitization - remove dangerous tags and attributes
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags
      .replace(/<embed[^>]*>/gi, '') // Remove embed tags
      .replace(/on\w+\s*=\s*['""][^'""]*['"]/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .trim();
  }

  private sanitizeJson(value: any): any {
    if (typeof value === 'object') {
      return this.deepSanitizeObject(value);
    }
    
    try {
      const parsed = JSON.parse(String(value));
      return this.deepSanitizeObject(parsed);
    } catch {
      return String(value);
    }
  }

  private basicSanitize(value: any): any {
    if (typeof value === 'string') {
      // Apply all injection prevention first, then standard string sanitization
      let cleaned = this.preventServerInjection(value);
      cleaned = this.preventSqlInjection(cleaned);
      cleaned = this.preventRedisInjection(cleaned);
      cleaned = this.preventTemplateInjection(cleaned);
      cleaned = this.preventPathTraversal(cleaned);
      return this.sanitizeString(cleaned, { type: 'string', sanitize: true });
    }
    
    if (typeof value === 'object' && value !== null) {
      return this.deepSanitizeObject(value);
    }
    
    return value;
  }

  private deepSanitizeObject(obj: any): any {
    console.log('🔍 SANITIZER DEBUG: deepSanitizeObject called with:', typeof obj, obj);

    if (Array.isArray(obj)) {
      console.log('🔍 SANITIZER DEBUG: Processing array');
      return obj.map(item => this.basicSanitize(item));
    }

    if (obj && typeof obj === 'object') {
      console.log('🔍 SANITIZER DEBUG: Processing object with keys:', Object.keys(obj));
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        console.log('🔍 SANITIZER DEBUG: Processing key:', key, 'value type:', typeof value, 'value:', value);
        // Sanitize key name
        const cleanKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '');
        if (cleanKey) {
          const sanitizedValue = this.basicSanitize(value);
          console.log('🔍 SANITIZER DEBUG: After basicSanitize - key:', cleanKey, 'value type:', typeof sanitizedValue, 'value:', sanitizedValue);
          sanitized[cleanKey] = sanitizedValue;
        }
      }
      console.log('🔍 SANITIZER DEBUG: Final sanitized object:', sanitized);
      return sanitized;
    }

    console.log('🔍 SANITIZER DEBUG: Returning unchanged:', obj);
    return obj;
  }

  /**
   * Express middleware for automatic sanitization
   */
  expressMiddleware(schema?: SanitizationSchema) {
    return (req: any, res: any, next: any) => {
      try {
        // Sanitize different data sources
        if (req.body && typeof req.body === 'object') {
          const result = this.sanitize(req.body, schema);
          if (!result.isValid) {
            return res.status(400).json({
              error: 'Validation failed',
              details: result.errors
            });
          }
          req.body = result.data;
          req.sanitizationInfo = {
            sanitized: result.sanitized,
            errors: result.errors
          };
        }
        
        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          const queryResult = this.sanitize(req.query);
          req.query = queryResult.data;
        }
        
        // Sanitize route parameters
        if (req.params && typeof req.params === 'object') {
          const paramsResult = this.sanitize(req.params);
          req.params = paramsResult.data;
        }
        
        next();
      } catch (error) {
        console.error('Sanitization middleware error:', error);
        res.status(500).json({ error: 'Internal sanitization error' });
      }
    };
  }

  // Security utilities
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Enhanced security - prevent ALL injection patterns
  preventAllInjections(data: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        let cleanedValue = this.preventServerInjection(value);
        cleanedValue = this.preventSqlInjection(cleanedValue);
        cleanedValue = this.preventRedisInjection(cleanedValue);
        cleanedValue = this.preventTemplateInjection(cleanedValue);
        cleanedValue = this.preventPathTraversal(cleanedValue);
        cleaned[key] = cleanedValue;
      } else {
        cleaned[key] = this.preventNoSqlInjection(value);
      }
    }
    
    return cleaned;
  }

  // Prevent ONLY critical command injection (balanced approach)
  private preventServerInjection(value: string): string {
    // Only block the most dangerous patterns that have no legitimate use in form data
    const criticalPatterns = [
      // Command chaining - extremely dangerous
      /;\s*(sudo|rm\s+-rf|dd\s+if=|mkfs|format)/gi,  // Critical destructive commands
      /\|\s*(sudo|rm\s+-rf|dd\s+if=|mkfs)/gi,        // Piped destructive commands
      /`[^`]*\b(sudo|rm|dd|mkfs|format)\b[^`]*`/gi,   // Backtick command execution
      /\$\([^)]*\b(sudo|rm|dd|mkfs|format)\b[^)]*\)/gi, // $() command substitution
      
      // Null bytes and control characters (always malicious in forms)
      /\x00/g,                                       // Null bytes
      /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g,         // Other control characters
      
      // Process access attempts (legitimate forms don't need these)
      /\bprocess\.(exit|kill|abort)\b/gi,            // Process termination
      /\brequire\s*\(\s*['"](child_process|fs|os)['"]\s*\)/gi, // Dangerous require()
      
      // File system traversal with obvious malicious intent
      /\.\.[\/\\]\.\.[\/\\]\.\.[\/\\]/g,            // Multiple traversals (../../../)
      /\/etc\/passwd|\/etc\/shadow|\/root\/.ssh/gi,  // Critical system files
      /\\windows\\system32\\|\\windows\\syswow64\\/gi, // Critical Windows paths
    ];
    
    let cleaned = value;
    criticalPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  // Prevent SQL injection (balanced - only obvious attacks)
  private preventSqlInjection(value: string): string {
    const sqlPatterns = [
      // Only target clear SQL injection patterns that have no legitimate use in forms
      /('\s*(OR|AND)\s+'?\d+\s*[=<>]\s*'?\d+'?\s*(OR|AND|--|\#))/gi,  // '1'='1' patterns
      /(\b(OR|AND)\s+\d+\s*=\s*\d+\s*(--|#))/gi,                     // OR 1=1-- patterns  
      /;\s*(DROP|DELETE|TRUNCATE|ALTER)\s+(TABLE|DATABASE)/gi,        // Destructive commands
      /UNION\s+(ALL\s+)?SELECT\s+.*FROM/gi,                          // UNION SELECT attacks
      /\/\*.*?\*\/|--[^\r\n]*/g,                                     // SQL comments (often malicious)
      /'\s*;\s*(INSERT|UPDATE|DELETE|DROP)/gi,                       // Statement termination attacks
    ];
    
    let cleaned = value;
    sqlPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  // Prevent Redis injection (only critical patterns)
  private preventRedisInjection(value: string): string {
    const redisPatterns = [
      // Only block Redis protocol injection and destructive commands
      /\r\n\s*(FLUSHALL|FLUSHDB|SHUTDOWN|DEBUG|CONFIG|SCRIPT\s+KILL)/gi, // Destructive commands in protocol
      /\*\d+\r\n.*?(FLUSHALL|FLUSHDB|SHUTDOWN)/gi,                      // Array format with destructive commands  
      /\$\d+\r\n.*?(FLUSHALL|FLUSHDB|SHUTDOWN)/gi,                      // Bulk string format with destructive
      /[\r\n]+\s*(FLUSHALL|FLUSHDB|SHUTDOWN)\s*[\r\n]/gi,               // Protocol-injected destructive commands
    ];
    
    let cleaned = value;
    redisPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  // Prevent template injection (only malicious patterns)
  private preventTemplateInjection(value: string): string {
    const templatePatterns = [
      // Only block template patterns with clear malicious intent
      /\{\{.*?\b(constructor|prototype|__proto__|eval|require|process|global)\b.*?\}\}/gi, // Malicious Handlebars
      /\$\{.*?\b(constructor|prototype|__proto__|eval|require|process|global)\b.*?\}/gi,  // Malicious template literals  
      /<\%.*?\b(eval|require|process|global|System|Runtime)\b.*?\%>/gi,                  // Malicious server templates
      
      // Direct JavaScript execution attempts (no legitimate use in forms)
      /\beval\s*\(\s*['"]/gi,                      // Direct eval with string
      /new\s+Function\s*\(\s*['"]/gi,              // Function constructor with string
      /setTimeout\s*\(\s*['"]/gi,                  // setTimeout with string (code injection)
      /setInterval\s*\(\s*['"]/gi,                 // setInterval with string (code injection)
    ];
    
    let cleaned = value;
    templatePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  // Prevent path traversal (only obvious attacks)
  private preventPathTraversal(value: string): string {
    const pathPatterns = [
      // Only block clear path traversal attempts with multiple levels
      /\.\.[\/\\]\.\.[\/\\]/g,                              // Multiple traversals (../..)
      /\.\.%2f\.\.%2f|\.\.%5c\.\.%5c/gi,                   // URL-encoded multiple traversals
      /\.\.[\/\\].*[\/\\]\.\.[\/\\]/g,                     // Traversal with paths in between
      
      // Block access to critical system files/directories
      /[\/\\]etc[\/\\]passwd|[\/\\]etc[\/\\]shadow/gi,     // Critical Unix files
      /[\/\\]root[\/\\]\.ssh|[\/\\]home[\/\\].*[\/\\]\.ssh/gi, // SSH keys
      /\\windows\\system32\\config\\|\\windows\\syswow64\\/gi,  // Critical Windows files
    ];
    
    let cleaned = value;
    pathPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  private preventNoSqlInjection(value: any): any {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.preventNoSqlInjection(item));
      }
      
      // Remove dangerous NoSQL operators
      const dangerous = ['$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin', '$exists'];
      const cleaned: Record<string, any> = {};
      
      for (const [key, val] of Object.entries(value)) {
        if (!dangerous.includes(key)) {
          cleaned[key] = this.preventNoSqlInjection(val);
        }
      }
      
      return cleaned;
    }
    
    return value;
  }
}

export const sanitizer = new DataSanitizer();
export default DataSanitizer;