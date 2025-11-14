#!/usr/bin/env node

import PureMixEngine from '../lib/puremix-engine.js';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import net from 'net';
import { loadConfigWithEnvironment } from './config-loader.js';

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

export async function devServer(options: DevOptions = {}) {
  console.log('🔥 Starting PureMix development server...\n');

  // Load configuration with environment-specific overrides
  const config = await loadConfigWithEnvironment();

  // Merge CLI options with config file (CLI options take precedence)
  const mergedConfig = {
    port: 3000,
    host: 'localhost',
    hotReload: true,
    pythonTimeout: 30000,
    isDev: true, // Always true for dev server
    ...config, // Config file values
    ...options  // CLI options override everything
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

  // Create PureMix engine with merged configuration
  const engine = new PureMixEngine(finalConfig);

  // Set up WebSocket for hot reload
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
      console.warn(`    Error: ${wsError.message}`);
    }
  }

  try {
    // Start the server
    const server = await engine.start();
    
    // Set up file watching for hot reload
    if (finalConfig.hotReload && wss) {
      setupFileWatcher(engine, wss);
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
    '.env'
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
        
      } catch (error) {
        console.error('❌ Reload failed:', error.message);
        
        // Notify clients of error
        const errorMessage = JSON.stringify({
          type: 'error',
          message: error.message,
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