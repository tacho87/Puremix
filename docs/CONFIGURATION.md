# PureMix Configuration Guide

## Overview

PureMix uses a flexible configuration system with `puremix.config.js` as the main configuration file. The framework supports environment-specific overrides and comprehensive customization options for all aspects of your application.

## Configuration Files

### Main Configuration: `puremix.config.js`

The primary configuration file in your project root.

```javascript
export default {
  // Core settings
  appDir: 'app',
  port: 3000,
  host: '0.0.0.0',
  
  // Environment detection
  isDev: true,
  hotReload: true,
  
  // Additional configuration sections...
};
```

### Environment-Specific Configuration

Create environment-specific files that override the base configuration:

- `puremix.config.dev.js` - Development environment (NODE_ENV=development)
- `puremix.config.prod.js` - Production environment (NODE_ENV=production) 
- `puremix.config.staging.js` - Staging environment (NODE_ENV=staging)

The framework automatically loads and merges configurations based on the `NODE_ENV` environment variable.

## Core Configuration Options

### Server Settings

```javascript
export default {
  // Server configuration
  port: 3000,              // Server port (default: process.env.PORT || 3000)
  host: '0.0.0.0',         // Server host (default: '0.0.0.0')
  appDir: 'app',           // Application directory (default: 'app')
  
  // Environment control
  isDev: true,             // Development mode (default: NODE_ENV !== 'production')
  hotReload: true,         // Enable file watching (default: true)
  
  // Performance
  pythonTimeout: 30000,    // Python execution timeout in ms (default: 30000)
  showDebugInProduction: false, // Show debug box in production (default: false)
};
```

### Session Configuration

```javascript
export default {
  session: {
    secret: 'change-this-secret-key-in-production',  // Required: Session secret
    maxAge: 1000 * 60 * 60 * 24 * 7,               // Session age: 1 week
    secure: false,                                  // HTTPS-only cookies
    httpOnly: true,                                 // Prevent XSS
    sameSite: 'strict',                             // CSRF protection
    resave: false,
    saveUninitialized: false,
    rolling: true
  }
};
```

**Production Security Note:**
```javascript
// production configuration
export default {
  session: {
    secret: process.env.SESSION_SECRET || 'use-env-variable-in-production',
    secure: true,        // Only send over HTTPS
    maxAge: 24 * 60 * 60 * 1000  // 24 hours for production
  }
};
```

## Debug Logging Configuration

PureMix includes comprehensive logging with rotating files and performance tracking.

```javascript
export default {
  verboseDebug: {
    enabled: true,          // Enable verbose logging
    save: true,            // Save to rotating log files
    console: true,         // Output to console/PM2/Docker logs
    logDir: 'logs',        // Directory for log files
    maxFileSize: 10,       // Max file size in MB before rotation
    maxFiles: 30,          // Max number of log files to keep
    includeData: false,    // Include sensitive data in logs
    trackPerformance: true,// Track performance metrics
    
    // Log level override (optional)
    level: 'debug'         // 'error' | 'warn' | 'info' | 'debug'
  }
};
```

### Log Levels

The logging system respects these priorities:
- `error` (3) - Only critical errors
- `warn` (2) - Warnings and errors  
- `info` (1) - General info, warnings, errors
- `debug` (0) - All logging information

**Environment Detection:**
- **Production:** Only `error` level messages automatically
- **Development:** All `debug` level messages
- **Manual Override:** Set specific `level` in config

### Performance Logging

When `trackPerformance` is enabled, the framework tracks:
- Request duration and bottlenecks
- Template rendering performance
- Python execution times
- Component rendering metrics
- Import resolution performance

## Python Integration Configuration

PureMix provides seamless Python integration with process pooling.

```javascript
export default {
  python: {
    enabled: true,         // Enable Python integration
    poolSize: 3,          // Number of Python worker processes
    timeout: 30000,       // Python execution timeout
    command: 'python3',   // Python command to use
    tempDir: '.temp'      // Directory for temporary Python files
  }
};
```

### Python Library Interfaces

Direct access to popular Python libraries:

```javascript
// In your .puremix files
const result = await request.python.numpy.array([1, 2, 3, 4, 5]);
const df = await request.python.pandas.DataFrame(data);
const model = await request.python.sklearn.trainModel('linear_regression', X, y);
```

### Python Auto-Discovery

The framework automatically discovers and registers Python functions from all `.py` files in your `app/` directory at startup. No imports required - functions are available globally.

## Security Configuration

### CSRF Protection

```javascript
export default {
  security: {
    enableCSRF: true,      // Enable CSRF token protection
    trustProxy: false,     // Trust proxy headers (for load balancers)
    
    // Content Security Policy
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
};
```

### Input Sanitization

The framework automatically sanitizes:
- Form inputs and query parameters
- File upload names and paths
- Template expressions to prevent XSS
- SQL injection attempts
- Command injection attempts

## Static File Serving

```javascript
export default {
  static: {
    enabled: true,         // Enable static file serving
    path: 'public',       // Static files directory
    maxAge: 86400000,     // Cache age: 24 hours
    etag: true,          // Enable ETag headers
    lastModified: true    // Enable Last-Modified headers
  }
};
```

## File Upload Configuration

PureMix provides comprehensive file upload handling with security and performance optimization.

```javascript
export default {
  fileUpload: {
    // Storage strategy
    storage: 'memory',    // 'memory' | 'temp' | 'custom'
    
    // Custom upload directory (when storage: 'custom')
    uploadDir: './uploads',
    
    // File size limits
    maxFileSize: 50 * 1024 * 1024,        // 50MB per file
    maxTotalFileSize: 200 * 1024 * 1024,  // 200MB total per request
    maxFields: 100,                       // Max form fields
    maxFieldsSize: 20 * 1024 * 1024,      // 20MB field data
    
    // Security settings
    security: {
      // Allowed file extensions
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.csv'],
      
      // Allowed MIME types
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain', 'text/csv'
      ],
      
      // Blocked extensions (takes precedence)
      blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'],
      
      // Security features
      sanitizeFilenames: true,     // Clean dangerous characters
      blockPathTraversal: true,    // Prevent ../ attacks
      requireExtension: true,      // Require file extensions
      validateMimeHeaders: true    // Validate MIME headers
    },
    
    // Rate limiting (per IP)
    rateLimit: {
      enabled: true,
      maxUploads: 50,              // Max uploads per window
      windowMs: 15 * 60 * 1000,    // 15 minutes
      message: 'Too many uploads, please try again later.'
    },
    
    // File cleanup (for temp/custom storage)
    cleanup: {
      enabled: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      checkInterval: 60 * 60 * 1000 // Check every hour
    }
  }
};
```

### Production File Upload Configuration

```javascript
// puremix.config.prod.js
export default {
  fileUpload: {
    storage: 'temp',           // Use temp storage in production
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    
    security: {
      enableVirusScanning: process.env.VIRUS_SCAN_ENABLED === 'true',
      // More restrictive in production
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
    },
    
    // Enable rate limiting in production
    rateLimit: {
      enabled: true,
      maxUploads: 20,          // Lower limit for production
      windowMs: 15 * 60 * 1000
    }
  }
};
```

## Environment Variables

PureMix respects standard environment variables:

```bash
# Server configuration
NODE_ENV=production          # Environment: development | staging | production
PORT=3000                    # Server port
HOST=0.0.0.0                # Server host

# Security
SESSION_SECRET=your-secret-key-here
CSRF_SECRET=your-csrf-secret

# File uploads
UPLOAD_DIR=/var/uploads
MAX_FILE_SIZE=52428800       # 50MB in bytes

# Python
PYTHON_COMMAND=python3
PYTHON_TIMEOUT=30000

# Logging
LOG_LEVEL=info              # error | warn | info | debug
LOG_DIR=/var/log/puremix
```

## Development vs Production Configuration

### Development Configuration Example

```javascript
// puremix.config.js (development)
export default {
  appDir: 'app',
  port: 3000,
  isDev: true,
  hotReload: true,
  
  session: {
    secret: 'dev-secret-key',
    secure: false,        // No HTTPS in development
    maxAge: 7 * 24 * 60 * 60 * 1000  // 1 week
  },
  
  verboseDebug: {
    enabled: true,
    level: 'debug',       // All logging in development
    includeData: true,    // Include data for debugging
    trackPerformance: true,
    console: true,
    save: true
  },
  
  python: {
    enabled: true,
    poolSize: 2          // Fewer workers in development
  },
  
  fileUpload: {
    storage: 'memory',    // In-memory storage for development
    rateLimit: {
      enabled: false     // No rate limiting in development
    }
  },
  
  security: {
    enableCSRF: true,
    trustProxy: false
  }
};
```

### Production Configuration Example

```javascript
// puremix.config.prod.js (production overrides)
export default {
  port: process.env.PORT || 80,
  isDev: false,
  hotReload: false,       // No hot reload in production
  
  session: {
    secret: process.env.SESSION_SECRET,
    secure: true,         // HTTPS only
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  },
  
  verboseDebug: {
    enabled: true,        // Still enable logging in production
    level: 'error',       // Only errors in production
    includeData: false,   // Don't log sensitive data
    trackPerformance: true,
    console: true,
    save: true
  },
  
  python: {
    enabled: true,
    poolSize: 4,          // More workers for production
    timeout: 60000        // Longer timeout for production
  },
  
  fileUpload: {
    storage: 'temp',      // Temp storage for production
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    rateLimit: {
      enabled: true,      // Enable rate limiting
      maxUploads: 20      // Conservative limits
    }
  },
  
  security: {
    enableCSRF: true,
    trustProxy: true      // Trust proxy behind load balancer
  }
};
```

## Configuration Loading Process

1. **Base Configuration**: Load `puremix.config.js`
2. **Environment Override**: Load `puremix.config.{env}.js` if exists
3. **Environment Variables**: Apply any environment variable overrides
4. **Defaults**: Apply framework defaults for missing values

The configuration is merged with environment-specific values taking precedence over base values.

## Configuration Validation

PureMix validates configuration on startup and provides helpful error messages:

```javascript
// Invalid configuration example
export default {
  port: 'invalid-port',  // Will show error: Port must be a number
  session: {
    // Missing required 'secret' field
  }
};

// Startup error:
// ❌ Invalid configuration:
//    - port: must be a number, got string
//    - session.secret: required field missing
```

## Next Steps

- Create your `puremix.config.js` based on the examples above
- Set up environment-specific configurations for production
- Configure security settings appropriately for your environment
- Set up monitoring and logging for production deployments

For more configuration examples, see the template configurations in the `templates/` directory:
- `templates/basic/puremix.config.js` - Full-featured configuration
- `templates/minimal/puremix.config.js` - Minimal configuration
- `templates/advanced/puremix.config.js` - Production-ready configuration