/**
 * PureMix Verbose Debug Logger
 * 
 * Comprehensive logging system with rotating files and request lifecycle tracking
 * Logs server startup, requests, sanitization, security events, and full application flow
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface VerboseDebugConfig {
  enabled: boolean;
  save: boolean;      // Save to rotating files
  console: boolean;   // Output to console/PM2/Docker logs
  logDir: string;     // Directory for log files
  maxFileSize: number; // Max file size in MB before rotation
  maxFiles: number;   // Max number of log files to keep
  includeData: boolean; // Include sensitive data in logs (default: false)
  trackPerformance: boolean; // Track performance metrics
  level: LogLevel;    // Log level threshold
}

export interface LogContext {
  requestId?: string;
  sessionId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  route?: string;
  method?: string;
  timestamp?: number;
  performance?: {
    startTime: number;
    duration?: number;
  };
}

export interface SecurityEvent {
  type: 'xss_attempt' | 'sql_injection' | 'command_injection' | 'path_traversal' | 'template_injection' | 'csrf_failure' | 'rate_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  originalValue?: string;
  sanitizedValue?: string;
  blocked: boolean;
}

class VerboseDebugLogger {
  private config: VerboseDebugConfig;
  private logDir: string;
  private currentLogFile: string;
  private requestCounter: number = 0;
  private serverStartTime: number;
  private logLevels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };
  
  constructor(config: Partial<VerboseDebugConfig> = {}) {
    // Get log level from environment variable or config
    const envLogLevel = (process.env.LOG_LEVEL || process.env.NODE_ENV === 'production' ? 'error' : 'debug') as LogLevel;
    
    this.config = {
      enabled: process.env.NODE_ENV !== 'production' || process.env.PUREMIX_ENABLE_LOGS === 'true',
      save: process.env.NODE_ENV !== 'production',
      console: true,
      logDir: 'logs',
      maxFileSize: 10, // 10MB
      maxFiles: 30,    // Keep 30 days
      includeData: process.env.NODE_ENV === 'development',
      trackPerformance: true,
      level: envLogLevel,
      ...config
    };
    
    this.serverStartTime = performance.now();
    this.logDir = path.resolve(this.config.logDir);
    this.currentLogFile = this.getLogFileName();
    
    if (this.config.enabled && this.config.save) {
      this.initializeLogDirectory();
      this.rotateLogsIfNeeded();
    }
  }

  /**
   * Initialize logging and log server startup
   */
  initialize(): void {
    if (!this.config.enabled) return;
    
    this.logServerStart();
    
    // Clean old log files on startup
    if (this.config.save) {
      this.cleanOldLogs();
    }
  }

  /**
   * Log server startup information
   */
  private logServerStart(): void {
    const startupInfo = {
      event: 'SERVER_START',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development',
      config: {
        ...this.config,
        // Don't log sensitive config
      }
    };
    
    this.log('🚀 SERVER STARTUP', startupInfo, null, 'info');
  }

  /**
   * Create request context for tracking
   */
  createRequestContext(req: any): LogContext {
    this.requestCounter++;
    
    const requestId = `req_${Date.now()}_${this.requestCounter}`;
    const sessionId = req.session?.id || req.sessionID || 'no_session';
    const userId = req.session?.user?.id || req.user?.id || 'anonymous';
    
    return {
      requestId,
      sessionId,
      userId,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      route: req.path || req.url,
      method: req.method,
      timestamp: Date.now(),
      performance: {
        startTime: performance.now()
      }
    };
  }

  /**
   * Log incoming request
   */
  logRequest(context: LogContext, req: any): void {
    if (!this.config.enabled) return;
    
    const requestInfo = {
      event: 'REQUEST_START',
      context,
      headers: this.sanitizeHeaders(req.headers),
      query: this.config.includeData ? req.query : Object.keys(req.query || {}),
      body: this.config.includeData ? req.body : (req.body ? `[${Object.keys(req.body).length} fields]` : null),
      cookies: this.config.includeData ? req.cookies : Object.keys(req.cookies || {}),
      session: {
        exists: !!req.session,
        id: context.sessionId,
        authenticated: !!(req.session?.user || req.user)
      }
    };
    
    this.log('📥 REQUEST', requestInfo, context, 'debug');
  }

  /**
   * Log route resolution and file parsing
   */
  logRouteResolution(context: LogContext, routeInfo: any): void {
    if (!this.config.enabled) return;
    
    const info = {
      event: 'ROUTE_RESOLUTION',
      context,
      route: routeInfo.route,
      filePath: routeInfo.filePath,
      isAPI: routeInfo.isAPI,
      fileType: routeInfo.fileType,
      exists: routeInfo.exists
    };
    
    this.log('🛣️  ROUTE', info, context, 'debug');
  }

  /**
   * Log loader execution
   */
  logLoader(context: LogContext, loaderInfo: any): void {
    if (!this.config.enabled) return;
    
    const startTime = performance.now();
    
    const info = {
      event: 'LOADER_EXECUTION',
      context,
      loader: loaderInfo.name,
      hasData: !!loaderInfo.result?.data,
      dataKeys: loaderInfo.result?.data ? Object.keys(loaderInfo.result.data) : [],
      state: loaderInfo.result?.state,
      loading: loaderInfo.result?.loading,
      error: loaderInfo.error?.message,
      performance: {
        duration: performance.now() - (loaderInfo.startTime || startTime)
      }
    };
    
    this.log('🔄 LOADER', info, context, 'debug');
  }

  /**
   * Log action/server function execution
   */
  logAction(context: LogContext, actionInfo: any): void {
    if (!this.config.enabled) return;
    
    const info = {
      event: 'ACTION_EXECUTION',
      context,
      action: actionInfo.name,
      data: this.config.includeData ? actionInfo.data : `[${Object.keys(actionInfo.data || {}).length} fields]`,
      result: actionInfo.result,
      error: actionInfo.error?.message,
      performance: {
        duration: actionInfo.duration
      }
    };
    
    this.log('⚡ ACTION', info, context, 'info');
  }

  /**
   * Log template rendering
   */
  logTemplateRender(context: LogContext, templateInfo: any): void {
    if (!this.config.enabled) return;
    
    const info = {
      event: 'TEMPLATE_RENDER',
      context,
      template: templateInfo.file,
      components: templateInfo.components?.map((c: any) => c.name) || [],
      pythonImports: templateInfo.pythonImports ? Object.keys(templateInfo.pythonImports) : [],
      htmlLength: templateInfo.html?.length || 0,
      performance: {
        duration: templateInfo.duration
      }
    };
    
    this.log('📄 TEMPLATE', info, context, 'debug');
  }

  /**
   * Log Python execution
   */
  logPython(context: LogContext, pythonInfo: any): void {
    if (!this.config.enabled) return;
    
    const info = {
      event: 'PYTHON_EXECUTION',
      context,
      function: pythonInfo.functionName,
      file: pythonInfo.filePath,
      hasJsContext: !!pythonInfo.jsContext,
      success: !pythonInfo.error,
      error: pythonInfo.error?.message,
      performance: {
        duration: pythonInfo.duration
      }
    };
    
    this.log('🐍 PYTHON', info, context, 'info');
  }

  /**
   * Log sanitization events
   */
  logSanitization(context: LogContext, sanitizationInfo: any): void {
    if (!this.config.enabled) return;
    
    const info = {
      event: 'SANITIZATION',
      context,
      fieldsProcessed: sanitizationInfo.totalFields,
      fieldsSanitized: sanitizationInfo.sanitizedFields,
      errors: sanitizationInfo.errors,
      warnings: sanitizationInfo.warnings,
      securityEvents: sanitizationInfo.securityEvents?.map((event: SecurityEvent) => ({
        type: event.type,
        severity: event.severity,
        blocked: event.blocked,
        details: event.details
      }))
    };
    
    this.log('🛡️  SANITIZATION', info, context, 'debug');
  }

  /**
   * Log security events (attacks, attempts, etc.)
   */
  logSecurityEvent(context: LogContext, event: SecurityEvent): void {
    if (!this.config.enabled) return;
    
    const info = {
      event: 'SECURITY_EVENT',
      context,
      securityEvent: {
        ...event,
        originalValue: this.config.includeData ? event.originalValue : '[REDACTED]',
        sanitizedValue: this.config.includeData ? event.sanitizedValue : '[REDACTED]'
      }
    };
    
    // Always log security events to console regardless of config
    const logLevel = event.severity === 'critical' ? '🚨' : 
                    event.severity === 'high' ? '⚠️' : 
                    event.severity === 'medium' ? '🔒' : '🔍';
    
    this.log(`${logLevel} SECURITY`, info, context, event.severity === 'critical' || event.severity === 'high' ? 'warn' : 'info');
    
    // Also log to console for immediate visibility
    if (event.severity === 'high' || event.severity === 'critical') {
      console.warn(`🚨 SECURITY ALERT [${event.type.toUpperCase()}]: ${event.details} - IP: ${context.ip} - Route: ${context.route}`);
    }
  }

  /**
   * Log request completion
   */
  logResponse(context: LogContext, responseInfo: any): void {
    if (!this.config.enabled) return;
    
    if (context.performance?.startTime) {
      context.performance.duration = performance.now() - context.performance.startTime;
    }
    
    const info = {
      event: 'REQUEST_COMPLETE',
      context,
      status: responseInfo.statusCode,
      contentType: responseInfo.contentType,
      contentLength: responseInfo.contentLength,
      cached: responseInfo.cached,
      error: responseInfo.error?.message,
      performance: context.performance
    };
    
    this.log('📤 RESPONSE', info, context, 'debug');
  }

  /**
   * Log errors
   */
  logError(context: LogContext | null, error: Error, additionalInfo?: any): void {
    if (!this.config.enabled) return;
    
    const info = {
      event: 'ERROR',
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...additionalInfo
      }
    };
    
    this.log('❌ ERROR', info, context, 'error');
  }

  /**
   * Debug logging method
   */
  debug(message: string, data?: any, context?: LogContext | null): void {
    this.log(`🔧 DEBUG: ${message}`, data, context, 'debug');
  }

  /**
   * Info logging method  
   */
  info(message: string, data?: any, context?: LogContext | null): void {
    this.log(`ℹ️ INFO: ${message}`, data, context, 'info');
  }

  /**
   * Warning logging method
   */
  warn(message: string, data?: any, context?: LogContext | null): void {
    this.log(`⚠️ WARN: ${message}`, data, context, 'warn');
  }

  /**
   * Error logging method
   */
  error(message: string, data?: any, context?: LogContext | null): void {
    this.log(`❌ ERROR: ${message}`, data, context, 'error');
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.logLevels[messageLevel] <= this.logLevels[this.config.level];
  }

  /**
   * Generic log method with level checking
   */
  private log(prefix: string, data: any, context?: LogContext | null, level: LogLevel = 'info'): void {
    if (!this.shouldLog(level)) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: prefix,
      data,
      server: {
        uptime: performance.now() - this.serverStartTime,
        memory: process.memoryUsage(),
        requestCount: this.requestCounter
      }
    };
    
    // Output to console/PM2/Docker logs
    if (this.config.console) {
      const contextStr = context?.requestId ? `[${context.requestId}]` : '';
      console.log(`${timestamp} ${prefix} ${contextStr}`);
      
      if (this.config.includeData && level !== 'error') {
        console.log(JSON.stringify(data, null, 2));
      }
    }
    
    // Save to file
    if (this.config.save) {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Write log entry to file
   */
  private writeToFile(logEntry: any): void {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Check if we need to rotate the log file
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        if (stats.size > this.config.maxFileSize * 1024 * 1024) {
          this.rotateLogFile();
        }
      }
      
      fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Get log level from prefix
   */
  private getLogLevel(prefix: string): string {
    if (prefix.includes('ERROR') || prefix.includes('🚨')) return 'ERROR';
    if (prefix.includes('SECURITY') || prefix.includes('⚠️')) return 'WARN';
    if (prefix.includes('REQUEST') || prefix.includes('RESPONSE')) return 'INFO';
    return 'DEBUG';
  }

  /**
   * Initialize log directory
   */
  private initializeLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current log file name
   */
  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `puremix-${date}.log`);
  }

  /**
   * Rotate log file if needed
   */
  private rotateLogsIfNeeded(): void {
    const expectedLogFile = this.getLogFileName();
    if (this.currentLogFile !== expectedLogFile) {
      this.currentLogFile = expectedLogFile;
    }
  }

  /**
   * Rotate current log file
   */
  private rotateLogFile(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
    
    try {
      fs.renameSync(this.currentLogFile, rotatedFile);
      this.currentLogFile = this.getLogFileName();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Clean old log files
   */
  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('puremix-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      // Keep only the most recent files
      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log(`Cleaned old log file: ${file.name}`);
          } catch (error) {
            console.error(`Failed to delete log file ${file.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Get current configuration
   */
  getConfig(): VerboseDebugConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VerboseDebugConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && this.config.save && !fs.existsSync(this.logDir)) {
      this.initializeLogDirectory();
    }
  }

  /**
   * Get log statistics
   */
  getStats(): any {
    return {
      enabled: this.config.enabled,
      logDir: this.logDir,
      currentLogFile: this.currentLogFile,
      requestCount: this.requestCounter,
      serverUptime: performance.now() - this.serverStartTime,
      logFileExists: fs.existsSync(this.currentLogFile),
      logFileSize: fs.existsSync(this.currentLogFile) ? fs.statSync(this.currentLogFile).size : 0
    };
  }
}

// Global logger instance
let globalLogger: VerboseDebugLogger | null = null;

/**
 * Initialize the global logger
 */
export function initializeLogger(config: Partial<VerboseDebugConfig> = {}): VerboseDebugLogger {
  globalLogger = new VerboseDebugLogger(config);
  globalLogger.initialize();
  return globalLogger;
}

/**
 * Get the global logger instance
 */
export function getLogger(): VerboseDebugLogger | null {
  return globalLogger;
}

/**
 * Middleware factory for Express integration
 */
export function createLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    if (!globalLogger || !globalLogger.getConfig().enabled) {
      return next();
    }
    
    // Create request context
    const context = globalLogger.createRequestContext(req);
    
    // Attach context to request for use in other middleware
    req.debugContext = context;
    
    // Log incoming request
    globalLogger.logRequest(context, req);
    
    // Intercept response to log completion
    const originalSend = res.send;
    res.send = function(data: any) {
      globalLogger?.logResponse(context, {
        statusCode: res.statusCode,
        contentType: res.get('Content-Type'),
        contentLength: data?.length || 0
      });
      
      return originalSend.call(this, data);
    };
    
    // Handle errors
    const originalNext = next;
    next = function(error?: any) {
      if (error && globalLogger) {
        globalLogger.logError(context, error);
      }
      return originalNext(error);
    };
    
    next();
  };
}

export default VerboseDebugLogger;