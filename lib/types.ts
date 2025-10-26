/**
 * Types Definition - Framework TypeScript Interfaces & Type System
 * 
 * PURPOSE: Provides comprehensive TypeScript type definitions for the entire PureMix framework
 * ARCHITECTURE: Interface definitions → Type safety → IntelliSense support → Runtime validation
 * 
 * TYPE CATEGORIES:
 * 1. Core Framework Types: LoaderResult, ParsedFile, ComponentInfo
 * 2. Request/Response Extensions: PureMixRequest with Python/debugging context
 * 3. Configuration Types: EngineConfig, VerboseDebugConfig, PythonConfig
 * 4. Action/Loader Types: FunctionInfo, ActionResult, LoaderResults
 * 5. Component System Types: ComponentRenderResult, ComponentInfo
 * 6. Python Integration Types: PythonResult, PythonContext
 * 
 * DEPENDENCIES:
 * - Express.js types for HTTP request/response
 * - express-session for session type extensions
 * - Built-in TypeScript utility types
 * 
 * TYPE SAFETY FEATURES:
 * - Strict typing for all framework components
 * - Optional vs required property definitions
 * - Generic types for flexible component system
 * - Runtime type validation support
 * - IntelliSense/autocomplete enhancement
 */

// PureMix Framework Type Definitions

import * as express from 'express';
type Request = express.Request;
type Response = express.Response;

// Extended Express types
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    user?: any;
  }
}

// Core Interfaces
export interface LoaderResult {
  data: Record<string, any>;
  state?: Record<string, any>;  // Optional - for UI state like messages, errors, form visibility
  loading?: boolean;  // Optional - defaults to false
  error?: string;
  redirect?: string;
}

export interface FunctionInfo {
  name: string;
  function: Function;
  originalCode: string;
  language?: string;
}

export interface LoaderResults {
  results: Record<string, LoaderResult>;
  [key: string]: any;
}

export interface TemplateContext {
  results?: Record<string, any>;
  [key: string]: any;
}

export interface ParsedFile {
  layout: string | undefined;
  head: string | undefined;
  loading: string | undefined;
  html: string;
  imports: string[];
  componentImports: Record<string, string>; // component name -> file path
  pythonImports: Record<string, string>; // function name -> python file path
  loaders: Record<string, FunctionInfo>;
  serverFunctions: Record<string, FunctionInfo>;
  clientScripts: string[];
  pythonFunctions: Record<string, string>;
}

export interface ComponentInfo {
  path: string;
  parsed: ParsedFile;
  name: string;
}

export interface ComponentInstance {
  id: string;
  name: string;
  props: any;
  loaderResults: LoaderResults;
  lastRendered: string;
  parentRoute: string;
  serverFunctions: string[];
}

export interface ComponentRenderResult {
  html: string;
  serverFunctions: Record<string, Function>;
  loaderResults?: LoaderResults;  // FIXED: Add optional loaderResults for component registration
}

export interface PureMixRequest {
  req: Request;
  res: Response;
  user?: any;
  session?: any;
  cookies?: any;
  query?: Record<string, any>;
  params?: Record<string, string>;
  body?: any;
  files?: Record<string, any>; // Uploaded files from multipart forms
  method?: string;
  url?: string;
  env?: any;
  python?: PythonInterface;
  redirect?: (url: string) => any;
  json?: (data: any) => any;
  error?: (message: string) => any;
  success?: (message: string, data?: any) => any;
}

export interface PureMixResponse extends Response {
  locals: {
    csrfToken?: string;
    [key: string]: any;
  };
}

export interface RequestContext {
  req: PureMixRequest;
  res: PureMixResponse;
  user?: any;
  session?: any;
  params: Record<string, string>;
  query: Record<string, any>;
  body: Record<string, any>;
  python: PythonInterface;
}

// Engine Configuration
export interface PureMixConfig {
  port?: number;
  host?: string;
  appDir?: string;
  isDev?: boolean;
  hotReload?: boolean;
  pythonTimeout?: number;
  showDebugInProduction?: boolean; // New: Allow debug box in production
  session?: {
    secret: string;
    maxAge?: number;
    secure?: boolean;
  };
}

// Python Executor Interfaces
export interface PythonExecutorConfig {
  pythonTimeout?: number;
  pythonCommand?: string;
  tempDir?: string;
}

export interface PythonInterface {
  call: (functionName: string, data: any, code?: string) => Promise<any>;
  executeFunction: (functionName: string, data: any, code: string) => Promise<any>;
  executeFile: (filePath: string, functionName: string, data: any, jsContext?: any) => Promise<any>;
  executeScript: (scriptPath: string, args?: any) => Promise<any>;
  isAvailable: () => boolean;
  getPythonVersion: () => Promise<string | null>;
  installPackage: (packageName: string) => Promise<boolean>;
  numpy: {
    array: (data: any) => Promise<any>;
    operation: (expression: string, arrays: any) => Promise<any>;
  };
  pandas: {
    readCsv: (filepath: string) => Promise<any>;
    dataFrame: (data: any, operations?: any) => Promise<any>;
  };
  sklearn: {
    trainModel: (modelType: string, X: any, y: any) => Promise<any>;
  };
}

// Template Engine Interfaces
export interface HelperFunctions {
  formatDate: (date: any, format?: string) => string;
  uppercase: (str: any) => string;
  lowercase: (str: any) => string;
  capitalize: (str: any) => string;
  formatNumber: (num: any, decimals?: number) => string;
  formatCurrency: (amount: any, currency?: string) => string;
  length: (arr: any) => number;
  keys: (obj: any) => string[];
  values: (obj: any) => any[];
  join: (arr: any, separator?: string) => string;
  slice: (arr: any, start: any, end: any) => any[];
}

// Import Resolver Interfaces
export interface ImportResolver {
  resolveImports: (imports: string[]) => Promise<Record<string, any>>;
  resolveLocalImport: (importPath: string, currentDir: string) => Promise<any>;
  resolveNodeModule: (moduleName: string) => Promise<any>;
  clearCache: () => void;
}

// File Parser Interfaces
export interface FileParser {
  parse: (content: string, filePath: string) => Promise<ParsedFile>;
  extractLayout: (content: string) => string | null;
  extractHead: (content: string) => string | null;
  extractLoading: (content: string) => string | null;
  extractImports: (content: string) => string[];
  extractLoaders: (content: string, filePath: string) => Promise<Record<string, Function>>;
  extractServerFunctions: (content: string, filePath: string) => Promise<Record<string, Function>>;
  extractClientScripts: (content: string) => string[];
  extractPythonFunctions: (content: string) => Record<string, string>;
  cleanHtml: (content: string) => string;
}

// Action Result Types
export interface ActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  redirect?: string;
  reload?: boolean;
  data?: any;
}

// Route Types
export interface RouteInfo {
  pattern: string;
  filePath: string;
  isDynamic: boolean;
  isCatchAll: boolean;
  paramNames: string[];
}

// Client Runtime Types
export interface ClientRuntime {
  call: (functionName: string, data: any) => Promise<any>;
  reload: () => void;
  redirect: (url: string) => void;
  storage: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
    clear: () => void;
  };
  session: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
  };
  cookies: {
    get: (name: string) => string | null;
    set: (name: string, value: string, options?: any) => void;
    remove: (name: string) => void;
  };
}

// Framework Class Interfaces
export interface PureMixEngine {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  scanRoutes: () => Promise<void>;
  handlePageRequest: (route: string, req: PureMixRequest, res: PureMixResponse) => Promise<void>;
  createRequestContext: (req: PureMixRequest, res: PureMixResponse) => RequestContext;
}

export interface TemplateEngine {
  process: (html: string, loaderResults: LoaderResults) => string;
  registerHelper: (name: string, fn: Function) => void;
  clearCache: () => void;
  getCacheStats: () => { size: number; keys: string[] };
}

// Export commonly used types
export type { Request as ExpressRequest, Response as ExpressResponse };

// Runtime exports to help with Node.js module resolution
export const __types = {
  LoaderResult: null as any,
  LoaderResults: null as any, 
  TemplateContext: null as any,
  ParsedFile: null as any,
  PureMixRequest: null as any,
  PureMixResponse: null as any,
  RequestContext: null as any,
  PureMixConfig: null as any,
  PythonExecutorConfig: null as any,
  PythonInterface: null as any,
  ActionResult: null as any
};