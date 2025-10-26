/**
 * Simple JavaScript Executor for PureMix Templates
 * 
 * Direct execution of JavaScript blocks using Node.js closure isolation
 * Focus: Execute code, capture __export results, return data
 */

export interface JavaScriptResult {
  exports: Record<string, any>;
  error?: Error;
}

export class JavaScriptExecutor {
  /**
   * Execute JavaScript code in isolated closure and return exported variables
   */
  static execute(code: string, data: Record<string, any>): JavaScriptResult {
    try {
      // Create isolated execution context using Function constructor
      // This creates a new scope with template data available as variables
      let __export: Record<string, any> | undefined = undefined;
      
      // Build parameter names and values from data
      const paramNames = Object.keys(data);
      const paramValues = Object.values(data);
      
      // Add standard JavaScript environment and export mechanism
      paramNames.push('__export', 'console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp');
      paramValues.push(__export, console, Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp);
      
      // Create and execute function in isolated scope
      // This prevents access to outer scope while providing template data
      const executionFunction = new Function(...paramNames, code);
      const result = executionFunction(...paramValues);
      
      // Check if __export was modified by accessing it from the closure
      // We need to capture __export assignments during execution
      const captureExportFunction = new Function(...paramNames, `
        ${code}
        return __export;
      `);
      
      const exports = captureExportFunction(...paramValues) || {};
      
      return { exports };
      
    } catch (error) {
      return { 
        exports: {}, 
        error: error as Error 
      };
    }
  }
}