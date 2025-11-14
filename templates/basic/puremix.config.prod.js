// Production Environment Configuration
// This file overrides puremix.config.js for production deployments

export default {
  // Production mode detection (explicitly set)
  isDev: false,

  // Disable hot reload and file watching in production for performance
  hotReload: false,

  // Production debug settings
  showDebugInProduction: false,

  // Disable verbose debug in production
  verboseDebug: {
    enabled: false,
    save: false,
    console: false,
    logDir: 'logs',
    maxFileSize: 10,
    maxFiles: 30,
    includeData: false,
    trackPerformance: false
  },

  // Production security settings
  security: {
    enableCSRF: true,
    trustProxy: true
  },

  // Production session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-secret-key-in-production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: true, // HTTPS required in production
    httpOnly: true,
    sameSite: 'strict'
  },

  // Production file upload settings
  fileUpload: {
    storage: 'temp', // Use temp storage in production
    uploadDir: process.env.UPLOAD_DIR || './uploads',

    // Smaller file size limits in production
    maxFileSize: 10 * 1024 * 1024,        // 10MB per file (reduced from 50MB)
    maxTotalFileSize: 50 * 1024 * 1024,  // 50MB total (reduced from 200MB)
    maxFields: 50,                        // Reduced from 100
    maxFieldsSize: 10 * 1024 * 1024,      // 10MB (reduced from 20MB)

    // Enhanced security in production
    security: {
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.csv'],
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain', 'text/csv'
      ],
      blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.pkg', '.dmg', '.msi', '.zip', '.rar', '.tar', '.gz'],
      sanitizeFilenames: true,
      blockPathTraversal: true,
      requireExtension: true,
      virusScanning: false, // Set to true if you have virus scanning service
      validateMimeHeaders: true,
    },

    // Stricter rate limiting in production
    rateLimit: {
      enabled: true,
      maxUploads: 10,           // Reduced from 50
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many uploads, please try again later.'
    },

    // Aggressive cleanup in production
    cleanup: {
      enabled: true,
      maxAge: 1 * 60 * 60 * 1000, // 1 hour (reduced from 24 hours)
      checkInterval: 30 * 60 * 1000, // Check every 30 minutes
    },

    // Production settings
    development: {
      verbose: false,
      allowDangerousFiles: false,
      disableRateLimit: false,
    }
  },

  // Python integration in production
  python: {
    enabled: true,
    poolSize: 2 // Reduced pool size in production
  }
};