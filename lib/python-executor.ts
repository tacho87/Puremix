/**
 * Python Executor - JavaScript-Python Integration Engine
 * 
 * PURPOSE: Enables seamless bidirectional communication between JavaScript and Python processes
 * ARCHITECTURE: Process spawning → JSON communication → Context sharing → Result handling
 * 
 * FLOW DIAGRAM:
 * 1. JavaScript calls Python function → Create temporary Python script
 * 2. Spawn Python process → Send data + JS context via JSON
 * 3. Python executes with access to JS context → Return results via JSON
 * 4. JavaScript receives results → Cleanup temp files → Return to caller
 * 
 * DEPENDENCIES:
 * - child_process for Python subprocess spawning
 * - PythonProcessPool for process reuse and performance
 * - File system for temporary script management
 * - crypto for generating unique script IDs
 * 
 * FEATURES:
 * - Process pool management for performance
 * - JavaScript context access in Python
 * - Graceful fallbacks when Python unavailable
 * - Built-in utilities for NumPy, Pandas, Scikit-learn
 * - Comprehensive error handling and timeout protection
 * - Temp file cleanup and caching
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import PythonProcessPool from './python-pool';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PythonExecutor - Core class for JavaScript-Python interoperability
 * Handles process management, context sharing, and result communication
 */
class PythonExecutor {
  private config: any;
  private isAvailable: boolean;
  private pythonVersion: string | null;
  private tempDir: string;
  private scriptCache: Map<string, string>;
  private moduleRegistry: Map<string, string>; // Module name -> file path
  private pythonCommand?: string;
  private pool?: PythonProcessPool;

  constructor(config: any) {
    this.config = config;
    this.isAvailable = this.checkAvailability();
    this.pythonVersion = this.getPythonVersion();
    this.tempDir = path.join(__dirname, '../.temp');
    this.scriptCache = new Map();
    this.moduleRegistry = new Map();
    this.ensureTempDir();

    // Clean all temp files on startup
    this.cleanupAllTempFiles();

    // Initialize process pool if enabled and Python is available
    if (this.isAvailable && config.python?.usePool) {
      this.initializePool();
    }
  }

  private initializePool(): void {
    console.log('🐍 Initializing Python process pool...');
    
    this.pool = new PythonProcessPool({
      minWorkers: this.config.python?.minWorkers || 2,
      maxWorkers: this.config.python?.maxWorkers || 8,
      maxIdleTime: this.config.python?.maxIdleTime || 300000,
      pythonCommand: this.pythonCommand!,
      pythonTimeout: this.config.pythonTimeout || 30000,
      tempDir: this.tempDir
    });
  }

  checkAvailability(): boolean {
    const pythonCommands = ['python3', 'python'];
    
    for (const cmd of pythonCommands) {
      try {
        const result = execSync(`${cmd} --version`, { 
          stdio: 'pipe',
          timeout: 5000 
        });
        const version = result.toString().trim();
        const versionMatch = version.match(/Python (\d+)\.(\d+)/);
        
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);
          
          if (major >= 3 && (major > 3 || minor >= 8)) {
            console.log(`🐍 Python detected: ${version} (${cmd})`);
            this.pythonCommand = cmd;
            return true;
          }
        }
      } catch (error) {
        // Continue to next command
        continue;
      }
    }
    
    console.warn('⚠️  Python 3.8+ not found - Python functions will be mocked');
    console.warn('   Install Python 3.8+ to enable ML/AI capabilities');
    return false;
  }

  getPythonVersion(): string | null {
    if (!this.isAvailable) return null;
    
    try {
      const result = execSync(`${this.pythonCommand} --version`, { stdio: 'pipe' });
      return result.toString().trim();
    } catch (error) {
      return 'Unknown';
    }
  }

  ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  createInterface(): any {
    return {
      call: this.executeFunction.bind(this),
      callFile: this.executeFile.bind(this),
      runScript: this.runScript.bind(this),
      isAvailable: () => this.isAvailable,
      version: this.pythonVersion,
      // Enhanced method with JavaScript context support
      executeFunction: this.executeFunction.bind(this),
      executeFile: this.executeFile.bind(this),
      // Utility methods for common ML/AI tasks
      numpy: this.createNumPyInterface(),
      pandas: this.createPandasInterface(),
      sklearn: this.createSklearnInterface(),
      install: this.installPackage.bind(this)
    };
  }

  async executeFunction(functionName: string, data: any, code: string, jsContext?: any): Promise<any> {
    if (!this.isAvailable) {
      return this.mockPythonResponse(functionName, data);
    }

    // Use process pool if available, otherwise fallback to subprocess
    if (this.pool) {
      return this.pool.executeFunction(functionName, data, code, jsContext);
    }

    // Fallback to subprocess method
    return this.executeWithSubprocess(functionName, data, code);
  }

  private async executeWithSubprocess(functionName: string, data: any, code: string): Promise<any> {
    // Create a hash for caching
    const codeHash = crypto.createHash('md5').update(code).digest('hex');
    const tempFile = path.join(this.tempDir, `func_${codeHash}_${functionName}.py`);
    
    try {
      // Create Python script if not cached
      if (!this.scriptCache.has(codeHash) || !fs.existsSync(tempFile)) {
        const scriptContent = this.generatePythonScript(code, functionName);
        fs.writeFileSync(tempFile, scriptContent);
        this.scriptCache.set(codeHash, tempFile);
      }

      console.log('🔢 Executing Python script:', tempFile);
      console.log('🔢 Data:', data);
      console.log('🔢 Function Name:', functionName);
      // Execute Python script
      const result = await this.runPythonScript(tempFile, [JSON.stringify(data)]);
      
      return result;
      
    } catch (error) {
      console.error(`Python function ${functionName} failed:`, (error as Error).message);
      return {
        error: (error as Error).message,
        function: functionName,
        input: data,
        __pythonError: true
      };
    }
  }

  async executeFile(filePath: string, functionName: string, data: any, jsContext?: any): Promise<any> {
    if (!this.isAvailable) {
      return this.mockPythonResponse(functionName, data);
    }

    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Python file not found: ${fullPath}`);
    }

    // Read the Python file content
    const pythonCode = fs.readFileSync(fullPath, 'utf8');

    // Use process pool if available, otherwise fallback to subprocess
    if (this.pool) {
      return this.pool.executeFunction(functionName, data, pythonCode, jsContext);
    }

    // Fallback to subprocess method
    return this.executeFileWithSubprocess(fullPath, functionName, data, pythonCode);
  }

  private async executeFileWithSubprocess(filePath: string, functionName: string, data: any, pythonCode: string): Promise<any> {
    const wrapperScript = this.generatePythonScript(pythonCode, functionName);
    const tempFile = path.join(this.tempDir, `file_${path.basename(filePath, '.py')}_${Date.now()}.py`);
    fs.writeFileSync(tempFile, wrapperScript);

    try {
      console.log('🔢 Executing Python script:', tempFile);
      console.log('🔢 Data:', data);
      console.log('🔢 Function Name:', functionName);
      const result = await this.runPythonScript(tempFile, [JSON.stringify(data)]);
      fs.unlinkSync(tempFile); // Cleanup
      return result;
    } catch (error) {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw error;
    }
  }

  async runScript(scriptPath: string, args: string[] = []): Promise<any> {
    if (!this.isAvailable) {
      return { error: 'Python not available', __mocked: true };
    }

    const fullPath = path.resolve(scriptPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Script not found: ${fullPath}`);
    }

    return this.runPythonScript(fullPath, args);
  }

  generatePythonScript(code: string, functionName: string): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto-generated PureMix Python wrapper
Function: ${functionName}
"""

import sys
import json
import traceback
from typing import Any, Dict

# User code
${code}

def safe_execute(func_name: str, input_data: Any) -> Dict[str, Any]:
    """Safely execute a Python function and return JSON-serializable result"""
    try:
        # Get the function from globals
        if func_name not in globals():
            return {
                "error": f"Function '{func_name}' not found",
                "available_functions": [name for name in globals() if callable(globals()[name]) and not name.startswith('_')]
            }
        
        func = globals()[func_name]
        
        # Execute the function
        if callable(func):
            # PureMix Python functions expect (data, js_context=None) signature
            # Pass None as js_context for now - could be enhanced later
            result = func(input_data, None)
            
            # Ensure result is JSON serializable
            return {
                "success": True,
                "data": result,
                "function": func_name
            }
        else:
            return {"error": f"'{func_name}' is not callable"}
            
    except Exception as e:
        return {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc(),
            "function": func_name
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
        
        input_data = json.loads(sys.argv[1])
        result = safe_execute("${functionName}", input_data)
        print(json.dumps(result, default=str))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Script execution failed: {str(e)}"}))
        sys.exit(1)
`;
  }

  runPythonScript(scriptPath: string, args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Python execution timeout (${this.config.pythonTimeout}ms)`));
      }, this.config.pythonTimeout);

      const python = spawn(this.pythonCommand!, [scriptPath, ...args], {
        stdio: 'pipe',
        env: { 
          ...process.env,
          PYTHONPATH: process.cwd(),
          PYTHONIOENCODING: 'utf-8'
        }
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (error) {
            reject(new Error(`Invalid JSON response from Python: ${stdout}\nStderr: ${stderr}`));
          }
        } else {
          reject(new Error(`Python script exited with code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`));
        }
      });

      python.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  async installPackage(packageName: string, version: string | null = null): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn(`Cannot install Python package ${packageName} - Python not available`);
      return false;
    }

    const packageSpec = version ? `${packageName}==${version}` : packageName;
    
    try {
      console.log(`📦 Installing Python package: ${packageSpec}`);
      execSync(`${this.pythonCommand!} -m pip install ${packageSpec}`, {
        stdio: 'inherit',
        timeout: 120000 // 2 minutes
      });
      console.log(`✅ Successfully installed ${packageSpec}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to install ${packageSpec}:`, (error as Error).message);
      return false;
    }
  }

  // Helper interfaces for common libraries
  createNumPyInterface(): any {
    return {
      available: async () => {
        if (!this.isAvailable) return false;
        try {
          await this.runScript(path.join(__dirname, '../scripts/check_numpy.py'));
          return true;
        } catch (error) {
          return false;
        }
      },
      array: async (data) => this.executeFunction('create_array', data, `
import numpy as np

def create_array(data):
    return np.array(data).tolist()
      `),
      calculate: async (expression, arrays) => this.executeFunction('calculate', { expression, arrays }, `
import numpy as np
import re

def calculate(data):
    expression = data['expression']
    arrays = {k: np.array(v) for k, v in data['arrays'].items()}
    
    # SECURITY: Validate expression to prevent code injection
    # Only allow safe mathematical operations and numpy functions
    safe_pattern = r'^[a-zA-Z0-9_\s\+\-\*\/\(\)\.\[\],np]+$'
    if not re.match(safe_pattern, expression):
        raise ValueError("Expression contains unsafe characters")
    
    # Whitelist of allowed operations
    allowed_funcs = {
        'np': np,
        'sum': np.sum,
        'mean': np.mean,
        'std': np.std,
        'max': np.max,
        'min': np.min,
        **arrays
    }
    
    # Safe evaluation with restricted namespace
    result = eval(expression, {"__builtins__": {}}, allowed_funcs)
    
    return result.tolist() if hasattr(result, 'tolist') else result
      `)
    };
  }

  createPandasInterface(): any {
    return {
      available: async () => {
        if (!this.isAvailable) return false;
        try {
          await this.runScript(path.join(__dirname, '../scripts/check_pandas.py'));
          return true;
        } catch (error) {
          return false;
        }
      },
      readCsv: async (filepath, options = {}) => this.executeFunction('read_csv', { filepath, options }, `
import pandas as pd

def read_csv(data):
    df = pd.read_csv(data['filepath'], **data['options'])
    return df.to_dict('records')
      `),
      analyze: async (data, operations) => this.executeFunction('analyze_data', { data, operations }, `
import pandas as pd
import json

def analyze_data(data):
    df = pd.DataFrame(data['data'])
    results = {}
    
    for operation in data['operations']:
        if operation == 'describe':
            results['describe'] = df.describe().to_dict()
        elif operation == 'info':
            results['info'] = {
                'shape': df.shape,
                'dtypes': df.dtypes.to_dict(),
                'null_counts': df.isnull().sum().to_dict()
            }
        elif operation == 'head':
            results['head'] = df.head().to_dict('records')
    
    return results
      `)
    };
  }

  createSklearnInterface(): any {
    return {
      available: async () => {
        if (!this.isAvailable) return false;
        try {
          await this.runScript(path.join(__dirname, '../scripts/check_sklearn.py'));
          return true;
        } catch (error) {
          return false;
        }
      },
      trainModel: async (modelType, X, y, params = {}) => this.executeFunction('train_model', 
        { modelType, X, y, params }, `
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import numpy as np
import pickle
import base64

def train_model(data):
    model_type = data['modelType']
    X = np.array(data['X'])
    y = np.array(data['y'])
    params = data.get('params', {})
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Create model
    models = {
        'linear_regression': LinearRegression,
        'logistic_regression': LogisticRegression,
        'random_forest_classifier': RandomForestClassifier,
        'random_forest_regressor': RandomForestRegressor
    }
    
    if model_type not in models:
        return {"error": f"Unknown model type: {model_type}"}
    
    model = models[model_type](**params)
    model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    if model_type in ['logistic_regression', 'random_forest_classifier']:
        score = accuracy_score(y_test, y_pred)
        metric = 'accuracy'
    else:
        score = mean_squared_error(y_test, y_pred)
        metric = 'mse'
    
    # Serialize model
    model_bytes = pickle.dumps(model)
    model_b64 = base64.b64encode(model_bytes).decode('utf-8')
    
    return {
        'model': model_b64,
        'score': score,
        'metric': metric,
        'predictions': y_pred.tolist(),
        'test_size': len(X_test)
    }
      `)
    };
  }

  mockPythonResponse(functionName: string, data: any): any {
    console.log(`🐍 Mocking Python function: ${functionName}`);
    return {
      __mocked: true,
      function: functionName,
      input: data,
      message: 'Python not available - install Python 3.8+ to enable this functionality',
      suggestion: 'Visit https://python.org to download and install Python'
    };
  }

  /**
   * registerModule - Register a Python module for fast access at server startup
   *
   * INPUT: moduleKey (logical name), filePath (absolute path to .py file)
   * OUTPUT: Promise that resolves when module is registered
   * GOAL: Enable language-agnostic imports where Python modules are callable like JS
   * DEPENDENCIES: File system, moduleRegistry
   */
  async registerModule(moduleKey: string, filePath: string): Promise<void> {
    if (!this.isAvailable) {
      return; // Silently skip if Python not available
    }

    try {
      // Verify file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Python module file not found: ${filePath}`);
      }

      // Register module in registry
      this.moduleRegistry.set(moduleKey, filePath);

      // Pre-validate Python syntax (optional but helpful for debugging)
      if (this.config.python?.validateSyntax) {
        await this.validatePythonSyntax(filePath);
      }

    } catch (error: any) {
      console.warn(`⚠️ Failed to register Python module '${moduleKey}':`, error.message);
    }
  }

  /**
   * validatePythonSyntax - Quick syntax check for Python files
   */
  private async validatePythonSyntax(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.pythonCommand!, ['-m', 'py_compile', filePath], {
        stdio: 'pipe'
      });

      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });

      pythonProcess.on('error', () => {
        resolve(false); // Syntax validation failed, but don't throw
      });
    });
  }

  /**
   * getRegisteredModules - Get list of registered Python modules
   */
  getRegisteredModules(): string[] {
    return Array.from(this.moduleRegistry.keys());
  }

  /**
   * resolvePythonImport - Check if import path matches a registered Python module
   * INPUT: importPath - relative path like '../lib/data_processor'
   * OUTPUT: { isMatch: boolean, moduleKey?: string, filePath?: string }
   */
  resolvePythonImport(importPath: string, currentDir: string): { isMatch: boolean; moduleKey?: string; filePath?: string } {
    if (!this.isAvailable) {
      return { isMatch: false };
    }

    // Normalize the import path - resolve it relative to current directory
    let resolvedPath: string;
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      resolvedPath = path.resolve(currentDir, importPath);
    } else {
      // Handle absolute imports from app root
      resolvedPath = path.resolve(process.cwd(), 'app', importPath);
    }

    // Try to find a matching registered module
    for (const [moduleKey, registeredPath] of this.moduleRegistry.entries()) {
      const registeredPathNormalized = path.resolve(registeredPath);

      // Check if the resolved path matches the registered module (without .py extension)
      if (resolvedPath + '.py' === registeredPathNormalized) {
        return {
          isMatch: true,
          moduleKey,
          filePath: registeredPathNormalized
        };
      }
    }

    return { isMatch: false };
  }

  /**
   * getPythonModuleFunctions - Extract function names from a registered Python module
   * INPUT: moduleKey - key for registered module
   * OUTPUT: Array of function names found in the module
   */
  async getPythonModuleFunctions(moduleKey: string): Promise<string[]> {
    if (!this.isAvailable) {
      return [];
    }

    const filePath = this.moduleRegistry.get(moduleKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return [];
    }

    try {
      const pythonCode = fs.readFileSync(filePath, 'utf8');
      const functionMatches = pythonCode.match(/^def\s+(\w+)\s*\(/gm);

      if (functionMatches) {
        return functionMatches.map(match =>
          match.replace(/^def\s+(\w+)\s*\(.*/, '$1')
        );
      }

      return [];
    } catch (error: any) {
      console.warn(`⚠️ Failed to extract functions from Python module '${moduleKey}':`, error.message);
      return [];
    }
  }

  available(): boolean {
    return this.isAvailable;
  }

  /**
   * Clean all temporary Python files on startup
   * Simple and effective - no runtime overhead
   */
  private cleanupAllTempFiles(): void {
    if (!fs.existsSync(this.tempDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(this.tempDir);
      let cleaned = 0;

      files.forEach(file => {
        try {
          const filePath = path.join(this.tempDir, file);
          fs.unlinkSync(filePath);
          cleaned++;
        } catch (error) {
          // Ignore errors - best effort cleanup
        }
      });

      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} Python temp file${cleaned > 1 ? 's' : ''} on startup`);
      }
    } catch (error) {
      // Ignore errors - temp cleanup is not critical
    }
  }
}

export default PythonExecutor;