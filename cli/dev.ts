#!/usr/bin/env node

import PureMixEngine from '../lib/puremix-engine';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import net from 'net';
import { loadConfigWithEnvironment } from './config-loader';
import { generateDocs } from './generate-docs';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface DevOptions {
  port?: number | string;
  host?: string;
  hotReload?: boolean;
  pythonTimeout?: number | string;
  env?: string;
}

// Helper function to find an available port
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const isAvailable = await checkPortAvailable(port);
    if (isAvailable) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

// Check if a port is available
function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

// Helper function to check if CSS build is needed for Tailwind projects
function hasTailwindSupport(): boolean {
  const cwd = process.cwd();

  // Check for Tailwind indicators
  const hasTailwindConfig = fs.existsSync(path.join(cwd, 'tailwind.config.js')) ||
                           fs.existsSync(path.join(cwd, 'tailwind.config.ts'));

  const hasPostcssConfig = fs.existsSync(path.join(cwd, 'postcss.config.js')) ||
                          fs.existsSync(path.join(cwd, 'postcss.config.ts'));

  const hasTailwindDeps = checkPackageJsonForTailwind();

  return hasTailwindConfig && hasPostcssConfig && hasTailwindDeps;
}

// Check if package.json contains Tailwind dependencies
function checkPackageJsonForTailwind(): boolean {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) return false;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    return !!deps.tailwindcss;
  } catch {
    return false;
  }
}

// Run CSS build for Tailwind projects
function runCssBuild(): void {
  if (!hasTailwindSupport()) return;

  try {
    console.log('\n🎨 Running CSS build for Tailwind...');

    // Check for CSS build script
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.scripts && packageJson.scripts['css:build']) {
      // Use project's CSS build script if available
      execSync('npm run css:build', {
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 30000
      });
    } else if (fs.existsSync('./scripts/build-css.js')) {
      // Use the build-css.js script if available
      execSync('node scripts/build-css.js', {
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 30000
      });
    } else {
      // Fallback: Run Tailwind directly
      const hasInputCss = fs.existsSync('./app/public/css/style.css');
      if (hasInputCss) {
        execSync('npx tailwindcss -i ./app/public/css/style.css -o ./app/public/css/output.css --postcss', {
          stdio: 'inherit',
          cwd: process.cwd(),
          timeout: 30000
        });
        console.log('✅ Tailwind CSS compiled to output.css');
      }
    }
  } catch (error) {
    console.warn('⚠️  CSS build failed, continuing without CSS compilation:', error instanceof Error ? error.message : error);
  }
}

// Helper function to determine if PROJECT_STRUCTURE.md should be regenerated
function shouldRegenerateProjectStructure(filePath: string): boolean {
  // Always regenerate for changes to key directories and files
  const structuralPatterns = [
    /\/app\//,                    // Any change in app directory
    /puremix\.config\./,          // Configuration file changes
    /package\.json$/,             // Package.json changes
    /\.puremix$/,                 // PureMix route files
    /\/routes\//,                 // Routes directory changes
    /\/components\//,             // Components directory changes
    /\/controllers\//,            // Controllers directory changes
    /\/models\//,                 // Models directory changes
    /\/services\//,               // Services directory changes
    /\/utils\//,                  // Utils directory changes
    /\/public\//,                 // Public directory changes
    /\/views\//,                  // Views directory changes
  ];

  return structuralPatterns.some(pattern => pattern.test(filePath));
}

// Helper function to regenerate PROJECT_STRUCTURE.md
async function regenerateProjectStructure(): Promise<void> {
  try {
    const cwd = process.cwd();
    await generateDocs({ appDir: path.join(cwd, 'app') });
    console.log('📖 PROJECT_STRUCTURE.md regenerated automatically');
  } catch (error) {
    // Don't throw - just log warning if regeneration fails
    throw error;
  }
}

export async function devServer(options: DevOptions = {}) {
  console.log('🔥 Starting PureMix development server...\n');

  // Load configuration with environment-specific overrides
  const config = await loadConfigWithEnvironment();

  // Special handling for hotReload to respect environment-specific configurations
  // Commander.js automatically sets hotReload: true when --no-hot-reload is defined
  // We need to respect environment-specific configurations over CLI defaults
  const cliOptions = { ...options };
  delete cliOptions.hotReload; // Remove CLI default for hotReload

  // Merge CLI options with config file (config file hotReload takes precedence)
  const mergedConfig = {
    port: 3000,
    host: 'localhost',
    pythonTimeout: 30000,
    isDev: true, // Always true for dev server
    ...config, // Config file values (includes hotReload from environment config)
    ...cliOptions  // CLI options override everything (except hotReload)
  };

  // Find available ports for both main server and WebSocket
  const requestedPort = parseInt(mergedConfig.port.toString());
  const availablePort = await findAvailablePort(requestedPort);
  const wsPort = await findAvailablePort(availablePort + 1);

  if (availablePort !== requestedPort) {
    console.log(`⚠️  Port ${requestedPort} is in use, using port ${availablePort} instead\n`);
  }

  // Update port in final config
  const finalConfig = {
    ...mergedConfig,
    port: availablePort
  };

  
  // Run CSS build if this is a Tailwind project
  if (hasTailwindSupport()) {
    runCssBuild();
  }

  // Create PureMix engine with merged configuration
  const engine = new PureMixEngine(finalConfig);

  // Set up WebSocket for hot reload (only if enabled)
  let wss;
  if (finalConfig.hotReload) {
    try {
      wss = new WebSocketServer({ port: wsPort });
      console.log(`🔄 Hot reload server on ws://localhost:${wsPort}`);

      wss.on('connection', (ws) => {
        ws.send(JSON.stringify({ type: 'connected' }));
      });
    } catch (wsError) {
      console.warn(`⚠️  Could not start WebSocket server on port ${wsPort}. Hot reload disabled.`);
      console.warn(`    Error: ${wsError instanceof Error ? wsError.message : String(wsError)}`);
    }
  } else {
    console.log('🚀 Hot reload disabled for performance');
  }

  try {
    // Start the server
    const server = await engine.start();
    
    // Set up file watching for hot reload (only if enabled)
    if (finalConfig.hotReload && wss) {
      setupFileWatcher(engine, wss);
    } else {
      console.log('📁 File watching disabled for performance');
    }

    // Graceful shutdown
    const shutdown = () => {
      console.log('\\n🛑 Shutting down development server...');
      engine.stop();
      if (wss) {
        wss.close();
      }
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('SIGQUIT', shutdown);

    // Keep the process alive
    return new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Failed to start development server:', error);
    throw error;
  }
}

function setupFileWatcher(engine, wss) {
  const watchPaths = [
    'app/**/*.puremix',
    'app/**/*.js',
    'app/**/*.ts',
    'app/**/*.py',
    'app/public/**/*',
    'puremix.config.js',
    '.env',
    'tailwind.config.js',
    'postcss.config.js',
    'app/public/css/**/*.css',
    'app/public/css/**/*.scss'
  ];

  const watcher = chokidar.watch(watchPaths, {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/.temp/**',
      '**/logs/**' // Ignore debug logs directory
    ],
    persistent: true,
    ignoreInitial: true
  });

  let reloadTimeout;
  let isReloading = false;

  const triggerReload = async (filePath, eventType) => {
    if (isReloading) return;

    // Debounce multiple changes
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(async () => {
      isReloading = true;
      
      try {
        console.log(`\\n🔄 File changed: ${filePath} (${eventType})`);
        
        // Check if CSS rebuild is needed
        const isCssFile = /\.(css|scss|sass)$/.test(filePath) ||
                         filePath.includes('tailwind.config') ||
                         filePath.includes('postcss.config');

        if (isCssFile && hasTailwindSupport()) {
          console.log('🎨 CSS file changed, rebuilding...');
          runCssBuild();
        }

        // Reload routes
        await engine.scanRoutes();
        
        // Notify clients
        const message = JSON.stringify({
          type: 'reload',
          file: filePath,
          event: eventType,
          timestamp: Date.now()
        });
        
        wss.clients.forEach(ws => {
          if (ws.readyState === ws.OPEN) {
            ws.send(message);
          }
        });
        
        console.log('✅ Reload complete\\n');

        // Regenerate PROJECT_STRUCTURE.md if structural changes occurred
        if (shouldRegenerateProjectStructure(filePath)) {
          try {
            await regenerateProjectStructure();
          } catch (error) {
            console.warn('⚠️  Could not regenerate PROJECT_STRUCTURE.md:', (error as Error).message);
          }
        }

      } catch (error) {
        console.error('❌ Reload failed:', error instanceof Error ? error.message : String(error));
        
        // Notify clients of error
        const errorMessage = JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        });
        
        wss.clients.forEach(ws => {
          if (ws.readyState === ws.OPEN) {
            ws.send(errorMessage);
          }
        });
      } finally {
        isReloading = false;
      }
    }, 100); // 100ms debounce
  };

  watcher
    .on('change', (filePath) => triggerReload(filePath, 'changed'))
    .on('add', (filePath) => triggerReload(filePath, 'added'))
    .on('unlink', (filePath) => triggerReload(filePath, 'removed'))
    .on('error', (error) => {
      console.error('❌ File watcher error:', error);
    });

  console.log('👀 Watching for file changes...');
}

export default devServer;