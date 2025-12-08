/**
 * Python Process Pool - High-Performance Python Execution Manager
 * 
 * PURPOSE: Manages a pool of Python processes for efficient JavaScript-Python communication
 * ARCHITECTURE: Worker pool → Process reuse → Queue management → Resource cleanup
 * 
 * FLOW DIAGRAM:
 * 1. Initialize pool with min workers → Maintain process health
 * 2. Request comes in → Find available worker or queue
 * 3. Execute Python script in worker → Return result
 * 4. Return worker to pool → Cleanup idle workers
 * 
 * DEPENDENCIES:
 * - child_process for Python subprocess management
 * - EventEmitter for pool event handling
 * - File system for temporary script management
 * - crypto for unique worker/script IDs
 * 
 * POOL FEATURES:
 * - Dynamic worker scaling (min/max workers)
 * - Automatic idle worker cleanup
 * - Request queuing when all workers busy
 * - Process health monitoring and restart
 * - Memory and resource management
 * - Concurrent request handling
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface PythonWorker {
  id: string;
  process: ChildProcess;
  busy: boolean;
  lastUsed: number;
  requestQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    script: string;
    data: any;
    timeout: NodeJS.Timeout;
  }>;
}

interface PoolConfig {
  minWorkers: number;
  maxWorkers: number;
  maxIdleTime: number;
  pythonCommand: string;
  pythonTimeout: number;
  tempDir: string;
}

/**
 * PythonProcessPool - Manages pool of Python worker processes for high-performance execution
 * Provides process reuse, queue management, and automatic scaling
 */
export class PythonProcessPool extends EventEmitter {
  private workers: Map<string, PythonWorker> = new Map();
  private config: PoolConfig;
  private cleanupInterval!: NodeJS.Timeout; // Initialized in startCleanupTimer()
  private requestCounter: number = 0;

  constructor(config: Partial<PoolConfig> = {}) {
    super();
    
    this.config = {
      minWorkers: config.minWorkers || 2,
      maxWorkers: config.maxWorkers || 8,
      maxIdleTime: config.maxIdleTime || 300000, // 5 minutes
      pythonCommand: config.pythonCommand || 'python3',
      pythonTimeout: config.pythonTimeout || 30000,
      tempDir: config.tempDir || path.join(process.cwd(), '.temp')
    };

    this.ensureTempDir();
    this.initializePool();
    this.startCleanupTimer();
    
    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.config.tempDir)) {
      fs.mkdirSync(this.config.tempDir, { recursive: true });
    }
  }

  private async initializePool(): Promise<void> {
    console.log(`🐍 Initializing Python process pool (${this.config.minWorkers}-${this.config.maxWorkers} workers)`);
    
    // Create minimum number of workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      await this.createWorker();
    }
    
    console.log(`✅ Python pool ready with ${this.workers.size} workers`);
  }

  private async createWorker(): Promise<string> {
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Create persistent Python worker script
    const workerScript = this.generateWorkerScript();
    const scriptPath = path.join(this.config.tempDir, `${workerId}.py`);
    fs.writeFileSync(scriptPath, workerScript);

    try {
      const pythonProcess = spawn(this.config.pythonCommand, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: process.cwd(),
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1'
        }
      });

      const worker: PythonWorker = {
        id: workerId,
        process: pythonProcess,
        busy: false,
        lastUsed: Date.now(),
        requestQueue: []
      };

      // Handle worker communication
      this.setupWorkerCommunication(worker);
      
      this.workers.set(workerId, worker);
      this.emit('workerCreated', workerId);
      
      return workerId;
      
    } catch (error) {
      console.error(`Failed to create Python worker ${workerId}:`, error);
      throw error;
    }
  }

  private generateWorkerScript(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PureMix Python Worker Process - Persistent & Clean
Stays ready for requests, cleans up between executions
"""

import sys
import json
import traceback
import importlib.util
import tempfile
import os
import gc
from typing import Any, Dict

class PythonWorker:
    def __init__(self):
        self.modules_cache = {}
        self.request_count = 0
    
    def execute_code(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Python code with automatic cleanup"""
        self.request_count += 1
        
        try:
            code = request['code']
            function_name = request['function']
            data = request['data']
            js_context = request.get('js_context', {})
            
            # Execute in clean namespace with JavaScript context
            namespace = self.create_clean_namespace(js_context)
            
            # Execute user code in namespace
            exec(code, namespace)
            
            # Get function from namespace
            if function_name not in namespace:
                available_funcs = [name for name in namespace.keys() 
                                 if callable(namespace[name]) and not name.startswith('_')]
                return {
                    "error": f"Function '{function_name}' not found",
                    "available_functions": available_funcs
                }
            
            func = namespace[function_name]
            
            # Execute function with enhanced context
            if js_context:
                # Pass both data and JavaScript context to Python function
                result = func(data, js_context) if len(func.__code__.co_varnames) > 1 else func(data)
            else:
                result = func(data)
            
            # CLEANUP after execution but keep worker ready
            self.cleanup_execution()
            
            return result
            
        except Exception as e:
            # Always cleanup on error too
            self.cleanup_execution()
            
            return {
                "error": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc(),
                "function": function_name,
                "worker_requests": self.request_count
            }
    
    def create_clean_namespace(self, js_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a clean execution namespace with common imports"""
        # Base namespace with common libraries pre-imported
        namespace = {
            '__builtins__': __builtins__,
            'json': json,
            'os': os,
            'sys': sys,
            'traceback': traceback
        }
        
        # Add JavaScript context as 'js' global
        if js_context:
            namespace['js'] = js_context
            # Also add individual globals for convenience
            namespace['js_globals'] = js_context
        
        # NOTE: Don't pre-import ML libraries - users import what they need in their scripts
        # This prevents memory issues from loading large libraries during worker startup
          
        return namespace
    
    def cleanup_execution(self):
        """Clean up after each execution but keep worker ready"""
        # Force garbage collection to free memory
        gc.collect()
        
        # Clear any temporary variables (not the cache)
        # Keep the worker process and common imports ready
        
        # Periodic cache cleanup (every 100 requests)
        if self.request_count % 100 == 0:
            # Clear module cache to prevent memory bloat
            old_cache_size = len(self.modules_cache)
            self.modules_cache.clear()
            gc.collect()
            
            sys.stdout.write(f"CACHE_CLEARED:{old_cache_size}\\n")
            sys.stdout.flush()
    
    def run(self):
        """Main worker loop - stay ready, clean between requests"""
        sys.stdout.write("WORKER_READY\\n")
        sys.stdout.flush()
        
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                
                if line.strip() == "SHUTDOWN":
                    break
                elif line.strip() == "PING":
                    sys.stdout.write("PONG\\n")
                    sys.stdout.flush()
                    continue
                
                request = json.loads(line.strip())
                result = self.execute_code(request)
                
                # Send result back and stay ready for next request
                response = json.dumps(result, default=str) + "\\n"
                sys.stdout.write(response)
                sys.stdout.flush()
                
            except KeyboardInterrupt:
                break
            except EOFError:
                break
            except Exception as e:
                error_response = json.dumps({
                    "error": f"Worker error: {str(e)}",
                    "traceback": traceback.format_exc(),
                    "worker_requests": self.request_count
                }) + "\\n"
                sys.stdout.write(error_response)
                sys.stdout.flush()

if __name__ == "__main__":
    worker = PythonWorker()
    worker.run()
`;
  }

  private setupWorkerCommunication(worker: PythonWorker): void {
    let pendingResponse = '';

    // Handle stdout data (responses)
    worker.process.stdout?.on('data', (data) => {
      const chunk = data.toString();
      pendingResponse += chunk;

      // Check for complete responses (newline-delimited JSON)
      const lines = pendingResponse.split('\n');
      pendingResponse = lines.pop() || ''; // Keep incomplete line

      for (const line of lines) {
        if (line.trim() === 'WORKER_READY') {
          this.emit('workerReady', worker.id);
          continue;
        }

        if (line.trim()) {
          this.handleWorkerResponse(worker, line.trim());
        }
      }
    });

    // Handle stderr (errors)
    worker.process.stderr?.on('data', (data) => {
      console.error(`Python worker ${worker.id} stderr:`, data.toString());
    });

    // Handle process exit
    worker.process.on('exit', (code, signal) => {
      console.log(`Python worker ${worker.id} exited with code ${code}, signal ${signal}`);
      this.removeWorker(worker.id);
    });

    // Handle process errors
    worker.process.on('error', (error) => {
      console.error(`Python worker ${worker.id} error:`, error);
      this.removeWorker(worker.id);
    });
  }

  private handleWorkerResponse(worker: PythonWorker, response: string): void {
    if (worker.requestQueue.length === 0) {
      console.warn(`Received response from worker ${worker.id} but no pending requests`);
      return;
    }

    const request = worker.requestQueue.shift()!;
    clearTimeout(request.timeout);

    try {
      const result = JSON.parse(response);
      request.resolve(result);
    } catch (error) {
      request.reject(new Error(`Invalid JSON response: ${response}`));
    }

    worker.busy = worker.requestQueue.length > 0;
    worker.lastUsed = Date.now();
  }

  public async executeFunction(functionName: string, data: any, code: string, jsContext?: any): Promise<any> {
    this.requestCounter++;
    const requestId = this.requestCounter;

    // Get available worker or create new one
    const worker = await this.getAvailableWorker();
    
    return new Promise((resolve, reject) => {
      // Create timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Python function ${functionName} timeout (${this.config.pythonTimeout}ms)`));
      }, this.config.pythonTimeout);

      // Add to worker queue
      worker.requestQueue.push({
        resolve,
        reject,
        script: code,
        data,
        timeout
      });

      worker.busy = true;

      // Send request to worker with JavaScript context
      const request = {
        id: requestId,
        function: functionName,
        code: code,
        data: data,
        js_context: jsContext || {}
      };

      try {
        worker.process.stdin?.write(JSON.stringify(request) + '\n');
      } catch (error) {
        // Worker died, retry with new worker
        clearTimeout(timeout);
        worker.requestQueue.pop(); // Remove our request
        this.executeFunction(functionName, data, code).then(resolve).catch(reject);
      }
    });
  }

  private async getAvailableWorker(): Promise<PythonWorker> {
    // Find available worker
    for (const worker of this.workers.values()) {
      if (!worker.busy) {
        return worker;
      }
    }

    // Create new worker if under limit
    if (this.workers.size < this.config.maxWorkers) {
      const workerId = await this.createWorker();
      return this.workers.get(workerId)!;
    }

    // Wait for worker to become available
    return new Promise((resolve) => {
      const checkWorkers = () => {
        for (const worker of this.workers.values()) {
          if (!worker.busy) {
            resolve(worker);
            return;
          }
        }
        
        // Check again in 10ms
        setTimeout(checkWorkers, 10);
      };
      
      checkWorkers();
    });
  }

  private removeWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    // Reject all pending requests
    for (const request of worker.requestQueue) {
      clearTimeout(request.timeout);
      request.reject(new Error(`Worker ${workerId} died`));
    }

    // Cleanup worker process
    try {
      worker.process.kill();
    } catch (error) {
      // Process already dead
    }

    // Remove script file
    const scriptPath = path.join(this.config.tempDir, `${workerId}.py`);
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }

    this.workers.delete(workerId);
    this.emit('workerRemoved', workerId);

    // Ensure minimum workers
    if (this.workers.size < this.config.minWorkers) {
      this.createWorker().catch(console.error);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const workersToRemove: string[] = [];

      for (const [workerId, worker] of this.workers.entries()) {
        // Remove idle workers beyond minimum
        if (!worker.busy && 
            this.workers.size > this.config.minWorkers &&
            (now - worker.lastUsed) > this.config.maxIdleTime) {
          workersToRemove.push(workerId);
        }
      }

      for (const workerId of workersToRemove) {
        console.log(`🗑️ Removing idle Python worker ${workerId}`);
        this.removeWorker(workerId);
      }
    }, 60000); // Check every minute
  }

  public getStats(): any {
    const workers = Array.from(this.workers.values());
    
    return {
      totalWorkers: workers.length,
      busyWorkers: workers.filter(w => w.busy).length,
      idleWorkers: workers.filter(w => !w.busy).length,
      queuedRequests: workers.reduce((sum, w) => sum + w.requestQueue.length, 0),
      oldestWorker: workers.length > 0 ? Math.min(...workers.map(w => w.lastUsed)) : null,
      config: this.config
    };
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Python process pool...');
    
    // Clear cleanup timer
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Shutdown all workers
    const shutdownPromises = Array.from(this.workers.keys()).map(workerId => {
      return new Promise<void>((resolve) => {
        const worker = this.workers.get(workerId);
        if (!worker) {
          resolve();
          return;
        }

        // Send shutdown signal
        try {
          worker.process.stdin?.write('SHUTDOWN\n');
        } catch (error) {
          // Process already dead
        }

        // Force kill after 2 seconds
        setTimeout(() => {
          try {
            worker.process.kill('SIGKILL');
          } catch (error) {
            // Already dead
          }
          resolve();
        }, 2000);

        worker.process.on('exit', () => resolve());
      });
    });

    await Promise.all(shutdownPromises);
    this.workers.clear();
    
    console.log('✅ Python process pool shutdown complete');
  }
}

export default PythonProcessPool;