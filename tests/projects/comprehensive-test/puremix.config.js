export default {
  // Server configuration
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  
  // App configuration
  appDir: 'app',
  
  // Development settings
  isDev: process.env.NODE_ENV !== 'production',
  hotReload: process.env.NODE_ENV !== 'production',
  
  // Python settings
  pythonTimeout: 30000,

  // Python Worker Persistence Configuration
  pythonPersistence: {
    // Enable/disable persistent globals between Python requests
    enabled: true,

    // Memory management settings
    memory: {
      // Maximum number of persistent globals per worker
      maxGlobals: process.env.PYTHON_MAX_GLOBALS ? parseInt(process.env.PYTHON_MAX_GLOBALS) : 100,

      // Maximum size per global in bytes (1MB default)
      maxGlobalSize: process.env.PYTHON_MAX_GLOBAL_SIZE ? parseInt(process.env.PYTHON_MAX_GLOBAL_SIZE) : 1024 * 1024,

      // Time-to-live for globals in seconds (1 hour default)
      globalTTL: process.env.PYTHON_GLOBAL_TTL ? parseInt(process.env.PYTHON_GLOBAL_TTL) : 3600,

      // Cleanup interval (every N requests)
      cleanupInterval: process.env.PYTHON_CLEANUP_INTERVAL ? parseInt(process.env.PYTHON_CLEANUP_INTERVAL) : 100,

      // Memory usage warning threshold (0.8 = 80%)
      memoryWarningThreshold: process.env.PYTHON_MEMORY_WARNING ? parseFloat(process.env.PYTHON_MEMORY_WARNING) : 0.8
    },

    // Security settings
    security: {
      // Enable JSON serialization validation for stored values
      requireSerializable: process.env.PYTHON_REQUIRE_SERIALIZABLE !== 'false',

      // Prevent storing executable code (functions, methods, etc.)
      preventCodeStorage: process.env.PYTHON_PREVENT_CODE_STORAGE !== 'false',

      // Allow protected globals to be modified (not recommended)
      allowProtectedModification: process.env.PYTHON_ALLOW_PROTECTED === 'true'
    },

    // Logging and monitoring
    logging: {
      // Enable detailed persistence debugging logs
      enableDebugLogs: process.env.NODE_ENV === 'development',

      // Log persistence statistics at intervals
      logStatsInterval: process.env.PYTHON_STATS_INTERVAL ? parseInt(process.env.PYTHON_STATS_INTERVAL) : 1000,

      // Log memory warnings
      logMemoryWarnings: true
    },

    // Advanced settings
    advanced: {
      // Enable automatic expired global cleanup
      autoCleanup: process.env.PYTHON_AUTO_CLEANUP !== 'false',

      // Least Recently Used (LRU) eviction when at capacity
      enableLRUEviction: process.env.PYTHON_LRU_EVICTION !== 'false',

      // Preload common ML libraries in persistent namespace
      preloadLibraries: process.env.PYTHON_PRELOAD_LIBRARIES !== 'false',

      // Custom protected globals (comma-separated list)
      protectedGlobals: process.env.PYTHON_PROTECTED_GLOBALS ?
        process.env.PYTHON_PROTECTED_GLOBALS.split(',') : []
    }
  },
  
  // VerboseDebug logging system (enabled for testing)
  verboseDebug: {
    enabled: true,
    save: true,
    console: true,
    includeData: true, // Show data in dev mode
    trackPerformance: true
  },
  
  // Security settings (customize for production)
  security: {
    enableCSRF: true,
    trustProxy: false,
    csp: {
      enabled: false
    }
  },

  session: {
    secret: process.env.SESSION_SECRET || 'puremix-test-secret-key',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

    // File size limits
    maxFileSize: 50 * 1024 * 1024,        // 50MB per file
    maxTotalFileSize: 200 * 1024 * 1024,  // 200MB total per request
    maxFields: 100,                       // Max form fields per request
    maxFieldsSize: 20 * 1024 * 1024,      // 20MB total field data

    // Security settings
    security: {
      // Allowed file extensions (case insensitive)
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.csv', '.docx', '.xlsx'],

      // Allowed MIME types
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain', 'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],

      // Blocked extensions (takes precedence over allowed)
      blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.pkg', '.dmg', '.msi'],

      // Enable filename sanitization
      sanitizeFilenames: true,

      // Block path traversal patterns
      blockPathTraversal: true,

      // Require file extensions
      requireExtension: true,

      // Enable virus scanning (requires external service)
      virusScanning: false,

      // File content validation
      validateMimeHeaders: true,
    },

    // Rate limiting (per IP address)
    rateLimit: {
      enabled: true,
      maxUploads: 50,           // Max uploads per window
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
      // Log upload details in development
      verbose: true,

      // Allow dangerous files in development (for testing)
      allowDangerousFiles: false,

      // Disable rate limiting in development
      disableRateLimit: true,
    }
  }
};