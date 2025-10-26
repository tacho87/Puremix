export default {
  // Server configuration
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',

  // Application directory
  appDir: 'app',

  // Development mode
  isDev: process.env.NODE_ENV !== 'production',

  // Hot reload configuration
  hotReload: {
    enabled: true,
    port: 3002,
    ignored: ['node_modules/**', '.git/**', 'logs/**']
  },

  // Python integration
  pythonTimeout: 30000, // 30 seconds

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    name: 'puremix.sid'
  },

  // Verbose debugging (set VERBOSE_DEBUG=true to enable)
  verboseDebug: {
    enabled: process.env.VERBOSE_DEBUG === 'true',
    level: process.env.DEBUG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
    console: true,
    save: process.env.NODE_ENV !== 'production',
    includeData: process.env.NODE_ENV !== 'production'
  }
};
