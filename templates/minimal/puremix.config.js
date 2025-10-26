export default {
  // App directory containing routes and components
  appDir: 'app',
  
  // Port for development server
  port: 3000,
  
  // Session configuration
  session: {
    secret: 'change-this-secret-key-in-production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false // Set to true in production with HTTPS
  },
  
  // Minimal logging for simple projects
  verboseDebug: {
    enabled: false, // Disabled by default for minimal template
    save: false,
    console: true,
    logDir: 'logs',
    maxFileSize: 5,
    maxFiles: 5,
    includeData: false,
    trackPerformance: false
  },

  // Python integration (disabled by default)
  python: {
    enabled: false,
    poolSize: 1
  },

  // Security settings
  security: {
    enableCSRF: true,
    trustProxy: false
  },

  // Static file serving
  static: {
    enabled: true,
    path: 'public'
  },

  // File Upload Configuration
  fileUpload: {
    // Storage strategy: 'memory' | 'temp' | 'custom'
    // - memory: Store files in memory (default for dev, no cleanup needed)
    // - temp: Store in temporary directory (good for production)
    // - custom: Use custom uploadDir path
    storage: process.env.NODE_ENV === 'production' ? 'temp' : 'memory',

    // Custom upload directory (only used when storage: 'custom')
    uploadDir: process.env.UPLOAD_DIR || './uploads',

    // File size limits (smaller defaults for minimal template)
    maxFileSize: 10 * 1024 * 1024,        // 10MB per file
    maxTotalFileSize: 50 * 1024 * 1024,   // 50MB total per request
    maxFields: 50,                        // Max form fields per request
    maxFieldsSize: 10 * 1024 * 1024,      // 10MB total field data

    // Security settings
    security: {
      // Allowed file extensions (basic set for minimal template)
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'],

      // Allowed MIME types
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain'
      ],

      // Blocked extensions (takes precedence over allowed)
      blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'],

      // Enable filename sanitization
      sanitizeFilenames: true,

      // Block path traversal patterns
      blockPathTraversal: true,

      // Require file extensions
      requireExtension: true,

      // File content validation
      validateMimeHeaders: true,
    },

    // Rate limiting (per IP address)
    rateLimit: {
      enabled: true,
      maxUploads: 20,           // Max uploads per window (smaller for minimal)
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many uploads, please try again later.'
    },

    // File cleanup (for temp and custom storage)
    cleanup: {
      enabled: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      checkInterval: 60 * 60 * 1000, // Check every hour
    },

    // Development settings
    development: {
      // Log upload details in development (minimal for this template)
      verbose: false,

      // Allow dangerous files in development (for testing)
      allowDangerousFiles: false,

      // Disable rate limiting in development
      disableRateLimit: true,
    }
  }
};