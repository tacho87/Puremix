// Staging Environment Configuration
// This file overrides puremix.config.js for staging deployments

export default {
  // Staging mode detection
  isDev: false,

  // Disable hot reload in staging for performance (production-like behavior)
  hotReload: false,

  // Staging debug settings (limited debugging for troubleshooting)
  showDebugInProduction: true, // Show debug widget in staging for testing

  // Enable some debug logging in staging
  verboseDebug: {
    enabled: true,
    save: true,
    console: true,
    logDir: 'logs',
    maxFileSize: 20,
    maxFiles: 10,
    includeData: false, // Don't log sensitive data in staging
    trackPerformance: true
  },

  // Staging security settings (similar to production but slightly more relaxed)
  security: {
    enableCSRF: true,
    trustProxy: true
  },

  // Staging session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'staging-secret-key-change-in-production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false, // May not have HTTPS in staging
    httpOnly: true,
    sameSite: 'lax' // More relaxed for testing
  },

  // Staging file upload settings
  fileUpload: {
    storage: 'temp',
    uploadDir: process.env.UPLOAD_DIR || './uploads',

    // Moderate file size limits in staging
    maxFileSize: 25 * 1024 * 1024,        // 25MB per file
    maxTotalFileSize: 100 * 1024 * 1024,  // 100MB total
    maxFields: 75,
    maxFieldsSize: 15 * 1024 * 1024,      // 15MB

    // Security settings (allow more file types for testing)
    security: {
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.csv', '.docx', '.xlsx', '.zip'],
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain', 'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip'
      ],
      blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.jar', '.app', '.deb', '.pkg', '.dmg', '.msi'],
      sanitizeFilenames: true,
      blockPathTraversal: true,
      requireExtension: true,
      virusScanning: false,
      validateMimeHeaders: true,
    },

    // Moderate rate limiting in staging
    rateLimit: {
      enabled: true,
      maxUploads: 25,           // Moderate limit
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many uploads, please try again later.'
    },

    // Regular cleanup in staging
    cleanup: {
      enabled: true,
      maxAge: 6 * 60 * 60 * 1000, // 6 hours
      checkInterval: 60 * 60 * 1000, // Check every hour
    },

    // Staging settings
    development: {
      verbose: true,
      allowDangerousFiles: false,
      disableRateLimit: false,
    }
  },

  // Python integration in staging
  python: {
    enabled: true,
    poolSize: 3 // Moderate pool size for staging
  }
};