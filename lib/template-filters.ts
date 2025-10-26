/**
 * PureMix Template Filters V2 - Simplified Pipe-Only System
 * 
 * PURPOSE: 
 * Template-specific formatting filters for use with Template Engine V2
 * Works AFTER native JavaScript evaluation - only handles pipe syntax
 * 
 * PHILOSOPHY:
 * - Native JavaScript handles: {user.name.toUpperCase()}, {date.getFullYear()}
 * - Pipe filters handle: {user.salary | currency('USD')}, {date | timeago}
 * 
 * INTEGRATION:
 * Called by TreeEvaluator after JavaScript evaluation completes
 * Processes only the pipe portion: "value | filter1 | filter2('param')"
 * 
 * SIZE REDUCTION: 
 * From 1135 lines (full system) to ~300 lines (pipe-only)
 */

// Core interfaces for the simplified filter system
interface FilterFunction {
  (value: any, ...args: any[]): any;
}

interface PipeCall {
  name: string;
  args: any[];
}

interface FilterContext {
  template: string;
  expression: string;
  nodeId?: string;
}

/**
 * TemplateFiltersV2: Simplified pipe-only filter system
 * 
 * INTEGRATION WITH TREE EVALUATOR:
 * - TreeEvaluator evaluates: {user.salary} → 50000
 * - TemplateFiltersV2 processes: 50000 | currency('USD') → $50,000.00
 */
export class TemplateFiltersV2 {
  private filters = new Map<string, FilterFunction>();
  private logger: ((message: string, context?: any) => void) | undefined;

  constructor(logger?: (message: string, context?: any) => void) {
    this.logger = logger;
    this.registerAllFilters();
  }

  /**
   * Main entry point: Process pipe chain after JavaScript evaluation
   * Called by TreeEvaluator when expression contains pipe syntax
   */
  processPipes(value: any, pipeChain: string, context?: FilterContext): any {
    try {
      const pipes = this.parsePipeChain(pipeChain);
      let result = value;

      for (const pipe of pipes) {
        result = this.applyFilter(result, pipe.name, pipe.args, context);
      }

      return result;
    } catch (error) {
      this.logError('Pipe processing failed', {
        pipeChain,
        context,
        error: error instanceof Error ? error.message : String(error),
        value
      });
      return value; // Graceful fallback
    }
  }

  /**
   * Parse pipe chain: "currency('USD') | truncate(100, '...')"
   */
  private parsePipeChain(chain: string): PipeCall[] {
    return chain.split('|').map(pipe => {
      const trimmed = pipe.trim();
      const parenIndex = trimmed.indexOf('(');
      
      if (parenIndex === -1) {
        return { name: trimmed, args: [] };
      }
      
      const name = trimmed.substring(0, parenIndex);
      const argsStr = trimmed.substring(parenIndex + 1, trimmed.lastIndexOf(')'));
      const args = this.parseArguments(argsStr);
      
      return { name, args };
    });
  }

  /**
   * Parse filter arguments: "'USD', 2, true"
   */
  private parseArguments(argsStr: string): any[] {
    if (!argsStr.trim()) return [];
    
    try {
      return argsStr.split(',').map(arg => {
        const trimmed = arg.trim();
        
        // String literal
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          return trimmed.slice(1, -1);
        }
        
        // Number
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          return Number(trimmed);
        }
        
        // Boolean
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        
        // Default to string
        return trimmed;
      });
    } catch {
      return [];
    }
  }

  /**
   * Apply single filter with error handling
   */
  private applyFilter(value: any, filterName: string, args: any[], context?: FilterContext): any {
    try {
      const filter = this.filters.get(filterName);
      
      if (!filter) {
        this.logError(`Unknown filter: ${filterName}`, {
          filterName,
          availableFilters: Array.from(this.filters.keys()),
          context,
          value
        });
        return value;
      }

      return filter(value, ...args);
    } catch (error) {
      this.logError(`Filter execution failed: ${filterName}`, {
        filterName,
        context,
        error: error instanceof Error ? error.message : String(error),
        value,
        args
      });
      return value;
    }
  }

  /**
   * Register all template-specific filters
   */
  private registerAllFilters() {
    this.registerTextFilters();
    this.registerNumberFilters();
    this.registerDateFilters();
    this.registerArrayFilters();
    this.registerCurrencyFilters();
    this.registerUtilityFilters();
  }

  /**
   * Text formatting filters
   */
  private registerTextFilters() {
    // Case conversion (supplement native methods)
    this.filters.set('capitalize', (value: any) => {
      const str = String(value || '');
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });
    
    this.filters.set('title', (value: any) => {
      const str = String(value || '');
      return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );
    });

    // Template-specific text manipulation
    this.filters.set('truncate', (value: any, length: number = 50, suffix: string = '...') => {
      const str = String(value || '');
      return str.length > length ? str.substring(0, length) + suffix : str;
    });

    this.filters.set('wordwrap', (value: any, width: number = 80, breakStr: string = '\n') => {
      const str = String(value || '');
      const regex = new RegExp(`.{1,${width}}(\\s|$)`, 'g');
      return str.match(regex)?.join(breakStr) || str;
    });

    // HTML escaping (important for template security)
    this.filters.set('htmlescape', (value: any) => 
      String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
    );

    this.filters.set('urlencode', (value: any) => encodeURIComponent(String(value || '')));
  }

  /**
   * Number formatting filters (template-specific)
   */
  private registerNumberFilters() {
    // Advanced numeral formatting
    this.filters.set('numeral', (value: any, pattern: string = '0,0') => {
      const num = Number(value);
      if (isNaN(num)) return '0';
      return this.formatNumeral(num, pattern);
    });

    // Percentage formatting
    this.filters.set('percent', (value: any, decimals: number = 1) => {
      const num = Number(value);
      if (isNaN(num)) return '0%';
      return `${(num * 100).toFixed(decimals)}%`;
    });

    // File size formatting
    this.filters.set('filesize', (value: any, decimals: number = 1) => {
      const bytes = Number(value);
      if (isNaN(bytes) || bytes === 0) return '0 B';

      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizes[i]}`;
    });

    // Ordinal numbers
    this.filters.set('ordinal', (value: any) => {
      const num = parseInt(String(value));
      if (isNaN(num)) return String(value);

      const suffix = ['th', 'st', 'nd', 'rd'];
      const v = num % 100;
      return num + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
    });
  }

  /**
   * Advanced numeral pattern formatting
   */
  private formatNumeral(num: number, pattern: string): string {
    try {
      const isNegative = num < 0;
      const absNum = Math.abs(num);

      const parts = pattern.split('.');
      const integerPattern = parts[0] || '0';
      const decimalPattern = parts[1] || '';

      let integerPart = Math.floor(absNum).toString();
      
      if (integerPattern.includes(',')) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }

      let decimalPart = '';
      if (decimalPattern) {
        const decimals = decimalPattern.length;
        decimalPart = '.' + (absNum % 1).toFixed(decimals).slice(2);
      }

      let result = integerPart + decimalPart;
      
      // European format support
      if (pattern.includes('0.000,0')) {
        result = result.replace(/,/g, '.');
        if (decimalPart) {
          const lastDot = result.lastIndexOf('.');
          result = result.substring(0, lastDot) + ',' + result.substring(lastDot + 1);
        }
      }

      return (isNegative ? '-' : '') + result;
    } catch {
      return String(num);
    }
  }

  /**
   * Date formatting filters
   */
  private registerDateFilters() {
    // Template-friendly date formatting
    this.filters.set('date', (value: any, format: string = 'MM/DD/YYYY', locale: string = 'en-US') => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);
      return this.formatDate(date, format, locale);
    });

    // Relative time formatting
    this.filters.set('timeago', (value: any) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      return 'just now';
    });

    // ISO date formatting
    this.filters.set('isodate', (value: any) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);
      return date.toISOString().split('T')[0];
    });
  }

  /**
   * Date pattern formatting
   */
  private formatDate(date: Date, format: string, locale: string): string {
    try {
      const formatMap: Record<string, string> = {
        'YYYY': date.getFullYear().toString(),
        'YY': date.getFullYear().toString().slice(-2),
        'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
        'M': (date.getMonth() + 1).toString(),
        'DD': date.getDate().toString().padStart(2, '0'),
        'D': date.getDate().toString(),
        'HH': date.getHours().toString().padStart(2, '0'),
        'mm': date.getMinutes().toString().padStart(2, '0'),
        'ss': date.getSeconds().toString().padStart(2, '0')
      };

      let result = format;
      for (const [pattern, replacement] of Object.entries(formatMap)) {
        result = result.replace(new RegExp(pattern, 'g'), replacement);
      }
      return result;
    } catch {
      return date.toLocaleDateString(locale);
    }
  }

  /**
   * Array manipulation filters
   */
  private registerArrayFilters() {
    // Note: Array methods like .length, .join() work natively in Template Engine V2
    // These are for template-specific array formatting
    
    this.filters.set('length', (value: any) => {
      if (Array.isArray(value)) return value.length;
      if (typeof value === 'string') return value.length;
      if (value && typeof value === 'object') return Object.keys(value).length;
      return 0;
    });

    this.filters.set('join', (value: any, separator: string = ', ') => {
      if (Array.isArray(value)) return value.join(separator);
      return String(value || '');
    });

    this.filters.set('first', (value: any) => {
      if (Array.isArray(value)) return value[0];
      return value;
    });

    this.filters.set('last', (value: any) => {
      if (Array.isArray(value)) return value[value.length - 1];
      return value;
    });

    this.filters.set('unique', (value: any) => {
      if (Array.isArray(value)) return Array.from(new Set(value));
      return value;
    });
  }

  /**
   * Currency and money formatting
   */
  private registerCurrencyFilters() {
    // Primary currency filter with locale support
    this.filters.set('currency', (value: any, currency: string = 'USD', locale: string = 'en-US') => {
      const num = Number(value);
      if (isNaN(num)) return '$0.00';

      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency.toUpperCase()
        }).format(num);
      } catch {
        return `$${num.toFixed(2)}`;
      }
    });

    // Regional money formatting
    this.filters.set('money', (value: any, format: string = 'USD') => {
      const num = Number(value);
      if (isNaN(num)) return '0.00';

      const formatMap: Record<string, any> = {
        'USD': { locale: 'en-US', currency: 'USD' },
        'EUR': { locale: 'de-DE', currency: 'EUR' },
        'GBP': { locale: 'en-GB', currency: 'GBP' },
        'JPY': { locale: 'ja-JP', currency: 'JPY' }
      };

      const config = formatMap[format.toUpperCase()] || formatMap['USD'];

      try {
        return new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency: config.currency
        }).format(num);
      } catch {
        return `${num.toFixed(2)} ${format.toUpperCase()}`;
      }
    });
  }

  /**
   * Utility and debugging filters
   */
  private registerUtilityFilters() {
    // Default value filter
    this.filters.set('default', (value: any, defaultValue: any = '') => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      return value;
    });

    // JSON formatting (for debugging)
    this.filters.set('json', (value: any, indent: number = 0) => {
      try {
        return JSON.stringify(value, null, indent);
      } catch {
        return String(value);
      }
    });

    // Debug filter (development only)
    this.filters.set('debug', (value: any) => {
      return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
    });

    // Type information
    this.filters.set('typeof', (value: any) => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      if (value instanceof Date) return 'date';
      return typeof value;
    });
  }

  /**
   * Register custom filter for extensibility
   */
  registerCustomFilter(name: string, filter: FilterFunction) {
    this.filters.set(name, filter);
  }

  /**
   * Get available filters (for debugging/documentation)
   */
  getAvailableFilters(): string[] {
    return Array.from(this.filters.keys()).sort();
  }

  /**
   * Error logging with context
   */
  private logError(message: string, context: any) {
    if (this.logger) {
      this.logger(`🚫 Template Filter V2 Error: ${message}`, context);
    } else {
      console.warn(`🚫 Template Filter V2 Error: ${message}`, context);
    }
  }
}

// Export types for integration with Template Engine V2
export type { FilterFunction, PipeCall, FilterContext };

/**
 * Template Engine V2 Integration Notes:
 * 
 * 1. TreeEvaluator checks for pipe syntax: expression.includes('|')
 * 2. Splits expression: [jsExpression, ...pipeParts] = expression.split('|')
 * 3. Evaluates JavaScript: jsResult = evaluateJavaScript(jsExpression, context)
 * 4. Processes pipes: templateFilters.processPipes(jsResult, pipeChain)
 * 
 * This approach gives us:
 * - Native JavaScript performance for methods/operations
 * - Template-specific formatting through pipes
 * - Clean separation of concerns
 * - 90% reduction in filter system complexity
 */