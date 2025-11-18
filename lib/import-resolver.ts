/**
 * Import Resolver - Smart Module Resolution System
 * 
 * PURPOSE: Resolves ES6 imports for both Node.js modules and local files during server-side rendering
 * ARCHITECTURE: Cache-based resolution → Node modules + Local files → Runtime import
 * 
 * FLOW DIAGRAM:
 * 1. Parse import statements from .puremix files
 * 2. Determine if import is Node module or local file
 * 3. Resolve path using Node.js resolution algorithm
 * 4. Cache resolved modules for performance
 * 5. Return imported functions/objects for server execution
 * 
 * DEPENDENCIES:
 * - Node.js path, fs modules for file system operations
 * - Dynamic import() for ES6 module loading
 * - Cache system for performance optimization
 * 
 * RESOLUTION TYPES:
 * - Node modules: 'express', 'lodash', etc.
 * - Relative imports: './utils', '../controllers/auth'
 * - Absolute imports: '/app/services/database'
 * - TypeScript files: .ts extensions with compilation
 */

import path from 'path';
import fs from 'fs';

/**
 * ImportResolver - Handles ES6 import resolution for server-side rendering
 * Supports both Node.js modules and local file imports with caching
 * Includes seamless Python module integration
 */
class ImportResolver {
  private cache: Map<string, any>;
  private basePath: string;
  private pythonExecutor?: any; // PythonExecutor instance for seamless Python imports

  constructor(appDir: string, pythonExecutor?: any) {
    this.cache = new Map();
    this.basePath = path.resolve(appDir);
    this.pythonExecutor = pythonExecutor;
  }

  async resolveImports(importStatements: string[], currentFilePath?: string): Promise<Record<string, any>> {
    const resolved: Record<string, any> = {};

    for (const importStatement of importStatements) {
      try {
        const parsed = this.parseImportStatement(importStatement);
        if (parsed) {
          const moduleName = parsed.specifier;
          const imported = parsed.isNodeModule 
            ? await this.resolveNodeModule(moduleName)
            : await this.resolveLocalImport(moduleName, currentFilePath ? path.dirname(currentFilePath) : this.basePath);

          // Handle different import types
          if (parsed.isDefaultImport && imported) {
            resolved[parsed.defaultName!] = imported.default || imported;
          }
          
          if (parsed.namedImports && imported) {
            for (const namedImport of parsed.namedImports) {
              const importName = namedImport.imported;
              const localName = namedImport.local || namedImport.imported;
              resolved[localName] = imported[importName];
            }
          }

          if (parsed.isNamespaceImport && imported) {
            resolved[parsed.namespaceName!] = imported;
          }
        }
      } catch (error: any) {
        console.warn(`Failed to resolve import: ${importStatement}`, error.message);
      }
    }

    return resolved;
  }

  private parseImportStatement(statement: string): ParsedImport | null {
    const trimmed = statement.trim();
    
    // Handle different import patterns
    if (trimmed.startsWith('import ')) {
      // import defaultExport from "module-name";
      let match = trimmed.match(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?$/);
      if (match) {
        return {
          defaultName: match[1],
          specifier: match[2],
          isDefaultImport: true,
          isNodeModule: !match[2].startsWith('.') && !match[2].startsWith('/')
        };
      }

      // import * as name from "module-name";
      match = trimmed.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"];?$/);
      if (match) {
        return {
          namespaceName: match[1],
          specifier: match[2],
          isNamespaceImport: true,
          isNodeModule: !match[2].startsWith('.') && !match[2].startsWith('/')
        };
      }

      // import { export1, export2 } from "module-name";
      match = trimmed.match(/^import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"];?$/);
      if (match) {
        const namedImports = match[1].split(',').map(item => {
          const parts = item.trim().split(/\s+as\s+/);
          return {
            imported: parts[0].trim(),
            local: parts[1]?.trim()
          };
        });

        return {
          namedImports,
          specifier: match[2],
          isNodeModule: !match[2].startsWith('.') && !match[2].startsWith('/')
        };
      }

      // import defaultExport, { export1, export2 } from "module-name";
      match = trimmed.match(/^import\s+(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"];?$/);
      if (match) {
        const namedImports = match[2].split(',').map(item => {
          const parts = item.trim().split(/\s+as\s+/);
          return {
            imported: parts[0].trim(),
            local: parts[1]?.trim()
          };
        });

        return {
          defaultName: match[1],
          namedImports,
          specifier: match[3],
          isDefaultImport: true,
          isNodeModule: !match[3].startsWith('.') && !match[3].startsWith('/')
        };
      }
    }

    return null;
  }

  async resolveLocalImport(importPath: string, currentDir: string): Promise<any> {
    const cacheKey = `local:${importPath}:${currentDir}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    console.log(`🔍 IMPORT DEBUG: Resolving '${importPath}' from '${currentDir}'`);

    try {
      // FIRST: Check if this is a pre-loaded Python module
      if (this.pythonExecutor) {
        const pythonMatch = this.pythonExecutor.resolvePythonImport(importPath, currentDir);
        if (pythonMatch.isMatch && pythonMatch.moduleKey && pythonMatch.filePath) {
          console.log(`🐍 PYTHON IMPORT MATCH: '${importPath}' -> '${pythonMatch.moduleKey}'`);

          // Get the functions from this Python module
          const functions = await this.pythonExecutor.getPythonModuleFunctions(pythonMatch.moduleKey);
          console.log(`🐍 PYTHON FUNCTIONS: [${functions.join(', ')}]`);

          // Create seamless wrapper functions for each Python function
          const pythonWrappers: Record<string, any> = {};

          for (const functionName of functions) {
            pythonWrappers[functionName] = async (data: any, jsContext?: any) => {
              if (this.pythonExecutor && this.pythonExecutor.available()) {
                try {
                  console.log(`🐍 CALLING: ${functionName}(${JSON.stringify(data).substring(0, 100)}...)`);
                  const result = await this.pythonExecutor.executeFile(pythonMatch.filePath!, functionName, data, jsContext);
                  console.log(`🐍 SUCCESS: ${functionName} -> ${JSON.stringify(result).substring(0, 100)}...`);
                  return result; // Return the result directly (no .data wrapper)
                } catch (error: any) {
                  console.warn(`🐍 Python function '${functionName}' failed:`, error.message);
                  return {
                    error: error.message,
                    __pythonError: true,
                    functionName,
                    modulePath: pythonMatch.filePath
                  };
                }
              } else {
                console.warn(`🐍 Python not available for function '${functionName}'`);
                return {
                  error: 'Python not available',
                  __pythonUnavailable: true,
                  functionName,
                  modulePath: pythonMatch.filePath
                };
              }
            };
          }

          // Add metadata
          pythonWrappers.__pythonModule = {
            path: pythonMatch.filePath,
            moduleKey: pythonMatch.moduleKey,
            functions: functions,
            available: this.pythonExecutor?.available() || false
          };

          console.log(`🐍 SEAMLESS PYTHON MODULE READY: ${functions.length} functions available`);
          this.cache.set(cacheKey, pythonWrappers);
          return pythonWrappers;
        }
      }

      // SECOND: Normal file resolution for JS/TS/components
      let resolvedPath: string;

      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        resolvedPath = path.resolve(currentDir, importPath);
      } else {
        resolvedPath = path.resolve(this.basePath, importPath);
      }

      console.log(`🔍 IMPORT DEBUG: Resolved path: '${resolvedPath}'`);


      // Try different file extensions (including .puremix for components and .py for Python)
      const extensions = ['.js', '.ts', '.mjs', '.json', '.puremix', '.py'];
      let finalPath = resolvedPath;
      let found = false;

      // Check if the path already has an extension
      if (!path.extname(resolvedPath)) {
        for (const ext of extensions) {
          const testPath = resolvedPath + ext;
          console.log(`🔍 IMPORT DEBUG: Checking path: '${testPath}' - exists: ${fs.existsSync(testPath)}`);
          if (fs.existsSync(testPath)) {
            finalPath = testPath;
            found = true;
            console.log(`✅ IMPORT DEBUG: Found file: '${testPath}'`);
            break;
          }
        }
        
        // Check for index files
        if (!found) {
          for (const ext of extensions) {
            const indexPath = path.join(resolvedPath, 'index' + ext);
            if (fs.existsSync(indexPath)) {
              finalPath = indexPath;
              found = true;
              break;
            }
          }
        }
      } else {
        found = fs.existsSync(resolvedPath);
      }

      if (!found) {
        throw new Error(`Module not found: ${importPath}`);
      }

      // For .json files, read and parse directly
      if (finalPath.endsWith('.json')) {
        const content = fs.readFileSync(finalPath, 'utf8');
        const parsed = JSON.parse(content);
        this.cache.set(cacheKey, parsed);
        return parsed;
      }

      // For .puremix files, return a component reference for the template engine
      if (finalPath.endsWith('.puremix')) {
        const componentName = path.basename(finalPath, '.puremix');
        const componentRef = {
          __componentPath: finalPath,
          __componentName: componentName,
          default: componentName // For default imports like: import UserCard from '../components/UserCard.js'
        };
        this.cache.set(cacheKey, componentRef);
        return componentRef;
      }

      // For .py files, return seamless Python module wrapper functions
      if (finalPath.endsWith('.py')) {
        const fs = await import('fs');
        const pythonCode = fs.readFileSync(finalPath, 'utf8');

        // Extract Python function names from the file
        const functionMatches = pythonCode.match(/^def\s+(\w+)\s*\(/gm);
        const pythonFunctions: Record<string, any> = {};

        if (functionMatches) {
          for (const match of functionMatches) {
            const functionName = match.replace(/^def\s+(\w+)\s*\(.*/, '$1');

            // Create seamless JavaScript wrapper function that calls Python directly
            pythonFunctions[functionName] = async (data: any, jsContext?: any) => {
              // If Python executor is available, call the function directly
              if (this.pythonExecutor && this.pythonExecutor.available()) {
                try {
                  const result = await this.pythonExecutor.executeFile(finalPath, functionName, data, jsContext);
                  return result.data; // Return just the data, not the wrapper
                } catch (error: any) {
                  console.warn(`🐍 Python function '${functionName}' failed:`, error.message);
                  return {
                    error: error.message,
                    __pythonError: true,
                    functionName,
                    modulePath: finalPath
                  };
                }
              } else {
                // Fallback when Python not available
                console.warn(`🐍 Python not available for function '${functionName}'`);
                return {
                  error: 'Python not available',
                  __pythonUnavailable: true,
                  functionName,
                  modulePath: finalPath
                };
              }
            };
          }
        }

        // Add metadata for debugging
        pythonFunctions.__pythonModule = {
          path: finalPath,
          functions: functionMatches ? functionMatches.map(m => m.replace(/^def\s+(\w+)\s*\(.*/, '$1')) : [],
          available: this.pythonExecutor?.available() || false
        };

        this.cache.set(cacheKey, pythonFunctions);
        return pythonFunctions;
      }

      // For JS/TS files, use dynamic import
      const fileUrl = new URL(`file://${finalPath}`);
      const module = await import(fileUrl.href);
      
      this.cache.set(cacheKey, module);
      return module;
      
    } catch (error: any) {
      console.warn(`Failed to resolve local import '${importPath}':`, error.message);
      throw error;
    }
  }

  async resolveNodeModule(moduleName: string): Promise<any> {
    const cacheKey = `node:${moduleName}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try to resolve from node_modules
      const module = await import(moduleName);
      this.cache.set(cacheKey, module);
      return module;
    } catch (error: any) {
      console.warn(`Failed to resolve node module '${moduleName}':`, error.message);
      throw error;
    }
  }

  // Helper method to check if a module exists
  moduleExists(moduleName: string): boolean {
    try {
      if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
        const resolvedPath = path.resolve(this.basePath, moduleName);
        return fs.existsSync(resolvedPath) || 
               fs.existsSync(resolvedPath + '.js') ||
               fs.existsSync(resolvedPath + '.ts') ||
               fs.existsSync(path.join(resolvedPath, 'index.js')) ||
               fs.existsSync(path.join(resolvedPath, 'index.ts'));
      } else {
        require.resolve(moduleName);
        return true;
      }
    } catch {
      return false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

interface ParsedImport {
  specifier: string;
  defaultName?: string;
  namedImports?: Array<{ imported: string; local?: string }>;
  namespaceName?: string;
  isDefaultImport?: boolean;
  isNamespaceImport?: boolean;
  isNodeModule: boolean;
}

export default ImportResolver;