/**
 * PureMixEngine - Core Framework Engine
 * 
 * PURPOSE: Server-side rendering framework that seamlessly mixes JavaScript/TypeScript/Python
 * ARCHITECTURE: Express.js wrapper + File-based routing + Template processing + Python integration
 * 
 * FLOW DIAGRAM:
 * 1. Request → Route Resolution → File Parsing
 * 2. Import Resolution → Loader Execution → Template Rendering  
 * 3. Component Processing → HTML Generation → Response
 * 
 * DEPENDENCIES:
 * - Express.js for HTTP server and middleware
 * - FileParser for .puremix file processing
 * - PythonExecutor for Python/JS interop
 * - TemplateEngine for JSX-like template processing
 * - ImportResolver for smart module resolution
 */

import express from 'express';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import crypto from 'crypto';
import FileParser from './file-parser';
import PythonExecutor from './python-executor';
import ImportResolver from './import-resolver';
import { TemplateEngineInterpreter as TemplateEngine } from './template-engine-interpreter';
import { generateClientRuntime } from './client-runtime';
import { sanitizer } from './sanitizer';
import { initializeLogger, getLogger, createLoggingMiddleware, type VerboseDebugConfig } from './debug-logger';

// Augment Express Request type for our custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      debugContext?: any;
      files?: Record<string, any>; // Files from multipart uploads
    }
  }
}
import type { PureMixRequest, LoaderResults, ComponentInfo, ComponentInstance, ComponentRenderResult, ParsedFile } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PureMixEngine - Main Framework Class
 * 
 * CORE FUNCTIONALITY:
 * - File-based routing for .puremix pages and API endpoints
 * - Server-side rendering with loader/action pattern
 * - Component system for reusable .puremix files
 * - Seamless JavaScript/TypeScript/Python integration
 * - Hot reload for development
 * 
 * STATE MANAGEMENT:
 * - routes: Map of URL patterns to parsed .puremix files
 * - serverFunctions: Map of server functions from <script server> blocks
 * - components: Map of reusable .puremix components
 * - importCache: Cache for resolved imports
 */
class PureMixEngine {
  private config: any;                    // Framework configuration
  private app: express.Application;       // Express.js app instance
  private routes: Map<string, any>;       // URL patterns → parsed route data
  private serverFunctions: Map<string, Function>; // Route functions for actions
  private components: Map<string, ComponentInfo>; // Reusable .puremix components
  private componentInstances: Map<string, ComponentInstance>; // Active component instances
  private importCache: Map<string, any>;  // Import resolution cache
  private globalPythonFunctions: Map<string, Function>; // Global Python functions for direct calls
  private fileParser: FileParser;         // Parses .puremix files
  private pythonExecutor: PythonExecutor; // Python/JS interop
  private importResolver: ImportResolver; // Smart import system
  private templateEngine: TemplateEngine; // JSX-like template processing
  private viewsDir: string;               // Views directory for layouts
  private server?: any;                   // HTTP server instance

  /**
   * Constructor - Initialize PureMix Framework
   * 
   * INPUT: config object with optional settings
   * OUTPUT: Configured PureMixEngine instance
   * GOAL: Set up Express app, parsers, and framework state
   * DEPENDENCIES: All imported framework components
   */
  constructor(config: any = {}) {
    // Merge user config with sensible defaults
    this.config = {
      port: process.env.PORT || 3000,       // Server port
      appDir: config.appDir || 'app',       // Application directory
      isDev: process.env.NODE_ENV !== 'production', // Development mode
      pythonTimeout: config.pythonTimeout || 30000, // Python execution timeout
      hotReload: config.hotReload !== false, // File watching enabled
      verboseDebug: config.verboseDebug || { enabled: false }, // Verbose debug logging
      ...config
    };

    // Initialize debug logger if enabled
    if (this.config.verboseDebug?.enabled) {
      initializeLogger({
        enabled: true,
        save: this.config.verboseDebug.save !== false, // Default to true
        console: this.config.verboseDebug.console !== false, // Default to true
        logDir: this.config.verboseDebug.logDir || 'logs',
        includeData: this.config.verboseDebug.includeData || false,
        trackPerformance: this.config.verboseDebug.trackPerformance !== false,
        ...this.config.verboseDebug
      });
    }

    this.app = express();
    this.routes = new Map();
    this.serverFunctions = new Map();
    this.components = new Map();
    this.componentInstances = new Map();
    this.importCache = new Map();
    this.globalPythonFunctions = new Map();

    this.pythonExecutor = new PythonExecutor(this.config);
    this.importResolver = new ImportResolver(this.config.appDir, this.pythonExecutor);
    this.fileParser = new FileParser(this.importResolver, this);
    this.templateEngine = new TemplateEngine(this);
    this.viewsDir = path.join(process.cwd(), this.config.appDir, 'views');

    this.setupExpress();
    this.loadEnvironment();
  }

  /**
   * setupExpress - Configure Express.js middleware stack
   * 
   * INPUT: None (uses this.app)
   * OUTPUT: Configured Express application
   * GOAL: Set up security, sessions, static files, and internal APIs
   * DEPENDENCIES: Express.js, session middleware
   */
  setupExpress(): void {

    // Debug logging middleware (must be first to capture all requests)
    this.app.use(createLoggingMiddleware());




    // Basic middleware for request parsing
    this.app.use(express.json({ limit: '50mb' }));    // Parse JSON bodies
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse form-encoded bodies

    // NORMALIZATION: Handle both JSON and form-encoded data
    this.app.use((req, res, next) => {
      if (req.url === '/_puremix/action' && req.method === 'POST') {
        console.log('🔄 NORMALIZATION MIDDLEWARE:');
        console.log('  🔄 Content-Type:', req.headers['content-type']);
        console.log('  🔄 req.body:', req.body);
        console.log('  🔄 typeof req.body:', typeof req.body);

        // If this is a native form submission, it needs to be converted to our expected format
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
          console.log('🔄 NATIVE FORM DETECTED: Converting form data to expected format');

          // Native form submission structure:
          // { action: 'calculateCustomLoan', route: '/python-financial-test', principal: '250000', rate: '4.5', ... }

          // Extract action and route
          const { action, route, ...formFields } = req.body;

          // Convert form fields to our expected data structure
          const convertedData = {};
          for (const [key, value] of Object.entries(formFields)) {
            // Auto-convert string values to appropriate types
            convertedData[key] = this.autoConvertValue(value);
          }

          // Create the normalized request body structure
          req.body = {
            action: action,
            data: convertedData,
            route: route
          };

          console.log('🔄 NORMALIZED FORM SUBMISSION:');
          console.log('  🔄 action:', req.body.action);
          console.log('  🔄 data:', req.body.data);
          console.log('  🔄 route:', req.body.route);
        }
      }
      next();
    });



    // Handle multipart/form-data (file uploads) before urlencoded
    this.app.use((req, res, next) => {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Get file upload configuration
        const uploadConfig = this.config.fileUpload || {};
        const securityConfig = uploadConfig.security || {};
        const isDev = this.config.isDev;

        // Configure storage based on config
        let uploadDir;
        let uploadDirFunction;

        switch (uploadConfig.storage) {
          case 'memory':
            // Store files in memory (no file system access)
            uploadDirFunction = () => false; // Return false for memory storage
            break;
          case 'temp':
            uploadDirFunction = undefined; // Use formidable default temp directory
            break;
          case 'custom':
            uploadDir = uploadConfig.uploadDir || './uploads';
            break;
          default:
            // Default to memory in development, temp in production
            if (isDev) {
              uploadDirFunction = () => false; // Memory storage
            } else {
              uploadDirFunction = undefined; // Temp directory
            }
        }

        const form = formidable({
          maxFileSize: uploadConfig.maxFileSize || 50 * 1024 * 1024,
          maxFields: uploadConfig.maxFields || 100,
          maxTotalFileSize: uploadConfig.maxTotalFileSize || 200 * 1024 * 1024,
          maxFieldsSize: uploadConfig.maxFieldsSize || 20 * 1024 * 1024,
          keepExtensions: true,
          allowEmptyFiles: false,
          hashAlgorithm: 'sha1',
          ...(uploadDir && { uploadDir }),
          ...(uploadDirFunction && { uploadDirFunction }),
          filter: function ({ name, originalFilename, mimetype }) {
            if (!originalFilename) return false;

            // Check extension requirement
            if (securityConfig.requireExtension && !originalFilename.includes('.')) {
              console.log('🚫 Upload blocked: No file extension');
              return false;
            }

            // Block path traversal if enabled
            if (securityConfig.blockPathTraversal) {
              if (originalFilename.includes('../') || originalFilename.includes('..\\')) {
                console.log('🚫 Upload blocked: Path traversal detected');
                return false;
              }
            }

            // Check blocked extensions (takes precedence)
            const blockedExts = securityConfig.blockedExtensions || ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.pkg', '.dmg', '.msi'];
            const ext = originalFilename.toLowerCase();
            if (blockedExts.some(badExt => ext.endsWith(badExt))) {
              console.log('🚫 Upload blocked: Dangerous extension:', ext);
              return false;
            }

            // Check allowed extensions
            const allowedExts = securityConfig.allowedExtensions;
            if (allowedExts && allowedExts.length > 0) {
              const hasAllowedExt = allowedExts.some(allowedExt => ext.endsWith(allowedExt.toLowerCase()));
              if (!hasAllowedExt) {
                console.log('🚫 Upload blocked: Extension not in allowlist:', ext);
                return false;
              }
            }

            return true;
          }
        });

        form.parse(req, (err, fields, files): void => {
          if (err) {
            console.error('🚫 File upload error:', err);
            res.status(400).json({ error: 'File upload failed', details: err.message });
            return;
          }

          // Process fields (formidable returns arrays for each field)
          const processedFields: Record<string, any> = {};
          Object.entries(fields).forEach(([key, value]) => {
            processedFields[key] = Array.isArray(value) && value.length === 1 ? value[0] : value;
          });

          // Process files (formidable returns arrays for each file field)
          const processedFiles: Record<string, any> = {};
          Object.entries(files).forEach(([key, value]) => {
            const fileArray = Array.isArray(value) ? value : [value];

            const processedFileArray = fileArray.map(file => {
              // Enhance file object with storage information
              const enhancedFile = {
                ...file,
                // Add storage type information
                storageType: uploadConfig.storage === 'memory' || (isDev && !uploadConfig.storage) ? 'memory' : 'file',
                // For memory storage, ensure we have buffer data
                ...(uploadConfig.storage === 'memory' && {
                  buffer: file.buffer || (file.filepath ? fs.readFileSync(file.filepath) : null)
                })
              };

              // Log file processing details in development
              if (isDev && uploadConfig.development?.verbose) {
                console.log(`📁 Processed file: ${file.originalFilename} (${enhancedFile.storageType} storage)`);
              }

              return enhancedFile;
            });

            processedFiles[key] = processedFileArray.length === 1 ? processedFileArray[0] : processedFileArray;
          });

          // Set processed data on request
          req.body = processedFields;
          req.files = processedFiles;

          console.log(`📁 File upload processed: ${Object.keys(processedFiles).length} file(s), ${Object.keys(processedFields).length} field(s)`);
          next();
        });
      } else {
        next();
      }
    });

    // Only parse URL-encoded data for actual form submissions, not JSON requests
    this.app.use((req, res, next) => {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        // Use urlencoded parser only for form data
        express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
      } else {
        // Skip urlencoded parsing for JSON and other content types
        next();
      }
    });
    this.app.use(cookieParser());                     // Parse cookies

    // Automatic input sanitization (lightweight, non-breaking)
    this.app.use((req, res, next) => {
      const logger = getLogger();
      const startTime = performance.now();

      try {
        let sanitizationEvents: any[] = [];
        let totalFields = 0;
        let sanitizedFields: string[] = [];

        // Only sanitize POST/PUT/PATCH requests with body data
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
          totalFields = Object.keys(req.body).length;

          // Basic sanitization - removes dangerous patterns but preserves functionality
          const result = sanitizer.sanitize(req.body);
          if (result.isValid) {
            req.body = result.data;
            sanitizedFields = result.sanitized;

            // Store sanitization info for debugging (dev mode only)
            if (this.config.isDev && result.sanitized.length > 0) {
              console.log(`🛡️  Sanitized fields: ${result.sanitized.join(', ')}`);
            }
          } else {
            // In production, sanitize anyway but log errors
            req.body = result.data;
            sanitizedFields = result.sanitized;

            if (this.config.isDev) {
              console.warn('⚠️  Input validation warnings:', result.errors);
            }

            // Log validation errors as security events
            result.errors.forEach(error => {
              sanitizationEvents.push({
                type: 'validation_error',
                severity: 'medium',
                details: error,
                blocked: false
              });
            });
          }
        }

        // Sanitize query parameters for GET requests
        if (req.query && Object.keys(req.query).length > 0) {
          totalFields += Object.keys(req.query).length;
          const queryResult = sanitizer.sanitize(req.query);
          req.query = queryResult.data;
          sanitizedFields.push(...queryResult.sanitized);
        }

        // Log sanitization results
        if (logger && (sanitizedFields.length > 0 || sanitizationEvents.length > 0)) {
          getLogger()?.logSanitization(req.debugContext || {}, {
            totalFields,
            sanitizedFields,
            errors: [],
            warnings: [],
            securityEvents: sanitizationEvents,
            duration: performance.now() - startTime
          });
        }

        next();
      } catch (error) {
        console.error('Sanitization error:', error);

        // Log sanitization error
        if (logger) {
          getLogger()?.logError(req.debugContext || {}, error as Error, { phase: 'sanitization' });
        }

        // Don't break the request - continue without sanitization
        next();
      }
    });

    // Session middleware
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'puremix-dev-secret',
      resave: false,
      saveUninitialized: true, // Allow sessions to be created for CSRF tokens
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Allow cross-origin requests for AJAX
      }
    }));

    // CSRF Protection
    this.app.use((req, res, next) => {
      if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      }
      res.locals.csrfToken = req.session.csrfToken;
      next();
    });

    // Basic security headers (lightweight, non-breaking)
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      // Only set CSP in production to avoid breaking development tools
      if (!this.config.isDev) {
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
      }
      next();
    });

    // Serve static files
    this.app.use('/public', express.static(path.join(process.cwd(), this.config.appDir, 'public')));

    // Internal API routes
    this.setupInternalAPI();
  }

  loadEnvironment(): void {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length) {
          process.env[key.trim()] = values.join('=').trim();
        }
      });
    }
  }

  /**
   * scanRoutes - Discover and register all routes and components
   * 
   * INPUT: None (reads from config.appDir/routes)
   * OUTPUT: Populated routes and serverFunctions maps
   * GOAL: File-based routing - scan directories for .puremix and API files
   * DEPENDENCIES: File system, FileParser
   * 
   * PROCESS:
   * 1. Clear existing routes (for hot reload)
   * 2. Recursively scan routes directory
   * 3. Register .puremix files as page routes
   * 4. Register .js/.ts/.py files as API routes
   * 5. Scan components directory for reusable .puremix files
   */
  async scanRoutes(): Promise<void> {
    const routesDir = path.join(process.cwd(), this.config.appDir, 'routes');
    if (!fs.existsSync(routesDir)) {
      throw new Error(`Routes directory not found: ${routesDir}`);
    }

    // Clear existing routes for hot reload
    this.routes.clear();
    this.serverFunctions.clear();

    // Recursively scan routes directory
    await this.scanDirectory(routesDir, '');
    console.log(`🚀 Loaded ${this.routes.size} routes`);

    // Scan components directory for reusable .puremix files
    await this.scanComponents();
  }

  /**
   * scanDirectory - Recursively scan directory for routes
   * 
   * INPUT: dir (absolute path), routePath (URL path segment)
   * OUTPUT: Routes registered in this.routes and this.serverFunctions
   * GOAL: Convert file structure to URL routes
   * DEPENDENCIES: File system, registerRoute, registerAPIRoute
   * 
   * ROUTING LOGIC:
   * - .puremix files → HTML pages with SSR
   * - .js/.ts/.py in /api/ → JSON API endpoints
   * - Supports dynamic routes: [id].puremix → /:id
   * - Supports catch-all: [...slug].puremix → /*
   */
  async scanDirectory(dir: string, routePath: string): Promise<void> {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Convert dynamic folder names: [id] → :id, [...slug] → stays as is for now
        let folderSegment = item;
        if (item.startsWith('[') && item.endsWith(']')) {
          const param = item.slice(1, -1);
          // For catch-all in folders, we'll handle it differently
          if (!param.startsWith('...')) {
            folderSegment = `:${param}`;
          }
        }
        // Recursively scan subdirectories with converted folder name
        await this.scanDirectory(fullPath, path.join(routePath, folderSegment));
      } else if (item.endsWith('.puremix')) {
        // Register .puremix files as page routes
        await this.registerRoute(fullPath, routePath, item);
      } else if (routePath.startsWith('api') && (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.py'))) {
        // Register JS/TS/Python files in /api/ as API endpoints
        await this.registerAPIRoute(fullPath, routePath, item);
      }
    }
  }

  async scanComponents(): Promise<void> {
    const componentsDir = path.join(process.cwd(), this.config.appDir, 'components');
    if (!fs.existsSync(componentsDir)) {
      console.log(`📦 No components directory found (optional: ${componentsDir})`);
      return;
    }

    // Clear existing components for hot reload
    this.components.clear();

    await this.scanComponentsDirectory(componentsDir, '');
    console.log(`📦 Loaded ${this.components.size} components`);
  }

  /**
   * scanPythonModules - Discover and pre-register Python modules for language-agnostic imports
   *
   * INPUT: None (recursively scans entire config.appDir for .py files)
   * OUTPUT: Python modules registered with PythonExecutor for direct access
   * GOAL: Enable true language-agnostic programming where Python modules are callable like JS
   * DEPENDENCIES: PythonExecutor, File system
   *
   * PROCESS:
   * 1. Recursively scan ALL directories under app/ for .py files
   * 2. Parse Python files to extract function names
   * 3. Register modules with PythonExecutor for fast access
   * 4. Create JavaScript-callable wrappers for each Python function
   * 5. Skip routes directory (API endpoints handled separately)
   */
  async scanPythonModules(): Promise<void> {
    if (!this.pythonExecutor.available()) {
      console.log('🐍 Python modules: Skipped (Python not available)');
      return;
    }

    const pythonModuleCount = { discovered: 0, registered: 0, functions: 0 };
    const appRoot = path.join(process.cwd(), this.config.appDir);

    if (!fs.existsSync(appRoot)) {
      console.log(`🐍 Python modules: App directory not found (${appRoot})`);
      return;
    }

    // Recursively scan entire app directory, excluding routes (handled separately)
    await this.scanPythonDirectoryRecursive(appRoot, '', pythonModuleCount);

    if (pythonModuleCount.discovered > 0) {
      console.log(`🐍 Python modules: ${pythonModuleCount.registered}/${pythonModuleCount.discovered} modules (${pythonModuleCount.functions} functions)`);
    } else {
      console.log('🐍 Python modules: None found in app directories');
    }
  }

  /**
   * scanPythonDirectoryRecursive - Recursively scan entire app directory for Python modules
   *
   * INPUT: dir (absolute path), relativePath (logical path), moduleCount (statistics)
   * OUTPUT: Python modules registered with framework
   * GOAL: Find and register all .py files across entire app directory structure
   * EXCLUSIONS: routes directory (API endpoints), hidden directories, __pycache__
   */
  async scanPythonDirectoryRecursive(dir: string, relativePath: string, moduleCount: any): Promise<void> {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip hidden directories, __pycache__, and routes directory
        if (item.startsWith('.') || item.startsWith('__pycache__') || item === 'routes') {
          continue;
        }

        // Recursively scan subdirectories
        const newRelativePath = relativePath ? path.join(relativePath, item) : item;
        await this.scanPythonDirectoryRecursive(fullPath, newRelativePath, moduleCount);
      } else if (item.endsWith('.py') && !item.startsWith('__')) {
        // Register Python files (excluding __init__.py and other special files)
        await this.registerPythonModule(fullPath, relativePath, item, moduleCount);
      }
    }
  }

  /**
   * registerPythonModule - Register a Python file for language-agnostic access
   *
   * INPUT: filePath, contextPath, filename, moduleCount
   * OUTPUT: Python module registered with callable JavaScript wrappers
   * GOAL: Make Python functions directly callable from .puremix files
   */
  async registerPythonModule(filePath: string, contextPath: string, filename: string, moduleCount: any): Promise<void> {
    try {
      moduleCount.discovered++;

      const pythonCode = fs.readFileSync(filePath, 'utf8');

      // Extract Python function names using regex
      const functionMatches = pythonCode.match(/^def\s+(\w+)\s*\(/gm);

      if (functionMatches && functionMatches.length > 0) {
        const moduleName = filename.replace('.py', '');
        const moduleKey = path.join(contextPath, moduleName).replace(/\\/g, '/');

        // Register module with PythonExecutor for fast access
        await this.pythonExecutor.registerModule(moduleKey, filePath);

        moduleCount.registered++;
        moduleCount.functions += functionMatches.length;

        // Create global JavaScript-callable Python function wrappers
        const functionNames = functionMatches.map(match =>
          match.replace(/^def\s+(\w+)\s*\(.*/, '$1')
        );

        for (const functionName of functionNames) {
          // Create native JavaScript-style async function wrapper
          const globalWrapper = async (data: any, jsContext?: any) => {
            if (this.pythonExecutor && this.pythonExecutor.available()) {
              try {
                const result = await this.pythonExecutor.executeFile(filePath, functionName, data, jsContext);
                return result.data;  // Return just the data, not the wrapper
              } catch (error: any) {
                console.warn(`🐍 Global Python function '${functionName}' failed:`, error.message);
                throw new Error(`Python function '${functionName}' execution failed: ${error.message}`);
              }
            } else {
              throw new Error(`Python not available for function '${functionName}'`);
            }
          };

          // Register function globally with descriptive name
          // Sanitize moduleName to be a valid JavaScript identifier (replace hyphens etc with underscores)
          const sanitizedModuleName = moduleName.replace(/[^a-zA-Z0-9_]/g, '_');
          const globalFunctionName = `${sanitizedModuleName}_${functionName}`;
          this.globalPythonFunctions.set(globalFunctionName, globalWrapper);

          // Also register with simple function name (if no conflict)
          if (!this.globalPythonFunctions.has(functionName)) {
            this.globalPythonFunctions.set(functionName, globalWrapper);
          }
        }

        // Log in development mode
        if (this.config.isDev && this.config.verboseDebug?.enabled) {
          const sanitizedModuleName = moduleName.replace(/[^a-zA-Z0-9_]/g, '_');
          console.log(`   📜 ${moduleKey}: ${functionNames.join(', ')} (global: ${functionNames.map(f => `${sanitizedModuleName}_${f}`).join(', ')})`);
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ Failed to register Python module ${filename}:`, error.message);
    }
  }

  /**
   * getGlobalPythonFunction - Get a global Python function for direct calling
   *
   * INPUT: functionName (string)
   * OUTPUT: Async function that calls Python directly
   * GOAL: Enable native JavaScript-style Python function calls like await processPythonML({})
   */
  getGlobalPythonFunction(functionName: string): Function | null {
    return this.globalPythonFunctions.get(functionName) || null;
  }

  /**
   * getAllGlobalPythonFunctions - Get all available global Python functions
   *
   * INPUT: None
   * OUTPUT: Map of all global Python functions
   * GOAL: Provide access to complete Python function registry
   */
  getAllGlobalPythonFunctions(): Map<string, Function> {
    return this.globalPythonFunctions;
  }

  /**
   * listGlobalPythonFunctions - Get list of available global Python function names
   *
   * INPUT: None
   * OUTPUT: Array of function names
   * GOAL: Enable discovery of available Python functions
   */
  listGlobalPythonFunctions(): string[] {
    return Array.from(this.globalPythonFunctions.keys());
  }

  /**
   * getRoutes - Get all registered routes (for testing)
   *
   * INPUT: None
   * OUTPUT: Map of all registered routes
   * GOAL: Enable testing access to route registry
   */
  getRoutes(): Map<string, any> {
    return this.routes;
  }

  /**
   * getServerFunctions - Get all registered server functions (for testing)
   *
   * INPUT: None
   * OUTPUT: Map of all server functions
   * GOAL: Enable testing access to server function registry
   */
  getServerFunctions(): Map<string, Function> {
    return this.serverFunctions;
  }

  async scanComponentsDirectory(dir: string, relativePath: string): Promise<void> {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const newRelativePath = relativePath ? path.join(relativePath, item) : item;
        await this.scanComponentsDirectory(fullPath, newRelativePath);
      } else if (item.endsWith('.puremix')) {
        await this.registerComponent(fullPath, relativePath, item);
      }
    }
  }

  async registerComponent(filePath: string, relativePath: string, filename: string): Promise<void> {
    const componentName = filename.replace('.puremix', '');
    const componentPath = relativePath ? path.join(relativePath, componentName).replace(/\\/g, '/') : componentName;

    // Parse the .puremix component file
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = await this.fileParser.parse(content, filePath);

    // Register component server functions
    Object.entries(parsed.serverFunctions).forEach(([name, funcInfo]) => {
      const functionKey = `component:${componentName}:${name}`;
      this.serverFunctions.set(functionKey, funcInfo.function);
    });

    // Store component info
    const componentInfo: ComponentInfo = {
      path: componentPath,
      parsed,
      name: componentName
    };

    this.components.set(componentPath, componentInfo);

    console.log(`  ✓ Component: ${componentPath} -> ${path.relative(process.cwd(), filePath)}`);
  }

  async registerRoute(filePath: string, routePath: string, filename: string): Promise<void> {
    const routeName = filename.replace('.puremix', '');
    let route = path.join(routePath, routeName).replace(/\\/g, '/');

    // Handle special routing
    if (routeName === 'index') {
      route = routePath || '/';
    } else if (routeName.startsWith('[') && routeName.endsWith(']')) {
      // Dynamic routes: [id].puremix -> /:id
      const param = routeName.slice(1, -1);
      if (param.startsWith('...')) {
        // Catch-all: [...slug].puremix -> /*
        route = path.join(routePath, '*').replace(/\\/g, '/');
      } else {
        // Parameter: [id].puremix -> /:id  
        route = path.join(routePath, `:${param}`).replace(/\\/g, '/');
      }
    }

    // Ensure route starts with /
    if (!route.startsWith('/')) route = '/' + route;

    // Parse the .puremix file
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = await this.fileParser.parse(content, filePath);

    // Register server functions
    Object.entries(parsed.serverFunctions).forEach(([name, funcInfo]) => {
      const functionKey = `${route}:${name}`;
      this.serverFunctions.set(functionKey, funcInfo.function);
    });

    // Store route data
    console.log(`🔍 DEBUG: Storing route ${route} with ${Object.keys(parsed.loaders || {}).length} loaders:`, Object.keys(parsed.loaders || {}));
    this.routes.set(route, { filePath, parsed });

    // Create Express route handler for GET
    this.app.get(route, async (req, res) => {
      await this.handlePageRequest(route, req, res);
    });

    // Create Express route handler for POST (form submissions)
    this.app.post(route, async (req, res) => {
      await this.handlePageRequest(route, req, res);
    });

    console.log(`  ✓ Route: ${route} -> ${path.relative(process.cwd(), filePath)}`);
  }

  async registerAPIRoute(filePath: string, routePath: string, filename: string): Promise<void> {
    const routeName = filename.replace(/\.(js|ts|py)$/, '');
    let route = path.join('/', routePath, routeName).replace(/\\/g, '/');

    // Handle dynamic routes: [id].js -> /:id
    if (routeName.startsWith('[') && routeName.endsWith(']')) {
      const param = routeName.slice(1, -1);
      if (param.startsWith('...')) {
        // Catch-all: [...slug].js -> /*
        route = path.join('/', routePath, '*').replace(/\\/g, '/');
      } else {
        // Parameter: [id].js -> /:id  
        route = path.join('/', routePath, `:${param}`).replace(/\\/g, '/');
      }
    }

    // Store API route data
    this.routes.set(route, { filePath, isAPI: true, fileType: filename.split('.').pop() });

    // Create Express route handlers for all HTTP methods
    const handler = async (req: express.Request, res: express.Response) => {
      await this.handleAPIRequest(route, req, res);
    };

    this.app.get(route, handler);
    this.app.post(route, handler);
    this.app.put(route, handler);
    this.app.patch(route, handler);
    this.app.delete(route, handler);
    this.app.options(route, handler);

    console.log(`  ✓ API Route: ${route} -> ${path.relative(process.cwd(), filePath)}`);
  }

  /**
   * handlePageRequest - Core SSR request handler
   * 
   * INPUT: route (URL pattern), req (Express request), res (Express response)
   * OUTPUT: Fully rendered HTML sent to browser
   * GOAL: Server-side render .puremix pages with loader data
   * DEPENDENCIES: FileParser, TemplateEngine, Python integration
   * 
   * PROCESS:
   * 1. Find route data from this.routes map
   * 2. Handle POST actions (form submissions)
   * 3. Execute loaders to fetch data
   * 4. Process layout if specified
   * 5. Render template with JSX-like expressions
   * 6. Inject client runtime for progressive enhancement
   * 7. Send complete HTML to browser
   */
  async handlePageRequest(route: string, req: express.Request, res: express.Response): Promise<void> {
    const requestId = req.requestId || 'req_' + Math.random().toString(36).substr(2, 9);
    const requestStartTime = performance.now();
    const context = { requestId, ip: req.ip || 'unknown', sessionId: req.sessionID };

    // Initialize comprehensive performance timers
    const timers: any = {
      requestStart: { startTime: requestStartTime, label: 'Request Started' },
      routeResolution: { startTime: performance.now(), label: 'Route Resolution' }
    };

    try {
      // Log route resolution
      const logger = getLogger();
      if (logger) {
        logger.logRouteResolution(context, {
          route,
          method: req.method,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer')
        });
      }

      const routeData = this.routes.get(route);
      if (!routeData) {
        return this.handle404(req, res);
      }

      const { parsed } = routeData;
      console.log(`🔍 DEBUG: Retrieved route ${route} with ${Object.keys(parsed.loaders || {}).length} loaders:`, Object.keys(parsed.loaders || {}));

      timers.routeResolution.endTime = performance.now();
      timers.routeResolution.duration = timers.routeResolution.endTime - timers.routeResolution.startTime;

      // Create request context with framework utilities and timing data
      const request = this.createRequestContext(req, res);
      (request as any).timers = timers;

      // STEP 1: Handle form submissions (POST requests)
      let actionResult: any = null;
      if (req.method === 'POST' && req.body) {
        timers.actionStart = { startTime: performance.now(), label: 'Action Processing' };

        const actionName = req.body._action || 'default';
        const functionKey = `${route}:${actionName}`;

        if (this.serverFunctions.has(functionKey)) {
          const serverFunction = this.serverFunctions.get(functionKey);
          if (serverFunction) {
            const actionStartTime = performance.now();
            try {
              // Execute server function from <script server> block
              actionResult = await serverFunction(req.body, request);

              const actionEndTime = performance.now();
              if (logger) {
                logger.logAction(context, {
                  name: actionName,
                  data: req.body,
                  result: actionResult,
                  duration: actionEndTime - actionStartTime
                });
              }
            } catch (actionError) {
              const actionEndTime = performance.now();
              if (logger) {
                logger.logAction(context, {
                  name: actionName,
                  data: req.body,
                  error: actionError,
                  duration: actionEndTime - actionStartTime
                });
              }
              throw actionError;
            }
          }

          // Handle redirects from server functions
          if (actionResult?.redirect) {
            return res.redirect(actionResult.redirect);
          }
        }

        timers.actionEnd = {
          startTime: performance.now(),
          endTime: performance.now(),
          duration: performance.now() - timers.actionStart.startTime,
          label: 'Action Processing Complete'
        };
      }

      // STEP 2: Execute loaders to fetch page data
      timers.loaderStart = { startTime: performance.now(), label: 'Loader Execution' };
      const loaderStartTime = performance.now();
      const loaderResults = await this.executeLoaders(parsed.loaders, request, actionResult, parsed.imports, routeData.filePath);
      const loaderEndTime = performance.now();

      timers.loaderEnd = {
        startTime: performance.now(),
        endTime: performance.now(),
        duration: loaderEndTime - loaderStartTime,
        label: 'Loader Execution Complete'
      };

      if (logger) {
        logger.logLoader(context, {
          loaders: Object.keys(parsed.loaders || {}),
          duration: loaderEndTime - loaderStartTime,
          results: Object.keys(loaderResults.results)
        });
      }

      // STEP 2.5: Check if any loader wants to redirect
      for (const [loaderName, result] of Object.entries(loaderResults.results)) {
        if (result.redirect) {
          return res.redirect(result.redirect);
        }
      }

      // STEP 3: Process page template with loader data FIRST
      timers.templateStart = { startTime: performance.now(), label: 'Template Processing' };
      const templateStartTime = performance.now();
      console.log('🔧 ENGINE DEBUG - Calling processTemplate with componentImports:', parsed.componentImports);
      let html = await this.templateEngine.processTemplate(parsed.html, loaderResults, request, parsed.componentImports);
      const templateEndTime = performance.now();

      // STEP 4: Process layout if specified (after page template is processed)
      if (parsed.layout) {
        html = await this.processLayout(parsed.layout, html, loaderResults, request);
      }

      timers.templateEnd = {
        startTime: performance.now(),
        endTime: performance.now(),
        duration: templateEndTime - templateStartTime,
        label: 'Template Processing Complete'
      };

      if (logger) {
        logger.logTemplateRender(context, {
          file: routeData.filePath,
          components: Object.keys(parsed.componentImports || {}),
          pythonImports: parsed.pythonImports,
          html: html,
          duration: templateEndTime - templateStartTime
        });
      }

      // STEP 5: Inject client runtime for progressive enhancement
      timers.renderStart = { startTime: performance.now(), label: 'Final Rendering' };
      html = this.injectClientRuntime(html, loaderResults, request, parsed);

      // STEP 6: Calculate final timing and add performance data
      const totalDuration = performance.now() - requestStartTime;
      timers.renderEnd = {
        startTime: performance.now(),
        endTime: performance.now(),
        duration: performance.now() - timers.renderStart.startTime,
        label: 'Final Rendering Complete'
      };
      timers.requestEnd = {
        startTime: performance.now(),
        endTime: performance.now(),
        duration: totalDuration,
        label: 'Request Complete'
      };

      // PureMix debug box is injected later in injectPureMixDebugBox method

      if (logger) {
        logger.logResponse(context, {
          statusCode: 200,
          route,
          method: req.method,
          htmlLength: html.length,
          totalDuration,
          timers
        });
      }

      console.log(`🚀 REQUEST PERFORMANCE SUMMARY for ${route}:`);
      console.log(`   📊 Route Resolution: ${timers.routeResolution.duration?.toFixed(2)}ms`);
      if (timers.actionEnd) console.log(`   ⚡ Action Processing: ${timers.actionEnd.duration?.toFixed(2)}ms`);
      console.log(`   🔄 Loader Execution: ${timers.loaderEnd.duration?.toFixed(2)}ms`);
      console.log(`   🎨 Template Processing: ${timers.templateEnd.duration?.toFixed(2)}ms`);
      console.log(`   🖥️  Final Rendering: ${timers.renderEnd.duration?.toFixed(2)}ms`);
      console.log(`   ✅ TOTAL REQUEST: ${totalDuration.toFixed(2)}ms`);

      // Inject PureMix Debug Box if enabled
      html = this.injectPureMixDebugBox(html, timers, totalDuration, route);

      // Inject server function initialization
      html = this.injectServerFunctionRegistry(html, parsed, route);

      res.send(html);

    } catch (error) {
      const totalDuration = performance.now() - requestStartTime;
      const logger = getLogger();
      if (logger) {
        logger.logError(context, error as Error, {
          route,
          method: req.method,
          totalDuration
        });
      }
      this.handleError(error as Error, req, res, 'page_request');
    }
  }

  async handleAPIRequest(route: string, req: express.Request, res: express.Response): Promise<void> {
    try {
      const routeData = this.routes.get(route);
      if (!routeData || !routeData.isAPI) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
      }

      const { filePath, fileType } = routeData;

      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.status(200).end();
        return;
      }

      // Set minimal CORS headers - let the handler decide content type
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (fileType === 'js' || fileType === 'ts') {
        await this.handleJavaScriptAPI(filePath, req, res);
      } else if (fileType === 'py') {
        await this.handlePythonAPI(filePath, req, res);
      } else {
        res.status(500).json({ error: 'Unsupported API file type' });
      }

    } catch (error) {
      console.error('API Request error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: this.config.isDev ? (error as Error).message : undefined
      });
    }
  }

  async handleJavaScriptAPI(filePath: string, req: express.Request, res: express.Response): Promise<void> {
    try {
      // For ES modules, we use timestamp query parameter for cache busting in development
      // This avoids the need for require.cache which doesn't exist in ES module context
      const timestamp = this.config.isDev ? `?${Date.now()}` : '';

      // Import the API module
      const apiModule = await import(`file://${filePath}${timestamp}`);

      // Check for default export first (handles any request)
      if (apiModule.default && typeof apiModule.default === 'function') {
        await apiModule.default(req, res);
        return;
      }

      // Check for named exports with flexible patterns:
      // 1. HTTP methods: GET, POST, etc.
      // 2. Custom names: getUserData, processPayment, etc.
      // 3. MCP protocol methods: call, list, etc.
      // 4. SOAP/XML methods: processRequest, handleXML, etc.
      const possibleHandlers = [
        req.method.toLowerCase(),
        req.method.toUpperCase(),
        'handle',
        'process',
        'execute',
        'main',
        'call',
        'request'
      ];

      let handler: Function | null = null;
      for (const handlerName of possibleHandlers) {
        if (apiModule[handlerName] && typeof apiModule[handlerName] === 'function') {
          handler = apiModule[handlerName];
          break;
        }
      }

      // If no standard handler found, look for any function export
      if (!handler) {
        const functionExports = Object.keys(apiModule)
          .filter(key => typeof apiModule[key] === 'function');

        if (functionExports.length === 1) {
          handler = apiModule[functionExports[0]];
        } else if (functionExports.length > 1) {
          // Multiple functions - let the developer choose
          res.status(400).json({
            error: 'Multiple handlers found, please specify which to use',
            availableHandlers: functionExports,
            hint: 'Use default export, method name (GET/POST), or standard names (handle/process/execute)'
          });
          return;
        }
      }

      if (!handler) {
        res.status(501).json({
          error: 'No handler found',
          hint: 'Export a function with name: default, GET/POST, handle, process, execute, or main'
        });
        return;
      }

      // Call the handler with standard Express req, res
      // Handler is responsible for sending response
      if (typeof handler === 'function') {
        await handler(req, res);
      }

    } catch (error) {
      console.error('JavaScript API execution error:', error);
      res.status(500).json({
        error: 'API execution failed',
        message: this.config.isDev ? (error as Error).message : undefined
      });
    }
  }

  async handlePythonAPI(filePath: string, req: express.Request, res: express.Response): Promise<void> {
    const requestId = req.requestId || 'req_' + Math.random().toString(36).substr(2, 9);
    const startTime = performance.now();
    const context = { requestId, ip: req.ip || 'unknown', sessionId: req.sessionID };

    try {
      // Read Python file content
      const pythonCode = fs.readFileSync(filePath, 'utf8');

      // Create Python context with request data
      const pythonContext = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: req.headers,
        params: req.params
      };

      // Execute Python code with context
      const pythonStartTime = performance.now();
      const result = await this.pythonExecutor.executeFunction('main', pythonContext, pythonCode);
      const pythonEndTime = performance.now();

      const logger = getLogger();
      if (logger) {
        logger.logPython(context, {
          file: filePath,
          success: result.success,
          data: result.data,
          error: result.error,
          duration: pythonEndTime - pythonStartTime
        });
      }

      if (result.success) {
        // Python should return JSON response
        try {
          const response = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
          res.json(response);
        } catch (parseError) {
          res.json({ data: result.data });
        }
      } else {
        res.status(500).json({
          error: 'Python API execution failed',
          message: this.config.isDev ? result.error : undefined
        });
      }

    } catch (error) {
      const logger = getLogger();
      if (logger) {
        logger.logError(context, error as Error, {
          type: 'python_api_error',
          filePath
        });
      }

      console.error('Python API execution error:', error);
      res.status(500).json({
        error: 'Python API execution failed',
        message: this.config.isDev ? (error as Error).message : undefined
      });
    }
  }

  /**
   * executeLoaders - Run data loading functions from <loader> blocks
   * 
   * INPUT: loaders (parsed functions), request context, actionResult, imports, filePath
   * OUTPUT: LoaderResults with data for template rendering
   * GOAL: Fetch data on server before rendering (like Remix loaders)
   * DEPENDENCIES: ImportResolver for imports, Python integration
   * 
   * PROCESS:
   * 1. Resolve imports for each loader
   * 2. Execute all loaders in parallel
   * 3. Handle errors gracefully
   * 4. Return data structure for template rendering
   */
  async executeLoaders(loaders: Record<string, any>, request: PureMixRequest, actionResult: any, imports?: string[], filePath?: string): Promise<LoaderResults> {
    const results = {};
    const loadingStates = {};

    console.log(`🔍 DEBUG: executeLoaders called with ${Object.keys(loaders).length} loaders:`, Object.keys(loaders));

    if (!loaders || Object.keys(loaders).length === 0) {
      console.log(`🔍 DEBUG: No loaders to execute, returning empty results`);
      return { results, loadingStates };
    }

    // Execute all loaders in parallel for performance
    const promises = Object.keys(loaders).map(async (loaderName) => {
      const loaderStartTime = performance.now();

      try {
        loadingStates[loaderName] = { loading: true };

        // Resolve imports for this loader (JS/TS modules, local files)
        const resolvedImports = imports ? await this.importResolver.resolveImports(imports, filePath) : {};

        // Create execution context with imports available
        const _context = { ...request, ...resolvedImports };

        // Execute loader function with request and action result
        console.log(`🔍 DEBUG: Executing loader ${loaderName}...`);
        const result = await loaders[loaderName].function(request, actionResult);
        console.log(`🔍 DEBUG: Loader ${loaderName} returned:`, result);

        results[loaderName] = result;
        loadingStates[loaderName] = { loading: false };

      } catch (error) {
        console.error(`Loader ${loaderName} failed:`, error);
        // Graceful error handling - page still renders with error state
        results[loaderName] = {
          data: {},
          state: { error: (error as Error).message },
          loading: false
        };
        loadingStates[loaderName] = { loading: false, error: true };
      }
    });

    await Promise.all(promises);

    return { results, loadingStates };
  }

  async renderComponent(componentPath: string, props: any = {}, request: PureMixRequest): Promise<ComponentRenderResult> {
    const componentInfo = this.components.get(componentPath);
    if (!componentInfo) {
      throw new Error(`Component not found: ${componentPath}`);
    }

    const { parsed } = componentInfo;

    // Execute component loaders with props
    const loaderResults = await this.executeComponentLoaders(parsed.loaders, request, null, props);
    console.log('Component loader results:', JSON.stringify(loaderResults, null, 2));

    // Process component template with loader results (components don't need nested component processing)
    let html = await this.templateEngine.processTemplate(parsed.html, loaderResults, request, {});

    // Namespace server functions to avoid conflicts
    const namespacedFunctions: Record<string, Function> = {};
    Object.entries(parsed.serverFunctions).forEach(([functionName, funcInfo]) => {
      const namespacedName = `${componentPath.replace('/', '_')}_${functionName}`;
      namespacedFunctions[namespacedName] = funcInfo.function; // Extract actual function
    });

    return {
      html,
      serverFunctions: namespacedFunctions,
      loaderResults: loaderResults  // FIXED: Add loaderResults for template engine component registration
    };
  }

  async renderComponentByPath(filePath: string, props: any = {}, request: PureMixRequest): Promise<ComponentRenderResult> {
    // Check if the component is already loaded
    for (const [componentPath, componentInfo] of this.components.entries()) {
      if (componentInfo.parsed && filePath.endsWith(componentInfo.name + '.puremix')) {
        return this.renderComponent(componentPath, props, request);
      }
    }

    // Component not found in registry, try to load it directly from file path
    if (!fs.existsSync(filePath)) {
      throw new Error(`Component file not found: ${filePath}`);
    }

    // Parse the component file directly
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = await this.fileParser.parse(content, filePath);

    // Execute component loaders with props
    const loaderResults = await this.executeComponentLoaders(parsed.loaders, request, null, props);

    // Process component template with loader results (components don't need nested component processing)
    let html = await this.templateEngine.processTemplate(parsed.html, loaderResults, request, {});

    // Return result (server functions are handled at the page level)
    // Extract actual functions from FunctionInfo objects
    const extractedFunctions: Record<string, Function> = {};
    Object.entries(parsed.serverFunctions).forEach(([name, funcInfo]) => {
      extractedFunctions[name] = funcInfo.function;
    });

    return {
      html,
      serverFunctions: extractedFunctions,
      loaderResults: loaderResults  // FIXED: Add loaderResults for template engine component registration
    };
  }

  async executeComponentLoaders(loaders: Record<string, any>, request: PureMixRequest, actionResult: any = null, props: any = null): Promise<LoaderResults> {
    const results = {};
    const loadingStates = {};

    if (!loaders || Object.keys(loaders).length === 0) {
      return { results, loadingStates };
    }

    // Execute all component loaders in parallel, passing props as second parameter
    const promises = Object.keys(loaders).map(async (loaderName) => {
      try {
        loadingStates[loaderName] = { loading: true };

        // Component loaders don't need import resolution (components handle their own imports)
        const resolvedImports = {};

        // Create execution context
        const _context = { ...request, ...resolvedImports };

        // Execute loader function with props as third parameter
        console.log(`🔍 LOADER CALL DEBUG: ${loaderName} called with props:`, JSON.stringify(props));
        const result = await loaders[loaderName].function(request, actionResult, props);

        results[loaderName] = result;
        loadingStates[loaderName] = { loading: false };

      } catch (error) {
        console.error(`Component loader ${loaderName} failed:`, error);
        results[loaderName] = {
          data: {},
          state: { error: (error as Error).message },
          loading: false
        };
        loadingStates[loaderName] = { loading: false, error: true };
      }
    });

    await Promise.all(promises);

    return { results, loadingStates };
  }

  /**
   * Component Instance Management for Selective Updates
   */
  registerComponentInstance(instance: ComponentInstance): void {
    this.componentInstances.set(instance.id, instance);
    console.log(`✅ Registered component instance: ${instance.name}#${instance.id}`);
  }

  getComponentInstance(id: string): ComponentInstance | undefined {
    return this.componentInstances.get(id);
  }

  // Generate automatic component IDs
  generateComponentId(componentName: string): string {
    return `${componentName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Generate component tree HTML for debug widget
   */
  generateComponentTreeHTML(): string {
    const componentTree = this.generateComponentTreeData();

    if (componentTree.components.length === 0) {
      return `
        <div style="
          text-align: center;
          padding: 40px 20px;
          color: #666;
          font-style: italic;
        ">
          <div style="font-size: 32px; margin-bottom: 8px;">🧩</div>
          <div>No components on this page</div>
          <div style="font-size: 10px; margin-top: 4px;">Components will appear here when using JSX-like syntax</div>
        </div>
      `;
    }

    return `
      <div class="tree-root" style="
        border-left: 2px solid #00ff88;
        padding-left: 12px;
        margin-left: 4px;
      ">
        <div style="
          font-weight: bold;
          color: #00ff88;
          margin-bottom: 8px;
          font-size: 13px;
        ">📄 ${componentTree.route}</div>
        ${componentTree.components.map(component => `
          <div class="tree-component" 
               data-debug-component-id="${component.id}"
               style="
                 margin: 6px 0;
                 padding: 8px;
                 margin-left: 8px;
                 padding-left: 12px;
                 background: rgba(34, 197, 94, 0.05);
                 border-radius: 4px;
                 transition: all 0.2s ease;
               ">
            <div style="
              font-weight: bold;
              color: #22c55e;
              font-size: 12px;
              margin-bottom: 4px;
            ">
              🧩 ${component.name}
              <span style="color: #666; font-size: 9px; font-weight: normal;">#${component.id.split('-').pop()}</span>
            </div>
            <div style="color: #888; font-size: 10px; line-height: 1.4;">
              <div>Props: [${component.props.join(', ') || 'none'}]</div>
              <div>Loaders: ${component.loaderCount}${component.hasPythonLoaders ? ' 🐍' : ''} • 
                Actions: ${component.serverFunctions.length}${component.hasPythonActions ? ' 🐍' : ''}</div>
              <div><span class="last-updated" style="color: #00ff88;">Loaded at page start</span></div>
            </div>
            ${component.pythonStatus ? `
              <div style="color: #f59e0b; font-size: 9px; margin-top: 2px;">
                🐍 Python: ${component.pythonStatus}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  generateComponentTreeData(): any {
    const tree = {
      route: 'Current Page',
      components: [] as any[]
    };

    for (const [id, instance] of this.componentInstances) {
      tree.components.push({
        id: id,
        name: instance.name,
        props: Object.keys(instance.props || {}),
        loaderCount: Object.keys(instance.loaderResults?.results || {}).length,
        lastRendered: new Date().toLocaleTimeString(),
        serverFunctions: instance.serverFunctions || [],
        hasPythonLoaders: false, // TODO: detect Python loaders
        hasPythonActions: false, // TODO: detect Python actions
        pythonStatus: this.pythonExecutor.available() ? 'Available' : 'Unavailable'
      });
    }

    return tree;
  }

  /**
   * createRequestContext - Build enhanced request object for loaders/actions
   * 
   * INPUT: Express req and res objects
   * OUTPUT: PureMixRequest with framework utilities
   * GOAL: Provide unified API for server functions and loaders
   * DEPENDENCIES: PythonExecutor for Python integration
   * 
   * ENHANCED FEATURES:
   * - Python interface for seamless JS/Python interop
   * - Helper functions for common responses
   * - Session and cookie access
   * - Environment variables
   */
  createRequestContext(req: express.Request, res: express.Response): PureMixRequest {
    return {
      // Raw Express objects
      req,
      res,
      // Extracted convenience properties
      user: req.session?.user || null,
      session: req.session,
      cookies: req.cookies,
      query: req.query,
      params: req.params,
      body: req.body,
      files: req.files || {}, // Uploaded files from multipart forms
      method: req.method,
      url: req.url,
      env: process.env,
      // Framework utilities
      python: this.pythonExecutor.createInterface(), // JS/Python interop
      // Helper functions for common response patterns
      redirect: (url) => ({ redirect: url }),
      json: (data) => ({ json: data }),
      error: (message) => ({ error: message }),
      success: (message, data = {}) => ({ success: true, message, ...data })
    };
  }

  setupInternalAPI(): void {
    // Handle server function calls from client
    this.app.post('/_puremix/action', async (req, res) => {
      const requestId = req.requestId || 'req_' + Math.random().toString(36).substr(2, 9);
      const startTime = performance.now();
      const context = { requestId, ip: req.ip || 'unknown', sessionId: req.sessionID };

      // DEBUG: First check the raw request body before any parsing
      console.log('🚀 RAW REQUEST DEBUG:');
      console.log('  📦 Content-Type:', req.headers['content-type']);
      console.log('  📦 Content-Length:', req.headers['content-length']);
      console.log('  📦 req.body type:', typeof req.body);
      console.log('  📦 req.body:', JSON.stringify(req.body).substring(0, 300));
      console.log('HERE -> BUG  📦 req.body.data:', req.body?.data);

      // CRITICAL: Check if data field is already corrupted at this point
      if (req.body && req.body.data === '[object Object]') {
        console.log('🚨 MIDDLEWARE CORRUPTION DETECTED: Data field is already "[object Object]" at request start!');
        console.log('🚨 This indicates Express middleware is corrupting JSON parsing');
      }

      try {
        // CSRF validation
        if (req.headers['x-csrf-token'] !== req.session.csrfToken) {
          const logger = getLogger();
          if (logger) {
            logger.logSecurityEvent(context, {
              type: 'csrf_failure',
              severity: 'high',
              details: `CSRF token mismatch from ${req.headers['user-agent']} via ${req.headers.referer}`,
              blocked: true
            });
          }
          return res.status(403).json({ error: 'Invalid CSRF token' });
        }

        let { action, data, route: clientRoute } = req.body;

        // CRITICAL FIX: Handle case where data arrives as string "[object Object]"
        if (typeof data === 'string' && data === '[object Object]') {
          console.log('🔧 CRITICAL REPAIR: Data arrived as "[object Object]" string, attempting to parse as JSON');
          try {
            // Log the entire request body to understand the corruption
            const originalBody = req.body;
            console.log('🔧 Original req.body structure:', JSON.stringify(originalBody, null, 2));

            // Check if the raw request has the data in a different format
            if ((req as any).rawBodyString) {
              console.log('🔧 Found raw body string, attempting to parse:', (req as any).rawBodyString);
              const parsedRaw = JSON.parse((req as any).rawBodyString);
              if (parsedRaw && parsedRaw.data && typeof parsedRaw.data === 'object') {
                data = parsedRaw.data;
                console.log('🔧 SUCCESS: Recovered data from raw body string:', data);
              }
            } else if ((req as any).rawBody) {
              console.log('🔧 Found raw body, attempting to parse:', (req as any).rawBody);
              const parsedRaw = JSON.parse((req as any).rawBody);
              if (parsedRaw && parsedRaw.data && typeof parsedRaw.data === 'object') {
                data = parsedRaw.data;
                console.log('🔧 SUCCESS: Recovered data from raw body:', data);
              }
            } else {
              // Try to look for the data in alternative fields or reconstruct from form data
              console.log('🔧 No raw body available, checking for alternative data sources...');

              // Sometimes the data gets stored in a different field due to body parser conflicts
              if (originalBody._data && typeof originalBody._data === 'object') {
                data = originalBody._data;
                console.log('🔧 SUCCESS: Found data in _data field:', data);
              } else if (originalBody.formData && typeof originalBody.formData === 'object') {
                data = originalBody.formData;
                console.log('🔧 SUCCESS: Found data in formData field:', data);
              } else {
                console.log('🔧 FALLBACK: Using empty object - data could not be recovered');
                data = {};
              }
            }
          } catch (error) {
            console.log('🔧 ERROR: Could not repair data, using empty object:', (error as Error).message);
            data = {};
          }
        }

        // DEBUG: Log the incoming data to diagnose formData stringification
        console.log('🔧 PUREMIX ACTION HANDLER: Data type:', typeof data);
        console.log('🔧 PUREMIX ACTION HANDLER: Data content:', JSON.stringify(data).substring(0, 200));

        const request = this.createRequestContext(req, res);

        // Find the function for the specific route
        const functionKey = `${clientRoute}:${action}`;

        if (!this.serverFunctions.has(functionKey)) {
          // Try to find in current route
          const currentRoute = req.headers.referer ? new URL(req.headers.referer).pathname : '/';
          const altFunctionKey = `${currentRoute}:${action}`;

          if (!this.serverFunctions.has(altFunctionKey)) {
            return res.status(404).json({ error: `Function ${action} not found` });
          }

          // Use the alternative function key
          const altServerFunction = this.serverFunctions.get(altFunctionKey);
          if (!altServerFunction) {
            return res.status(404).json({ error: `Function ${action} not found` });
          }

          const actionStartTime = performance.now();
          const actionResult = await altServerFunction(data, request);
          const actionEndTime = performance.now();

          const logger = getLogger();
          if (logger) {
            logger.logAction(context, {
              name: action,
              data: data,
              result: actionResult,
              duration: actionEndTime - actionStartTime
            });
          }

          // ARCHITECTURAL FIX: Follow proper PureMix flow: Action → Loader → Template → HTML
          // Handle special response types that need JSON
          if (actionResult?.redirect) {
            return res.json({ redirect: actionResult.redirect });
          } else if (actionResult?.reload) {
            return res.json({ reload: true });
          }

          // For normal responses: Re-render the page with actionResult
          try {
            // Step 1: Get the route data and parse the .puremix file
            const routeData = this.routes.get(currentRoute);
            if (!routeData) {
              return res.status(404).json({ error: `Route ${currentRoute} not found` });
            }

            const content = fs.readFileSync(routeData.filePath, 'utf-8');
            const parsed = await this.fileParser.parse(content, routeData.filePath);

            // Step 2: Execute loaders with the actionResult (this is the key fix!)
            const loaderResults = await this.executeLoaders(parsed.loaders, request, actionResult, parsed.imports, routeData.filePath);

            // Step 3: Process template with loader data
            let html = await this.templateEngine.processTemplate(parsed.html, loaderResults, request, parsed.componentImports);

            // Step 4: Process layout if specified
            if (parsed.layout) {
              const layoutPath = path.join(this.viewsDir, 'layouts', `${parsed.layout}.puremix`);
              if (fs.existsSync(layoutPath)) {
                const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
                const layoutParsed = await this.fileParser.parse(layoutContent, layoutPath);
                let layoutHtml = layoutParsed.html.replace('{content}', html);
                layoutHtml = await this.templateEngine.processTemplate(layoutHtml, loaderResults, request);
                html = layoutHtml;
              }
            }

            // Step 5: Inject client runtime for AJAX functionality
            html = this.injectClientRuntime(html, loaderResults, request, parsed);

            // Step 6: Return HTML (not JSON!) for DOM diffing
            return res.send(html);

          } catch (renderError) {
            console.error('🚨 Error during page re-render after action (alt path):', renderError);
            // Fallback to JSON response if rendering fails
            return res.json(actionResult || { success: true });
          }
        }

        const serverFunction = this.serverFunctions.get(functionKey) ||
          this.serverFunctions.get(`${req.headers.referer ? new URL(req.headers.referer).pathname : '/'}:${action}`);

        if (!serverFunction) {
          return res.status(404).json({ error: `Function ${action} not found` });
        }

        const actionStartTime = performance.now();

        // DEBUG: Log data just before calling server function
        console.log('🔧 BEFORE CALLING SERVER FUNCTION: Data type:', typeof data);
        console.log('🔧 BEFORE CALLING SERVER FUNCTION: Data content:', JSON.stringify(data).substring(0, 200));

        // THIS CALLS THE SERVER FUNCTION ON PUREMIX FILES SIDE. IMPORTANT TO DEBUG THIS.
        const actionResult = await serverFunction(data, request);
        const actionEndTime = performance.now();

        const logger = getLogger();
        if (logger) {
          logger.logAction(context, {
            name: action,
            data: data,
            result: actionResult,
            duration: actionEndTime - actionStartTime
          });
        }

        // ARCHITECTURAL FIX: Follow proper PureMix flow: Action → Loader → Template → HTML
        // Instead of returning JSON, we need to re-render the page with the actionResult

        // Handle special response types that need JSON
        if (actionResult?.redirect) {
          return res.json({ redirect: actionResult.redirect });
        } else if (actionResult?.reload) {
          return res.json({ reload: true });
        }

        // For normal responses: Smart content rendering based on request type
        try {
          // Determine if this is a component action (contains dot notation)
          const isComponentAction = action.includes('.');
          const componentName = isComponentAction ? action.split('.')[0] : null;

          if (isComponentAction && componentName) {
            // COMPONENT ACTION: Return only the component's template boundary
            console.log(`🧩 Component action detected: ${componentName}.${action.split('.')[1]}`);

            // Find component file
            const componentPath = this.findComponentPath(componentName, clientRoute);
            if (!componentPath) {
              return res.status(404).json({ error: `Component ${componentName} not found` });
            }

            // Parse component file
            const componentContent = fs.readFileSync(componentPath, 'utf-8');
            const componentParsed = await this.fileParser.parse(componentContent, componentPath);

            // Execute component loaders with actionResult
            const componentLoaderResults = await this.executeLoaders(
              componentParsed.loaders,
              request,
              actionResult,
              componentParsed.imports,
              componentPath
            );

            // Process only the component template
            let componentHtml = await this.templateEngine.processTemplate(
              componentParsed.html,
              componentLoaderResults,
              request,
              componentParsed.componentImports
            );

            // Add unique IDs for DOM diffing if they don't exist
            componentHtml = this.addDiffingIds(componentHtml, `${componentName}-${Date.now()}`);

            // Return only the component HTML for selective DOM updates
            console.log(`✅ Returning component HTML for: ${componentName}`);
            return res.send(componentHtml);

          } else {
            // ROUTE ACTION: Return only the content area (no layout)
            console.log(`📄 Route action detected: ${action} on ${clientRoute}`);

            const routeData = this.routes.get(clientRoute);
            if (!routeData) {
              return res.status(404).json({ error: `Route ${clientRoute} not found` });
            }

            const content = fs.readFileSync(routeData.filePath, 'utf-8');
            const parsed = await this.fileParser.parse(content, routeData.filePath);

            // Execute loaders with the actionResult
            const loaderResults = await this.executeLoaders(parsed.loaders, request, actionResult, parsed.imports, routeData.filePath);

            // Process template with loader data (NO LAYOUT!)
            let html = await this.templateEngine.processTemplate(parsed.html, loaderResults, request, parsed.componentImports);

            // Add unique IDs for new elements
            html = this.addDiffingIds(html, `content-${Date.now()}`);

            // Inject minimal client runtime (only for this content)
            html = this.injectContentRuntime(html, loaderResults, request, parsed);

            console.log(`✅ Returning content HTML for route: ${clientRoute}`);
            return res.send(html);
          }

        } catch (renderError) {
          console.error('🚨 Error during page re-render after action:', renderError);
          // Fallback to JSON response if rendering fails
          return res.json(actionResult || { success: true });
        }

      } catch (error) {
        const logger = getLogger();
        if (logger) {
          logger.logError(context, error as Error, {
            type: 'ajax_action_error',
            action: req.body?.action
          });
        }

        console.error('Action execution error:', error);
        return res.status(500).json({ error: (error as Error).message || 'Internal server error' });
      }
    });

    // Component-specific action endpoint for selective updates
    this.app.post('/_puremix/component-action', async (req, res) => {
      const requestId = req.requestId || 'comp_' + Math.random().toString(36).substring(2, 9);
      const startTime = performance.now();
      const context = { requestId, ip: req.ip || 'unknown', sessionId: req.sessionID };

      try {
        // CSRF validation (same as main action endpoint)
        if (req.headers['x-csrf-token'] !== req.session?.csrfToken) {
          const logger = getLogger();
          if (logger) {
            logger.logSecurityEvent(context, {
              type: 'csrf_failure',
              severity: 'medium',
              details: `CSRF failure on component-action endpoint. UserAgent: ${req.get('User-Agent') || 'unknown'}`,
              blocked: true
            });
          }
          return res.status(403).json({ error: 'Invalid CSRF token' });
        }

        const { action, data, componentId } = req.body;

        console.log(`🔧 Component Action Debug: Received componentId="${componentId}", action="${action}"`);
        console.log(`🔧 Available component instances:`, Array.from(this.componentInstances.keys()));
        console.log(`🔧 Request body:`, JSON.stringify(req.body, null, 2));

        // 1. Get component instance directly by ID (no route filtering needed for AJAX calls)
        const instance = this.componentInstances.get(componentId);
        if (!instance) {
          console.log(`🚫 Component instance not found! ComponentId: ${componentId}`);
          console.log(`🚫 Available instances: ${Array.from(this.componentInstances.keys()).join(', ')}`);
          return res.status(404).json({ error: `Component instance not found: ${componentId}` });
        }

        console.log(`✅ Found component instance: ${instance.name}#${componentId}`);

        // 2. Execute component-specific action
        // Strip component prefix from action name (e.g. "PropsTestCard_refreshData" -> "refreshData")
        const componentPrefix = `${instance.name}_`;
        const cleanActionName = action.startsWith(componentPrefix) ? action.slice(componentPrefix.length) : action;
        const actionFunctionKey = `component:${instance.name}:${cleanActionName}`;
        const actionFunction = this.serverFunctions.get(actionFunctionKey);

        if (!actionFunction) {
          return res.status(404).json({ error: `Component action not found: ${actionFunctionKey}` });
        }

        const request = this.createRequestContext(req, res);

        // Add component context for Python functions and actions
        (request as any).componentProps = instance.props;
        (request as any).componentName = instance.name;
        (request as any).componentId = componentId;
        (request as any).loaderResults = instance.loaderResults;

        const actionResult = await actionFunction(data, request);

        // 3. Re-execute ONLY this component's loaders (selective)
        const componentInfo = this.components.get(instance.name);
        if (!componentInfo) {
          return res.status(404).json({ error: `Component definition not found: ${instance.name}` });
        }

        // Add action result to request context for loaders to access
        (request as any).actionResult = actionResult;

        const newLoaderResults = await this.executeComponentLoaders(
          componentInfo.parsed.loaders,
          request,
          actionResult,
          instance.props
        );

        // Pass JavaScript context to Python functions automatically
        if (request.python) {
          const jsContext = {
            componentProps: instance.props,
            componentName: instance.name,
            componentId: componentId,
            parentRoute: instance.parentRoute,
            loaderResults: newLoaderResults.results,
            actionResult: actionResult,
            request: {
              url: request.url,
              method: request.method,
              params: request.params,
              query: request.query
            },
            session: request.session
          };

          // Python functions automatically receive this context
          if ((request.python as any).setComponentContext) {
            (request.python as any).setComponentContext(jsContext);
          }
        }

        // 4. Re-render ONLY this component (isolated)
        const newHtml = await this.templateEngine.processTemplate(
          componentInfo.parsed.html,
          newLoaderResults,
          request,
          componentInfo.parsed.componentImports
        );

        // 5. Update component instance cache
        instance.loaderResults = newLoaderResults;
        instance.lastRendered = newHtml;

        // 6. Return selective update (follows action→loader→template flow)
        return res.json({
          type: 'component-update',
          componentId: componentId,
          html: newHtml,
          loaderData: newLoaderResults.results,
          actionResult: actionResult,
          renderTime: performance.now() - startTime
        });

      } catch (error) {
        const logger = getLogger();
        if (logger) {
          logger.logError(context, error as Error, {
            type: 'component_action_error',
            componentId: req.body?.componentId,
            action: req.body?.action
          });
        }

        console.error('Component action error:', error);
        return res.status(500).json({ error: (error as Error).message || 'Internal server error' });
      }
    });

    // Health check
    this.app.get('/_puremix/health', (_req, res) => {
      res.json({
        status: 'ok',
        version: '1.0.0',
        node: process.version,
        python: this.pythonExecutor.available(),
        routes: this.routes.size,
        functions: this.serverFunctions.size,
        env: process.env.NODE_ENV || 'development'
      });
    });

    // Hot reload endpoint for development
    if (this.config.isDev && this.config.hotReload) {
      this.app.get('/_puremix/hot-reload', (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          res.write('data: {"type":"heartbeat"}\n\n');
        }, 30000);

        req.on('close', () => {
          clearInterval(heartbeat);
        });
      });
    }
  }

  async processLayout(layoutName: string, content: string, loaderResults: LoaderResults, request: PureMixRequest): Promise<string> {
    const layoutPath = path.join(process.cwd(), this.config.appDir, 'views', 'layouts', `${layoutName}.puremix`);

    if (!fs.existsSync(layoutPath)) {
      console.warn(`Layout not found: ${layoutPath}`);
      return content;
    }

    // Parse the layout file to extract any imports, loaders, etc. (but keep raw HTML)
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    const layoutParsed = await this.fileParser.parse(layoutContent, layoutPath);

    // Extract head content from page content
    const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const pageHead = headMatch ? headMatch[1] : '';

    // Remove head from page content since it will be merged with layout head
    const bodyContent = content.replace(/<head[^>]*>[\s\S]*?<\/head>\s*/i, '');

    // CRITICAL FIX: Use raw layout content (not parsed.html which strips head)
    let layoutHtml = layoutContent;

    // Remove layout-specific blocks that should not appear in final HTML
    layoutHtml = layoutHtml
      .replace(/<layout>.*?<\/layout>/gs, '')
      .replace(/<imports>.*?<\/imports>/gs, '')
      .replace(/<loader.*?>.*?<\/loader>/gs, '')
      .replace(/<script\s+server.*?>.*?<\/script>/gs, '')
      .trim();

    // Replace placeholders
    layoutHtml = layoutHtml.replace('{content}', bodyContent);
    layoutHtml = layoutHtml.replace('{head}', pageHead || '');

    // CRITICAL FIX: Process layout through template engine to handle any expressions
    layoutHtml = await this.templateEngine.processTemplate(layoutHtml, loaderResults, request);

    return layoutHtml;
  }

  injectClientRuntime(html: string, loaderResults: LoaderResults, request: PureMixRequest, parsed: ParsedFile): string {
    console.log('🔍 DEBUG: injectClientRuntime called - START');
    console.log('🔍 DEBUG: Method exists and executing');
    // Extract server function names from parsed route
    const serverFunctionNames = Object.keys(parsed.serverFunctions || {});
    console.log('🔍 DEBUG: serverFunctionNames:', serverFunctionNames);

    // Extract component functions from all components used on this page
    const componentFunctions: Record<string, string[]> = {};
    const route = (request as any).route || request.url || '/';

    // Get component functions from component instances registered during render
    for (const [componentId, instance] of this.componentInstances) {
      if (instance.parentRoute === route || instance.parentRoute === route.replace(/\/$/, '') + '/') {
        if (!componentFunctions[instance.name]) {
          componentFunctions[instance.name] = [];
        }
        console.log(`🔍 DEBUG: Processing component instance ${instance.name}, serverFunctions:`, instance.serverFunctions, 'type:', typeof instance.serverFunctions, 'isArray:', Array.isArray(instance.serverFunctions));
        componentFunctions[instance.name] = [...new Set([
          ...componentFunctions[instance.name],
          ...(Array.isArray(instance.serverFunctions) ? instance.serverFunctions : [])
        ])];
      }
    }

    console.log('🔍 DEBUG: componentFunctions collected:', componentFunctions);

    // Generate client runtime with server function manifest
    let runtime: string;
    console.log('🔍 DEBUG: About to call generateClientRuntime');
    try {
      runtime = generateClientRuntime(loaderResults, request, {
        serverFunctions: serverFunctionNames,
        componentFunctions: componentFunctions,
        clientScripts: parsed.clientScripts || []
      });
      console.log('🔍 DEBUG: generateClientRuntime success, length:', runtime.length);
      console.log('🔍 DEBUG: Runtime first 500 chars:', runtime.substring(0, 500));
    } catch (error) {
      console.error('🚨 ERROR: generateClientRuntime failed:', error);
      console.error('🚨 ERROR: Stack trace:', (error as Error).stack);
      return html; // Return html without runtime injection on error
    }

    // Inject before closing body tag or at the end of HTML
    if (html.includes('</body>')) {
      return html.replace('</body>', `${runtime}</body>`);
    } else {
      return html + runtime;
    }
  }

  generatePerformanceDisplay(timers: any): string {
    const isDev = this.config.isDev;

    if (!isDev) {
      // In production, show configurable debug box (disabled by default)
      const showInProduction = this.config.showDebugInProduction || false;
      if (!showInProduction) {
        return `\n<!-- PERFORMANCE TIMING -->\n<!-- Total Request: ${timers.requestEnd?.duration?.toFixed(2)}ms -->\n`;
      }
    }

    // Development or production with debug enabled: Show enhanced PureMix debug panel with tabs
    return '';
  }

  injectPureMixDebugBox(html: string, timers: any, totalDuration: number, route: string): string {
    const isDev = this.config.isDev;
    const showInProduction = this.config.showDebugInProduction || false;

    if (!isDev && !showInProduction) {
      return html;
    }

    const debugBox = `
<!-- PureMix Debug Box -->
<div id="puremix-debug-panel" style="
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  color: #fff;
  border-radius: 12px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: 13px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
  max-width: 450px;
  min-width: 320px;
  z-index: 99999;
  cursor: move;
  user-select: none;
  backdrop-filter: blur(10px);
  transform: translateZ(0);
">
  <!-- Header -->
  <div style="
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px 12px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  ">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="
        width: 8px;
        height: 8px;
        background: #00ff88;
        border-radius: 50%;
        box-shadow: 0 0 6px #00ff88;
      "></div>
      <strong style="color: #00ff88; font-size: 14px;">PureMix Framework</strong>
    </div>
    <button id="puremix-debug-close" style="
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    " onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#fff'" 
       onmouseout="this.style.background='none'; this.style.color='#999'">×</button>
  </div>
  
  <!-- Tab Navigation -->
  <div style="
    display: flex;
    background: rgba(0,0,0,0.3);
    margin: 0;
    border-radius: 0;
  ">
    <button class="puremix-tab" data-tab="performance" style="
      flex: 1;
      background: #00ff88;
      color: #000;
      border: none;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      border-radius: 0;
    ">📊 Performance</button>
    
    <button class="puremix-tab" data-tab="dom-tree" style="
      flex: 1;
      background: rgba(255,255,255,0.1);
      color: #999;
      border: none;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      border-radius: 0;
    ">🌳 Components</button>
    
    <button class="puremix-tab" data-tab="logs" style="
      flex: 1;
      background: rgba(255,255,255,0.1);
      color: #999;
      border: none;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      border-radius: 0;
    ">🔍 Logs</button>
  </div>
  
  <!-- Performance Tab Content -->
  <div id="puremix-tab-performance" class="puremix-tab-content" style="
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
  ">
    <div style="color: #888; margin-bottom: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Request Lifecycle Analysis</div>
    
    <div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #0ea5e9; font-weight: 500;">📊 Route Resolution</span>
        <span style="color: #22c55e; font-weight: 600;">${timers.routeResolution?.duration?.toFixed(2) || '0.00'}ms</span>
      </div>
    </div>
    
    ${timers.actionEnd ? `
    <div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #f59e0b; font-weight: 500;">⚡ Action Processing</span>
        <span style="color: #22c55e; font-weight: 600;">${timers.actionEnd.duration?.toFixed(2)}ms</span>
      </div>
    </div>
    ` : ''}
    
    <div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #8b5cf6; font-weight: 500;">🔄 Loader Execution</span>
        <span style="color: #22c55e; font-weight: 600;">${timers.loaderEnd?.duration?.toFixed(2) || '0.00'}ms</span>
      </div>
    </div>
    
    <div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #ef4444; font-weight: 500;">🎨 Template Processing</span>
        <span style="color: #22c55e; font-weight: 600;">${timers.templateEnd?.duration?.toFixed(2) || '0.00'}ms</span>
      </div>
    </div>
    
    <div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #06b6d4; font-weight: 500;">🖥️ Final Rendering</span>
        <span style="color: #22c55e; font-weight: 600;">${timers.renderEnd?.duration?.toFixed(2) || '0.00'}ms</span>
      </div>
    </div>
    
    <div style="
      border-top: 1px solid rgba(255,255,255,0.1);
      margin: 16px 0;
      padding-top: 16px;
      background: rgba(0,255,136,0.1);
      border-radius: 8px;
      padding: 12px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #00ff88; font-weight: 700; font-size: 14px;">✅ TOTAL REQUEST</span>
        <span style="color: #00ff88; font-weight: 700; font-size: 16px;">${totalDuration.toFixed(2)}ms</span>
      </div>
    </div>
    
    <div style="
      color: #666;
      font-size: 11px;
      text-align: center;
      margin-top: 12px;
      padding: 8px;
      background: rgba(0,0,0,0.3);
      border-radius: 6px;
    ">
      Route: <code style="color: #888;">${route}</code><br>
      Environment: <code style="color: ${isDev ? '#f59e0b' : '#22c55e'};">${isDev ? 'Development' : 'Production'}</code>
    </div>
  </div>
  
  <!-- DOM Tree Tab Content -->
  <div id="puremix-tab-dom-tree" class="puremix-tab-content" style="
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
    display: none;
  ">
    <div style="color: #888; margin-bottom: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Component Tree</div>
    
    <div id="component-tree-container">
      ${this.generateComponentTreeHTML()}
    </div>
    
    <div style="
      margin-top: 12px;
      padding: 8px;
      background: rgba(0,0,0,0.3);
      border-radius: 6px;
      font-size: 10px;
      color: #666;
      text-align: center;
    ">
      Components auto-update on changes
    </div>
  </div>
  
  <!-- Logs Tab Content -->
  <div id="puremix-tab-logs" class="puremix-tab-content" style="
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
    display: none;
  ">
    <div style="color: #888; margin-bottom: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Request Logs & Errors</div>
    
    <div id="puremix-logs-container" style="
      font-family: 'SF Mono', 'Monaco', monospace;
      font-size: 12px;
      line-height: 1.5;
    ">
      <!-- Logs will be populated by JavaScript -->
      <div style="color: #666; font-style: italic; text-align: center; padding: 20px;">
        No errors detected ✅<br>
        <span style="font-size: 11px;">All systems operational</span>
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="
    padding: 12px 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
    font-size: 11px;
    color: #666;
    text-align: center;
  ">
    Drag to move • Press ESC to close
  </div>
</div>

<script>
// Enhanced PureMix Debug Panel with Tab Functionality
(function() {
  const panel = document.getElementById('puremix-debug-panel');
  const closeBtn = document.getElementById('puremix-debug-close');
  const tabs = document.querySelectorAll('.puremix-tab');
  const tabContents = document.querySelectorAll('.puremix-tab-content');
  
  if (!panel) return;
  
  // Tab switching functionality
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update tab styles
      tabs.forEach(t => {
        if (t.dataset.tab === targetTab) {
          t.style.background = '#00ff88';
          t.style.color = '#000';
        } else {
          t.style.background = 'rgba(255,255,255,0.1)';
          t.style.color = '#999';
        }
      });
      
      // Show/hide content
      tabContents.forEach(content => {
        if (content.id === 'puremix-tab-' + targetTab) {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });
  });
  
  // Close button
  closeBtn.addEventListener('click', () => {
    panel.style.display = 'none';
  });
  
  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      panel.style.display = 'none';
    }
  });
  
  // Draggable functionality
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  panel.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    if (e.target.closest('.puremix-tab-content')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    panel.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });
  
  function handleMouseMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    panel.style.left = (startLeft + deltaX) + 'px';
    panel.style.top = (startTop + deltaY) + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }
  
  function handleMouseUp() {
    isDragging = false;
    panel.style.cursor = 'move';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  // Capture console errors for the logs tab
  const originalConsoleError = console.error;
  const errorLogs = [];
  
  console.error = function(...args) {
    errorLogs.push({
      timestamp: new Date().toLocaleTimeString(),
      message: args.join(' '),
      type: 'error'
    });
    
    updateLogsDisplay();
    originalConsoleError.apply(console, args);
  };
  
  function updateLogsDisplay() {
    const container = document.getElementById('puremix-logs-container');
    if (!container) return;
    
    if (errorLogs.length === 0) {
      container.innerHTML = \`
        <div style="color: #666; font-style: italic; text-align: center; padding: 20px;">
          No errors detected ✅<br>
          <span style="font-size: 11px;">All systems operational</span>
        </div>
      \`;
    } else {
      container.innerHTML = errorLogs.map(log => \`
        <div style="
          margin-bottom: 8px;
          padding: 8px;
          background: rgba(239,68,68,0.1);
          border-left: 3px solid #ef4444;
          border-radius: 4px;
        ">
          <div style="color: #ef4444; font-size: 10px; margin-bottom: 4px;">
            \${log.timestamp} - ERROR
          </div>
          <div style="color: #fff; font-size: 11px; word-break: break-word;">
            \${log.message}
          </div>
        </div>
      \`).join('');
    }
  }
  
  // Initialize logs display
  updateLogsDisplay();
  
  // Component tree update tracking
  if (window.PureMix) {
    window.PureMix.on('componentUpdated', function(data) {
      updateComponentTreeDisplay(data);
    });
    
    window.PureMix.on('componentAction', function(data) {
      logComponentAction(data);
    });
  }
  
  function updateComponentTreeDisplay(data) {
    const treeContainer = document.getElementById('component-tree-container');
    if (!treeContainer) return;
    
    // Find component in tree and mark as updated
    const componentNode = treeContainer.querySelector('[data-debug-component-id="' + data.id + '"]');
    if (componentNode) {
      // Highlight the component
      componentNode.style.background = 'rgba(0, 255, 136, 0.15)';
      componentNode.style.borderLeftColor = '#00ff88';
      componentNode.style.boxShadow = '0 0 8px rgba(0, 255, 136, 0.3)';
      
      // Update last updated time
      const timeElement = componentNode.querySelector('.last-updated');
      if (timeElement) {
        timeElement.textContent = 'Just now';
        timeElement.style.color = '#00ff88';
      }
      
      // Reset highlight after 2 seconds
      setTimeout(() => {
        componentNode.style.background = 'rgba(34, 197, 94, 0.05)';
        componentNode.style.borderLeftColor = '#22c55e';
        componentNode.style.boxShadow = 'none';
        if (timeElement) {
          timeElement.style.color = '#888';
        }
      }, 2000);
    }
  }
  
  function logComponentAction(data) {
    console.log(\`🔄 Component action: \${data.component}.\${data.action} (\${data.response?.renderTime?.toFixed(1) || 'N/A'}ms)\`);
  }
})();
</script>
\n`;

    // Inject before closing body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', debugBox + '</body>');
    } else {
      return html + debugBox;
    }
  }

  // Inject server function registry for automatic client-side mapping
  injectServerFunctionRegistry(html: string, parsed: any, route: string): string {
    if (!parsed) return html;

    // Extract server functions from page
    const pageFunctions = Object.keys(parsed.serverFunctions || {});

    // Extract component functions from all components used on this page
    const componentFunctions: Record<string, string[]> = {};

    // Get component functions from component instances registered during render
    for (const [componentId, instance] of this.componentInstances) {
      if (instance.parentRoute === route || instance.parentRoute === route.replace(/\/$/, '') + '/') {
        if (!componentFunctions[instance.name]) {
          componentFunctions[instance.name] = [];
        }
        console.log(`🔍 DEBUG: Processing component instance ${instance.name}, serverFunctions:`, instance.serverFunctions, 'type:', typeof instance.serverFunctions, 'isArray:', Array.isArray(instance.serverFunctions));
        componentFunctions[instance.name] = [...new Set([
          ...componentFunctions[instance.name],
          ...(Array.isArray(instance.serverFunctions) ? instance.serverFunctions : [])
        ])];
      }
    }

    // Create initialization script
    const initScript = `
<script>
// Auto-initialize PureMix server functions
document.addEventListener('DOMContentLoaded', function() {
  if (window.PureMix && typeof window.PureMix.initializeServerFunctions === 'function') {
    // Register page-level server functions
    const pageFunctions = ${JSON.stringify(pageFunctions.reduce((acc, func) => {
      acc[func] = true;
      return acc;
    }, {} as Record<string, boolean>))};
    
    // Register component functions  
    const componentFunctions = ${JSON.stringify(componentFunctions)};
    
    // Initialize the registry
    window.PureMix.initializeServerFunctions(pageFunctions, componentFunctions);
    
    console.log('🔗 PureMix Server Functions Auto-Registered:');
    console.log('   📄 Page Functions:', Object.keys(pageFunctions));
    console.log('   🧩 Component Functions:', Object.entries(componentFunctions).map(([comp, funcs]) => 
      funcs.map(f => comp + '.' + f)).flat());
    
    // Check for naming conflicts
    const allPageFunctions = Object.keys(pageFunctions);
    const allComponentFunctions = Object.entries(componentFunctions)
      .map(([comp, funcs]) => funcs.map(f => f)).flat();
    
    const conflicts = allPageFunctions.filter(pf => allComponentFunctions.includes(pf));
    if (conflicts.length > 0) {
      console.warn('⚠️  Function name conflicts detected:', conflicts);
      console.warn('   Component functions will take precedence over page functions');
    }
  } else {
    console.warn('⚠️  PureMix client runtime not fully loaded');
  }
});
</script>`;

    // Inject before closing body tag or at end
    if (html.includes('</body>')) {
      return html.replace('</body>', initScript + '</body>');
    } else {
      return html + initScript;
    }
  }

  handle404(req: express.Request, res: express.Response): void {
    const errorPage = this.config.isDev ? `
      <!DOCTYPE html>
      <html>
      <head><title>404 - Page Not Found</title></head>
      <body style="font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1>404 - Page Not Found</h1>
        <p>The page <code>${req.path}</code> was not found.</p>
        <hr>
        <p><small>PureMix Framework</small></p>
      </body>
      </html>
    ` : '<h1>404 - Page Not Found</h1>';

    res.status(404).send(errorPage);
  }

  handleError(error: Error, _req: express.Request, res: express.Response, context: string): void {
    console.error(`PureMix Error (${context}):`, error);

    if (this.config.isDev) {
      // Development error page with stack trace
      const errorPage = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PureMix Error</title>
          <style>
            body { 
              font-family: 'SF Mono', Monaco, monospace; 
              padding: 20px;
              background: #1e1e1e;
              color: #d4d4d4;
            }
            h1 { color: #f48771; }
            .error-box {
              background: #2d2d2d;
              border: 1px solid #3e3e3e;
              border-radius: 4px;
              padding: 20px;
              margin: 20px 0;
            }
            .stack {
              background: #1e1e1e;
              padding: 15px;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 12px;
              line-height: 1.5;
            }
            .context { color: #608b4e; }
            .message { color: #ce9178; font-size: 16px; }
            a { color: #569cd6; }
          </style>
        </head>
        <body>
          <h1>🔥 PureMix Error</h1>
          <div class="error-box">
            <div class="context">Context: ${context}</div>
            <div class="message">${error.message}</div>
          </div>
          <div class="error-box">
            <h3>Stack Trace:</h3>
            <pre class="stack">${error.stack}</pre>
          </div>
          <p><a href="javascript:location.reload()">↻ Reload Page</a></p>
        </body>
        </html>
      `;
      res.status(500).send(errorPage);
    } else {
      // Production error page
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center;">
          <h1>Something went wrong</h1>
          <p>We're sorry, but something went wrong. Please try again later.</p>
        </body>
        </html>
      `);
    }
  }

  async start() {
    try {
      await this.scanPythonModules();
      await this.scanRoutes();

      // Set up file watching in development
      if (this.config.isDev && this.config.hotReload) {
        await this.setupFileWatching();
      }

      // Start server
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`\n✨ PureMix Framework v1.0.0`);
          console.log(`🚀 Server running on http://localhost:${this.config.port}`);
          console.log(`🐍 Python support: ${this.pythonExecutor.available() ? 'Enabled' : 'Disabled (install Python 3 to enable)'}`);
          console.log(`📂 App directory: ${this.config.appDir}`);
          console.log(`🔥 Hot reload: ${this.config.isDev && this.config.hotReload ? 'Enabled' : 'Disabled'}`);
          console.log(`\nPress Ctrl+C to stop the server\n`);
          resolve(this.server);
        }).on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`\n❌ Port ${this.config.port} is already in use!`);
            console.error(`\n💡 Try one of these solutions:`);
            console.error(`   1. Kill the process using port ${this.config.port}:`);
            console.error(`      lsof -ti:${this.config.port} | xargs kill -9`);
            console.error(`   2. Use a different port:`);
            console.error(`      npm run dev -- --port 3001`);
            console.error(`   3. Wait for automatic port selection (if using dev server)\n`);
          }
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to start PureMix server:', error);
      throw error;
    }
  }

  async setupFileWatching(): Promise<void> {
    const chokidar = await import('chokidar');
    const routesDir = path.join(process.cwd(), this.config.appDir);

    const watcher = chokidar.default.watch(routesDir, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    });

    let reloadTimeout: NodeJS.Timeout | null = null;

    const reloadRoutes = async (filePath: string, eventType: string) => {
      // Debounce to prevent multiple reloads
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(async () => {
        console.log(`🔄 File ${eventType}: ${path.relative(process.cwd(), filePath)}`);
        try {
          await this.scanRoutes();
          console.log('✅ Reload complete');
        } catch (error) {
          console.error('❌ Failed to reload routes:', error);
        }
      }, 100); // 100ms debounce
    };

    watcher
      .on('change', (filePath) => reloadRoutes(filePath, 'changed'))
      .on('add', (filePath) => reloadRoutes(filePath, 'added'))
      .on('unlink', (filePath) => reloadRoutes(filePath, 'removed'));
  }

  // Helper methods for form data conversion
  autoConvertValue(value: any): any {
    // Handle non-string values (File objects, etc.)
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    // Empty strings stay empty strings
    if (trimmed === '') {
      return value;
    }

    // Boolean conversion
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Numeric conversion - simple and aggressive
    if (this.isNumericString(trimmed)) {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && isFinite(parsed)) {
        // Return integer if no decimal point
        return trimmed.indexOf('.') === -1 ? parseInt(trimmed, 10) : parsed;
      }
    }

    // Keep as string if no conversion applies
    return value;
  }

  isNumericString(str: string): boolean {
    // Character-by-character validation (avoiding regex per user warning)
    let hasDigit = false;
    let hasDot = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const charCode = char.charCodeAt(0);

      if (charCode >= 48 && charCode <= 57) { // 0-9
        hasDigit = true;
      } else if (char === '.') {
        if (hasDot) return false; // Multiple dots
        hasDot = true;
      } else if (char === '-' && i === 0) {
        // Allow minus sign at beginning
        continue;
      } else {
        return false; // Invalid character
      }
    }

    return hasDigit;
  }

  // Helper method to find component file path
  findComponentPath(componentName: string, clientRoute: string): string | null {
    // Try multiple possible component locations
    const possiblePaths = [
      path.join(process.cwd(), this.config.appDir, 'components', `${componentName}.puremix`),
      path.join(process.cwd(), this.config.appDir, 'routes', 'components', `${componentName}.puremix`),
      path.join(path.dirname(clientRoute), 'components', `${componentName}.puremix`)
    ];

    for (const componentPath of possiblePaths) {
      if (fs.existsSync(componentPath)) {
        return componentPath;
      }
    }

    console.warn(`❌ Component ${componentName} not found in any of: ${possiblePaths.join(', ')}`);
    return null;
  }

  // Add unique IDs to new elements for DOM diffing
  addDiffingIds(html: string, prefix: string): string {
    // Add data attributes to elements that don't have IDs
    // This helps with DOM diffing performance
    let modifiedHtml = html;

    // Add IDs to major structural elements
    const elementsToId = ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'form'];

    elementsToId.forEach(tagName => {
      const regex = new RegExp(`<${tagName}(?![^>]*\\sid=)([^>]*>)`, 'gi');
      let counter = 0;
      modifiedHtml = modifiedHtml.replace(regex, (match, attributes) => {
        counter++;
        const id = `${prefix}-${tagName}-${counter}`;
        return `<${tagName} id="${id}"${attributes}`;
      });
    });

    return modifiedHtml;
  }

  // Inject minimal client runtime for content updates
  injectContentRuntime(html: string, loaderResults: any, request: any, parsed: any): string {
    // For content updates, we only need minimal runtime - no full page scripts
    const contentRuntime = `
<script>
// Minimal runtime for content updates
if (window.PureMix) {
  // Update loader data with new results
  window.PureMix.data = ${JSON.stringify(loaderResults || {})};

  // Emit content update event
  window.PureMix.emit('contentUpdated', {
    timestamp: Date.now(),
    loaderResults: window.PureMix.data
  });
}
</script>`;

    return html + contentRuntime;
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      console.log('\n👋 PureMix server stopped');
    }
  }
}

export default PureMixEngine;