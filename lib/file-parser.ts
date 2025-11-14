/**
 * File Parser - .puremix File Processing Engine
 * 
 * PURPOSE: Parses .puremix files and extracts framework components (HTML, loaders, actions, etc.)
 * ARCHITECTURE: Regex-based extraction → Function compilation → Component isolation
 * 
 * FLOW DIAGRAM:
 * 1. Read .puremix file content → Extract framework tags
 * 2. Parse imports, loaders, server functions, client scripts
 * 3. Compile JavaScript/TypeScript functions safely
 * 4. Extract Python functions and clean HTML content
 * 5. Return structured ParsedFile object
 * 
 * DEPENDENCIES:
 * - types.ts for ParsedFile interface
 * - Node.js path module for file resolution
 * - Safe function compilation with error handling
 * 
 * EXTRACTED COMPONENTS:
 * - <layout> - Layout inheritance
 * - <head> - HTML head content
 * - <imports> - ES6 imports and component imports  
 * - <loader> - Server-side data loading functions
 * - <script server> - Server-side action functions
 * - <script client> - Client-side JavaScript
 * - <script server lang="python"> - Python functions
 */

import path from 'path';
import type { ParsedFile } from './types.js';

interface FunctionInfo {
  name: string;
  function: Function;
  originalCode: string;
  language?: string;
}

/**
 * FileParser - Core class for parsing .puremix files
 * Extracts and compiles all framework components from mixed HTML/JS/Python files
 */
class FileParser {
  private scriptIdCounter: number = 0;
  private importResolver?: any; // ImportResolver instance for seamless Python imports
  private engine?: any; // PureMixEngine instance for global Python functions

  constructor(importResolver?: any, engine?: any) {
    this.scriptIdCounter = 0;
    this.importResolver = importResolver;
    this.engine = engine;
  }

  async parse(content: string, filePath: string): Promise<ParsedFile> {
    const layout = this.extractLayout(content);
    const head = this.extractHead(content);
    const loading = this.extractLoading(content);
    const { imports, componentImports, pythonImports } = this.extractImports(content, filePath);
    const loaders = await this.extractLoaders(content, filePath);
    const serverFunctions = await this.extractServerFunctions(content, filePath);
    const clientScripts = this.extractClientScripts(content);
    const pythonFunctions = this.extractPythonFunctions(content);
    const html = this.cleanHtml(content);

    return {
      layout,
      head,
      loading,
      html,
      imports,
      componentImports,
      pythonImports,
      loaders,
      serverFunctions,
      clientScripts,
      pythonFunctions
    };
  }

  private extractLayout(content: string): string | undefined {
    const match = content.match(/<layout>(.*?)<\/layout>/s);
    return match ? match[1].trim() : undefined;
  }

  private extractHead(content: string): string | undefined {
    const match = content.match(/<head>(.*?)<\/head>/s);
    return match ? match[1].trim() : undefined;
  }

  private extractLoading(content: string): string | undefined {
    const match = content.match(/<loading>(.*?)<\/loading>/s);
    return match ? match[1].trim() : undefined;
  }

  private extractImports(content: string, filePath: string): { imports: string[], componentImports: Record<string, string>, pythonImports: Record<string, string> } {
    const importsMatch = content.match(/<imports>(.*?)<\/imports>/s);
    if (!importsMatch) return { imports: [], componentImports: {}, pythonImports: {} };

    const importsBlock = importsMatch[1];
    const lines = importsBlock.split('\n');
    const imports: string[] = [];
    const componentImports: Record<string, string> = {};
    const pythonImports: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && (trimmed.startsWith('import ') || trimmed.startsWith('const ') || trimmed.startsWith('var ') || trimmed.startsWith('let '))) {
        // Check for component imports: import ComponentName from 'path' (with or without .puremix extension)
        const componentMatch = trimmed.match(/^import\s+(\w+)\s+from\s+['"`]([^'"`]+(?:\.puremix)?)['"`]/);
        if (componentMatch) {
          const componentName = componentMatch[1];
          const componentPath = componentMatch[2];
          
          // Add .puremix extension if not present (for component imports)
          const fullComponentPath = componentPath.endsWith('.puremix') ? componentPath : `${componentPath}.puremix`;
          
          // Resolve relative path based on current file location
          const resolvedPath = this.resolveComponentPath(fullComponentPath, filePath);
          console.log(`🔍 COMPONENT DEBUG: Found component import: ${componentName} -> ${componentPath} -> ${resolvedPath}`);
          componentImports[componentName] = resolvedPath;
        } 
        // Check for Python function imports: import { pythonFunction } from './script.py.js'
        else {
          const pythonMatch = trimmed.match(/^import\s+\{\s*([^}]+)\s*\}\s+from\s+['"`]([^'"`]+\.py)['"`]/);
          if (pythonMatch) {
            const functionNames = pythonMatch[1].split(',').map(name => name.trim());
            const pythonPath = pythonMatch[2];
            
            // Resolve relative path
            const resolvedPath = this.resolvePythonPath(pythonPath, filePath);
            functionNames.forEach(funcName => {
              pythonImports[funcName] = resolvedPath;
            });
          } else {
            imports.push(trimmed);
          }
        }
      }
    }

    return { imports, componentImports, pythonImports };
  }

  /**
   * resolveComponentPath - Safely resolve component import paths
   * 
   * INPUT: importPath (from import statement), currentFilePath (current .puremix file)
   * OUTPUT: Absolute path to component file
   * GOAL: Resolve component imports while preventing path traversal attacks
   * SECURITY: Validates paths stay within app directory
   */
  private resolveComponentPath(importPath: string, currentFilePath: string): string {
    const appDir = path.resolve(process.cwd(), 'app');
    
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Relative path - resolve relative to current file
      const currentDir = path.dirname(currentFilePath);
      const resolvedPath = path.resolve(currentDir, importPath);
      
      // SECURITY: Ensure resolved path is within app directory
      if (!resolvedPath.startsWith(appDir)) {
        throw new Error(`Component import path outside app directory: ${importPath}`);
      }
      
      return resolvedPath;
    } else {
      // Absolute path from app root
      const resolvedPath = path.resolve(appDir, importPath);
      
      // SECURITY: Ensure absolute path is within app directory
      if (!resolvedPath.startsWith(appDir)) {
        throw new Error(`Component import path outside app directory: ${importPath}`);
      }
      
      return resolvedPath;
    }
  }

  /**
   * resolvePythonPath - Safely resolve Python file import paths
   * 
   * INPUT: importPath (from import statement), currentFilePath (current .puremix file)
   * OUTPUT: Absolute path to Python file
   * GOAL: Resolve Python imports while preventing path traversal attacks
   * SECURITY: Validates paths stay within project directory
   */
  private resolvePythonPath(importPath: string, currentFilePath: string): string {
    const projectDir = path.resolve(process.cwd());
    
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Relative path - resolve relative to current file
      const currentDir = path.dirname(currentFilePath);
      const resolvedPath = path.resolve(currentDir, importPath);
      
      // SECURITY: Ensure resolved path is within project directory
      if (!resolvedPath.startsWith(projectDir)) {
        throw new Error(`Python import path outside project directory: ${importPath}`);
      }
      
      return resolvedPath;
    } else {
      // Absolute path from project root
      const resolvedPath = path.resolve(projectDir, importPath);
      
      // SECURITY: Ensure absolute path is within project directory
      if (!resolvedPath.startsWith(projectDir)) {
        throw new Error(`Python import path outside project directory: ${importPath}`);
      }
      
      return resolvedPath;
    }
  }

  private parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const matches = attrString.matchAll(/(\w+)=["']([^"']*)["']/g);
    
    for (const match of matches) {
      attrs[match[1]] = match[2];
    }
    
    return attrs;
  }

  private extractImportsFromContent(content: string): string[] {
    const lines = content.split('\n');
    const imports: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('import ')) {
        // FIXED: Exclude component imports from regular function compilation
        // Component imports are handled separately by the template engine
        const isComponentImport = trimmedLine.match(/import\s+\w+\s+from\s+['"`][^'"`]*\/components\/[^'"`]*['"`]/) && 
                                 !trimmedLine.includes('.js') && !trimmedLine.includes('.ts') && !trimmedLine.includes('.py');
        
        if (!isComponentImport) {
          imports.push(trimmedLine);
        }
      }
    }
    
    return imports;
  }

  private async extractLoaders(content: string, filePath: string): Promise<Record<string, FunctionInfo>> {
    const loaderMatch = content.match(/<loader(?:\s+[^>]*)?>(.+?)<\/loader>/gs);
    console.log(`🔍 DEBUG: Looking for loaders in ${filePath}`);
    console.log(`🔍 DEBUG: Found ${loaderMatch?.length || 0} loader blocks`);
    if (!loaderMatch) return {};

    const loaders: Record<string, FunctionInfo> = {};
    const allImports = this.extractImportsFromContent(content);
    
    for (const match of loaderMatch) {
      const loaderContent = match.replace(/<\/?loader[^>]*>/g, '').trim();
      
      // Extract all function declarations
      const functionMatches = loaderContent.matchAll(/async\s+function\s+(\w+)\s*\([^)]*\)\s*{/g);
      
      for (const funcMatch of functionMatches) {
        const functionName = funcMatch[1];
        console.log(`🔍 DEBUG: Found function ${functionName} in loader`);
        
        try {
          const compiledFunction = await this.compileFunction(loaderContent, filePath, {
            imports: allImports,
            type: 'loader'
          });
          
          // Extract the specific function
          const specificFunction = await this.extractSpecificFunction(compiledFunction, functionName);
          
          loaders[functionName] = {
            name: functionName,
            function: specificFunction,
            originalCode: loaderContent
          };
        } catch (error: any) {
          console.warn(`Failed to compile loader function '${functionName}' in ${filePath}:`, error.message);
          // Create a fallback function that returns an error
          loaders[functionName] = {
            name: functionName,
            function: async () => ({ error: `Failed to load function: ${error.message}` }),
            originalCode: loaderContent
          };
        }
      }
    }
    
    return loaders;
  }

  private async extractServerFunctions(content: string, filePath: string): Promise<Record<string, FunctionInfo>> {
    // IMPROVED: More robust server script block extraction
    // Find all server script blocks with better regex and validation
    const serverScriptPattern = /<script\s+server(?:\s+[^>]*)?>(.+?)<\/script>/gs;
    const serverMatches = Array.from(content.matchAll(serverScriptPattern));
    
    if (serverMatches.length === 0) return {};

    console.log(`🔍 DEBUG: Found ${serverMatches.length} server script blocks in ${path.basename(filePath)}`);

    const functions: Record<string, FunctionInfo> = {};
    const allImports = this.extractImportsFromContent(content);

    for (let i = 0; i < serverMatches.length; i++) {
      const match = serverMatches[i];
      
      // CRITICAL FIX: Extract script content more carefully to avoid template contamination
      let scriptContent = match[1].trim();
      
      console.log(`🔍 DEBUG: Processing server script block ${i + 1}, content length: ${scriptContent.length}`);
      console.log(`🔍 DEBUG: Script content preview: "${scriptContent.slice(0, 100).replace(/\n/g, '\\n')}..."`);
      
      // SAFETY CHECK: Validate that this looks like JavaScript code
      if (!this.isValidJavaScriptContent(scriptContent)) {
        console.warn(`⚠️ WARNING: Server script block ${i + 1} contains non-JavaScript content, skipping compilation`);
        console.warn(`Content preview: "${scriptContent.slice(0, 200)}"`);
        continue;
      }
      
      // Extract language attribute
      const langMatch = match[0].match(/<script\s+server(?:\s+lang=["']([^"']+)["'])?/);
      const language = (langMatch && langMatch[1]) ? langMatch[1] : 'javascript';
      
      if (language === 'javascript' || !language) {
        // Extract JavaScript functions
        const functionMatches = scriptContent.matchAll(/(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*{/g);
        
        for (const funcMatch of functionMatches) {
          const functionName = funcMatch[1];
          
          try {
            const compiledFunction = await this.compileFunction(scriptContent, filePath, {
              imports: allImports,
              type: 'server'
            });
            
            // Extract the specific function from the compiled code
            const specificFunction = await this.extractSpecificFunction(compiledFunction, functionName);
            functions[functionName] = {
              name: functionName,
              function: specificFunction,
              originalCode: scriptContent,
              language: 'javascript'
            };
          } catch (error: any) {
            console.warn(`Failed to compile server function '${functionName}' in ${filePath}:`, error.message);
            functions[functionName] = {
              name: functionName,
              function: async () => ({ error: `Failed to execute function: ${error.message}` }),
              originalCode: scriptContent,
              language: 'javascript'
            };
          }
        }
      } else if (language === 'python') {
        // Handle Python functions
        const pythonFunctionMatches = scriptContent.matchAll(/def\s+(\w+)\s*\([^)]*\):/g);
        
        for (const funcMatch of pythonFunctionMatches) {
          const functionName = funcMatch[1];
          
          const pythonFunction = async (data: any, request: any) => {
            if (request.python && request.python.executeFunction) {
              return await request.python.executeFunction(functionName, data, scriptContent);
            } else {
              return { error: 'Python executor not available' };
            }
          };
          
          functions[functionName] = {
            name: functionName,
            function: pythonFunction,
            originalCode: scriptContent,
            language: 'python'
          };
        }
      }
    }
    
    return functions;
  }

  private async extractSpecificFunction(compiledResult: any, functionName: string): Promise<Function> {
    // Handle case where compiledResult is undefined
    if (!compiledResult) {
      throw new Error(`Compiled result is undefined for function '${functionName}'`);
    }
    
    try {
      // The compiledResult is already the executed result from compileFunction
      if (typeof compiledResult === 'object' && compiledResult[functionName]) {
        return compiledResult[functionName];
      } else if (typeof compiledResult === 'function') {
        return compiledResult;
      } else {
        throw new Error(`Function '${functionName}' not found in compiled result`);
      }
    } catch (innerError: any) {
      throw new Error(`Failed to extract function '${functionName}': ${innerError.message}`);
    }
  }

  private async compileFunction(code: string, filePath: string, context: any): Promise<any> {
    try {
      const imports = context.imports ? context.imports : [];
      const functionNames = this.extractFunctionNames(code);
      
      // Handle ES6 imports using enhanced ImportResolver (supports seamless Python imports)
      const resolvedImports: Record<string, any> = {};

      if (this.importResolver) {
        // Use the enhanced ImportResolver that supports Python modules
        console.log(`🔍 FILE PARSER: Using ImportResolver for ${imports.length} imports`);
        const resolved = await this.importResolver.resolveImports(imports, filePath);
        Object.assign(resolvedImports, resolved);
        console.log(`🔍 FILE PARSER: Resolved ${Object.keys(resolved).length} imports successfully`);
      } else {
        // Fallback to old logic for backward compatibility
        console.warn(`⚠️ FILE PARSER: No ImportResolver available, using fallback import logic`);
        for (const importStatement of imports) {
          const importMatch = importStatement.match(/import\s+(?:\{\s*([^}]+)\s*\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"`]([^'"`]+)['"`]/);
          if (importMatch) {
            const namedImports = importMatch[1];
            const namespaceImport = importMatch[2];
            const defaultImport = importMatch[3];
            const modulePath = importMatch[4];

            try {
              // Resolve module path relative to the puremix file
              const resolvedPath = this.resolveModulePath(modulePath, filePath);
              const module = await import(resolvedPath);

              if (namedImports) {
                // Handle named imports: import { foo, bar } from 'module'
                const names = namedImports.split(',').map(name => name.trim());
                names.forEach(name => {
                  resolvedImports[name] = module[name];
                });
              } else if (namespaceImport) {
                // Handle namespace import: import * as foo from 'module'
                resolvedImports[namespaceImport] = module;
              } else if (defaultImport) {
                // Handle default import: import foo from 'module'
                resolvedImports[defaultImport] = module.default || module;
              }
            } catch (importError: any) {
              console.warn(`Failed to import ${modulePath}: ${importError.message}`);
              // Continue without the import - create fallback functions
              if (namedImports) {
                const names = namedImports.split(',').map(name => name.trim());
                names.forEach(name => {
                  resolvedImports[name] = () => ({ error: `Import ${name} not available` });
                });
              }
            }
          }
        }
      }

      // Add global Python functions to the compilation context for direct calling
      if (this.engine && this.engine.getAllGlobalPythonFunctions) {
        const globalPythonFunctions = this.engine.getAllGlobalPythonFunctions();
        console.log(`🔍 FILE PARSER: Adding ${globalPythonFunctions.size} global Python functions to compilation context`);

        for (const [functionName, pythonFunction] of globalPythonFunctions) {
          if (!resolvedImports[functionName]) { // Don't override explicit imports
            resolvedImports[functionName] = pythonFunction;
          }
        }
      }

      // Create a new function that includes the resolved imports in its scope
      const paramNames = Object.keys(resolvedImports);
      const paramValues = Object.values(resolvedImports);
      
      // Build the function code
      const functionCode = `
        ${code}
        
        // Export all functions
        const exports = {};
        ${functionNames.map(name => `if (typeof ${name} !== 'undefined') exports.${name} = ${name};`).join('\n')}
        return exports;
      `;
      
      // DEBUG: Log the function code being compiled for troubleshooting
      if (functionCode.includes('const SECURITY_CONFIG')) {
        console.log(`🔍 DEBUG: Function code for ${filePath}:`);
        console.log(`Function parameters: [${paramNames.join(', ')}]`);
        console.log(`Function code preview: "${functionCode.substring(0, 500)}..."`);
      }
      
      // Create and execute the function with the resolved imports
      const compiledFunction = new Function(...paramNames, functionCode);
      const result = compiledFunction(...paramValues);
      
      return result;
    } catch (error: any) {
      console.error(`❌ DEBUG: Function compilation error for ${filePath}:`, error.message);
      throw new Error(`Compilation failed for ${filePath}: ${error.message}`);
    }
  }

  private resolveModulePath(modulePath: string, currentFilePath: string): string {
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      // Relative path - resolve relative to current file
      const currentDir = path.dirname(currentFilePath);
      const resolvedPath = path.resolve(currentDir, modulePath);
      
      // FIXED: Auto-detect component imports and use .puremix extension
      const hasExtension = path.extname(resolvedPath) !== '';
      let finalPath: string;
      
      if (hasExtension) {
        finalPath = resolvedPath;
      } else {
        // Check if this is importing from a components directory
        const isComponentImport = modulePath.includes('/components/') || modulePath.includes('../components/') || modulePath.includes('./components/');
        finalPath = isComponentImport ? `${resolvedPath}.puremix` : `${resolvedPath}.js`;
      }
      
      // Convert to file URL for dynamic import
      return `file://${finalPath}`;
    } else {
      // Absolute path or node module
      if (modulePath.startsWith('/')) {
        const hasExtension = path.extname(modulePath) !== '';
        let finalPath: string;
        
        if (hasExtension) {
          finalPath = modulePath;
        } else {
          // Check if this is importing from a components directory
          const isComponentImport = modulePath.includes('/components/');
          finalPath = isComponentImport ? `${modulePath}.puremix` : `${modulePath}.js`;
        }
        return `file://${finalPath}`;
      } else {
        // Node module - let Node.js resolve it
        return modulePath;
      }
    }
  }

  private extractFunctionNames(code: string): string[] {
    const functionNames: string[] = [];
    const matches = code.matchAll(/(?:async\s+)?function\s+(\w+)/g);
    
    for (const match of matches) {
      functionNames.push(match[1]);
    }
    
    return functionNames;
  }

  private extractClientScripts(content: string): string[] {
    const scriptMatches = content.match(/<script(?:\s+[^>]*)?>(.*?)<\/script>/gs);
    if (!scriptMatches) return [];

    const scripts: string[] = [];
    
    for (const match of scriptMatches) {
      // Skip server scripts
      if (match.includes('server')) continue;
      
      const scriptContent = match.replace(/<\/?script[^>]*>/g, '').trim();
      if (scriptContent) {
        scripts.push(scriptContent);
      }
    }
    
    return scripts;
  }

  private extractPythonFunctions(content: string): Record<string, string> {
    const pythonFunctions: Record<string, string> = {};
    const serverMatches = content.match(/<script\s+server\s+lang=["']python["']>(.*?)<\/script>/gs);
    
    if (!serverMatches) return pythonFunctions;
    
    for (const match of serverMatches) {
      const pythonCode = match.replace(/<\/?script[^>]*>/g, '').trim();
      const functionMatches = pythonCode.matchAll(/def\s+(\w+)\s*\([^)]*\):/g);
      
      for (const funcMatch of functionMatches) {
        const functionName = funcMatch[1];
        pythonFunctions[functionName] = pythonCode;
      }
    }
    
    return pythonFunctions;
  }

  private cleanHtml(content: string): string {
    return content
      .replace(/<layout>.*?<\/layout>/gs, '')
      .replace(/<head>.*?<\/head>/gs, '')
      .replace(/<loading>.*?<\/loading>/gs, '')
      .replace(/<imports>.*?<\/imports>/gs, '')
      .replace(/<loader.*?>.*?<\/loader>/gs, '')
      .replace(/<script\s+server.*?>.*?<\/script>/gs, '') // Only remove server scripts
      .trim();
  }

  /**
   * Validate that content looks like JavaScript code and not HTML/template content
   * This prevents template expressions from corrupting server script compilation
   */
  private isValidJavaScriptContent(content: string): boolean {
    const trimmed = content.trim();
    
    // Empty content is valid (though useless)
    if (!trimmed) return true;
    
    // CRITICAL RED FLAGS: These patterns indicate template contamination
    const criticalInvalidPatterns = [
      // Template expressions that shouldn't be in JavaScript
      /\{load\w+\.data\./,
      // Standalone template expressions (not in strings/comments) - these are more precise indicators
      /^\s*\{[^}]+\?\s*$/m,
      /^\s*\}\s*:\s*$/m,
    ];

    // IMPROVED: More context-aware HTML validation
    // Only flag HTML as invalid if it appears in obvious template contexts, not in return statements or template literals
    const htmlContentPattern = /<\/?(div|span|section|h[1-6]|p|button|form|input)\b[^>]*>/i;
    if (htmlContentPattern.test(trimmed)) {
      // Check if the HTML is in a valid JavaScript context
      const isInTemplateReturn = /return\s*\{[\s\S]*`[\s\S]*<[^>]+>/.test(trimmed) || // Template literal in return
                                /return\s*\{[\s\S]*['"][^'"]*<[^>]+>/.test(trimmed) || // String with HTML in return
                                /return\s*['"`][^'"]*<[^>]+>/.test(trimmed); // Direct string return with HTML

      // Also check if it's within template literal context (backticks)
      const lines = trimmed.split('\n');
      let inTemplateLiteral = false;
      let hasInvalidHTML = false;
      
      for (const line of lines) {
        // Track template literal state
        if (line.includes('`')) {
          const backtickCount = (line.match(/`/g) || []).length;
          if (backtickCount % 2 === 1) {
            inTemplateLiteral = !inTemplateLiteral;
          }
        }
        
        // If we find HTML outside of template literals and return contexts, it's invalid
        if (htmlContentPattern.test(line) && !inTemplateLiteral && !isInTemplateReturn) {
          // Further check: is this line part of a string or template literal?
          const htmlMatch = line.match(htmlContentPattern);
          if (htmlMatch) {
            const beforeHtml = line.substring(0, htmlMatch.index);
            const hasOpenQuote = (beforeHtml.match(/['"]/g) || []).length % 2 === 1;
            const hasOpenBacktick = (beforeHtml.match(/`/g) || []).length % 2 === 1;
            
            if (!hasOpenQuote && !hasOpenBacktick) {
              hasInvalidHTML = true;
              break;
            }
          }
        }
      }
      
      if (hasInvalidHTML) {
        console.log(`🚫 DEBUG: Invalid HTML content outside of strings/template literals detected`);
        return false;
      }
    }
    
    for (const pattern of criticalInvalidPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`🚫 DEBUG: Critical invalid JavaScript pattern detected: ${pattern.toString()}`);
        return false;
      }
    }
    
    // If it contains basic JavaScript indicators, it's probably valid
    const hasBasicJSIndicators = (
      /\bfunction\b|\basync\b|\bconst\b|\blet\b|\bvar\b|\breturn\b|\bif\b|\bfor\b|\bwhile\b/.test(trimmed) ||
      /^\/\/|^\/\*/m.test(trimmed) ||  // Comments
      /require\(|import\s+/m.test(trimmed)  // Module imports
    );
    
    if (hasBasicJSIndicators) {
      console.log(`✅ DEBUG: Valid JavaScript detected (has JS indicators)`);
      return true;
    }
    
    // For edge cases, be more permissive unless we're certain it's invalid
    console.log(`🔍 DEBUG: Uncertain content, allowing compilation attempt`);
    return true;
  }
}

export default FileParser;