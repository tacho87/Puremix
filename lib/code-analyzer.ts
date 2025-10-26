/**
 * CodeAnalyzer - Intelligent Code Structure Analysis Engine
 *
 * PURPOSE: Automatically analyze PureMix projects to generate LLM-friendly documentation
 * APPROACH: Pure static code analysis - NO LLM required
 *
 * DETECTS:
 * - All routes (pages + API endpoints) with URL mapping
 * - Authentication patterns (sessions, cookies, JWT)
 * - Component relationships and dependencies
 * - Server functions (loaders, actions, Python)
 * - Python module integration
 * - Data flow patterns
 *
 * OUTPUT: Structured data ready for documentation generation
 */

import fs from 'fs';
import path from 'path';
import FileParser from './file-parser.ts';
import ImportResolver from './import-resolver.ts';

export interface RouteInfo {
  url: string;
  file: string;
  type: 'page' | 'api';
  method?: string[];
  loader?: string;
  loaderUsesActionResult?: boolean;
  actions: string[];
  components: string[];
  auth: {
    type: 'none' | 'session' | 'jwt' | 'cookie' | 'hybrid';
    detected: string[];
  };
  pythonFunctions: string[];
  language: 'puremix' | 'javascript' | 'typescript' | 'python';
}

export interface ComponentInfo {
  name: string;
  file: string;
  props: string[];
  actions: string[];
  usedBy: string[];
  dependencies: string[];
}

export interface PythonModuleInfo {
  file: string;
  functions: string[];
  usedIn: string[];
}

export interface AuthenticationInfo {
  type: 'none' | 'session' | 'jwt' | 'cookie' | 'hybrid';
  sessionUsage: string[];
  cookieUsage: string[];
  jwtUsage: string[];
  protectedRoutes: string[];
}

export interface AnalysisResult {
  projectName: string;
  timestamp: string;
  routes: RouteInfo[];
  components: Record<string, ComponentInfo>;
  pythonModules: Record<string, PythonModuleInfo>;
  authentication: AuthenticationInfo;
  stats: {
    totalRoutes: number;
    pageRoutes: number;
    apiRoutes: number;
    components: number;
    pythonModules: number;
    pythonFunctions: number;
  };
}

/**
 * CodeAnalyzer - Main analysis engine
 */
export class CodeAnalyzer {
  private appDir: string;
  private fileParser: FileParser;
  private importResolver: ImportResolver;

  constructor(appDir: string) {
    this.appDir = path.resolve(appDir);
    this.importResolver = new ImportResolver(this.appDir);
    this.fileParser = new FileParser(this.importResolver);
  }

  /**
   * Analyze entire project and return structured data
   */
  async analyze(): Promise<AnalysisResult> {
    const projectName = this.detectProjectName();

    console.log('🔍 Analyzing project structure...');

    const routes = await this.analyzeRoutes();
    const components = await this.analyzeComponents();
    const pythonModules = await this.analyzePythonModules();
    const authentication = this.analyzeAuthentication(routes);

    const stats = {
      totalRoutes: routes.length,
      pageRoutes: routes.filter(r => r.type === 'page').length,
      apiRoutes: routes.filter(r => r.type === 'api').length,
      components: Object.keys(components).length,
      pythonModules: Object.keys(pythonModules).length,
      pythonFunctions: Object.values(pythonModules).reduce((sum, mod) => sum + mod.functions.length, 0)
    };

    console.log(`✅ Analysis complete: ${stats.totalRoutes} routes, ${stats.components} components, ${stats.pythonModules} Python modules`);

    return {
      projectName,
      timestamp: new Date().toISOString(),
      routes,
      components,
      pythonModules,
      authentication,
      stats
    };
  }

  /**
   * Detect project name from package.json
   */
  private detectProjectName(): string {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return pkg.name || 'PureMix Project';
      }
    } catch (error) {
      // Ignore
    }
    return 'PureMix Project';
  }

  /**
   * Analyze all routes (pages + API)
   */
  private async analyzeRoutes(): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    const routesDir = path.join(this.appDir, 'routes');

    if (!fs.existsSync(routesDir)) {
      return routes;
    }

    await this.scanRoutesDirectory(routesDir, '', routes);

    return routes.sort((a, b) => a.url.localeCompare(b.url));
  }

  /**
   * Recursively scan routes directory
   */
  private async scanRoutesDirectory(dir: string, urlPath: string, routes: RouteInfo[]): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        await this.scanRoutesDirectory(fullPath, path.join(urlPath, entry.name), routes);
      } else {
        const ext = path.extname(entry.name);
        const baseName = path.basename(entry.name, ext);

        // Skip non-route files
        if (!['.puremix', '.js', '.ts', '.py'].includes(ext)) {
          continue;
        }

        const url = this.getRouteUrl(urlPath, baseName);
        const routeInfo = await this.analyzeRouteFile(fullPath, url, ext);

        if (routeInfo) {
          routes.push(routeInfo);
        }
      }
    }
  }

  /**
   * Convert file path to URL route
   */
  private getRouteUrl(urlPath: string, baseName: string): string {
    let url = '/';

    if (urlPath) {
      url += urlPath + '/';
    }

    if (baseName === 'index') {
      // index.puremix -> /
      return url === '//' ? '/' : url.slice(0, -1);
    }

    // Handle dynamic routes
    if (baseName.startsWith('[') && baseName.endsWith(']')) {
      const param = baseName.slice(1, -1);
      if (param.startsWith('...')) {
        // Catch-all: [...slug] -> /*
        return url + '*';
      } else {
        // Parameter: [id] -> /:id
        return url + ':' + param;
      }
    }

    return url + baseName;
  }

  /**
   * Analyze a single route file
   */
  private async analyzeRouteFile(filePath: string, url: string, ext: string): Promise<RouteInfo | null> {
    const relativePath = path.relative(this.appDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    if (ext === '.puremix') {
      return await this.analyzePuremixRoute(content, url, relativePath);
    } else {
      return this.analyzeApiRoute(content, url, relativePath, ext);
    }
  }

  /**
   * Analyze .puremix route file
   */
  private async analyzePuremixRoute(content: string, url: string, relativePath: string): Promise<RouteInfo> {
    let parsed: any;

    try {
      parsed = await this.fileParser.parse(content, relativePath);
    } catch (error: any) {
      // If parsing fails, try to extract basic info manually
      console.warn(`⚠️  Failed to fully parse ${relativePath}: ${error.message}`);
      parsed = {
        loaders: {},
        serverFunctions: {},
        componentImports: {},
        pythonFunctions: {}
      };

      // Try manual extraction
      try {
        // Extract component names from imports
        const importMatch = content.match(/<imports>([\s\S]*?)<\/imports>/);
        if (importMatch) {
          const imports = importMatch[1];
          const componentMatches = imports.matchAll(/import\s+(\w+)\s+from/g);
          for (const match of componentMatches) {
            parsed.componentImports[match[1]] = true;
          }
        }

        // Extract server functions
        const serverScriptMatch = content.match(/<script\s+server>([\s\S]*?)<\/script>/);
        if (serverScriptMatch) {
          const functions = serverScriptMatch[1].matchAll(/(?:async\s+)?function\s+(\w+)/g);
          for (const match of functions) {
            parsed.serverFunctions[match[1]] = true;
          }
        }
      } catch (manualError) {
        // Ignore manual extraction errors
      }
    }

    const loaderNames = Object.keys(parsed.loaders || {});
    const actionNames = Object.keys(parsed.serverFunctions || {});
    const componentNames = Object.keys(parsed.componentImports || {});
    const pythonFunctions = Object.keys(parsed.pythonFunctions || {});

    const auth = this.detectAuthPatterns(content);

    // Detect if loader uses actionResult parameter
    let loaderUsesActionResult = false;
    if (loaderNames[0]) {
      loaderUsesActionResult = this.detectActionResultUsage(content, loaderNames[0]);
    }

    return {
      url,
      file: relativePath,
      type: 'page',
      loader: loaderNames[0],
      loaderUsesActionResult,
      actions: actionNames,
      components: componentNames,
      auth,
      pythonFunctions,
      language: 'puremix'
    };
  }

  /**
   * Analyze API route file (.js, .ts, .py)
   */
  private analyzeApiRoute(content: string, url: string, relativePath: string, ext: string): RouteInfo {
    const methods = this.detectHttpMethods(content);
    const auth = this.detectAuthPatterns(content);

    let language: 'javascript' | 'typescript' | 'python';
    if (ext === '.ts') language = 'typescript';
    else if (ext === '.py') language = 'python';
    else language = 'javascript';

    return {
      url,
      file: relativePath,
      type: 'api',
      method: methods,
      actions: ['handler'],
      components: [],
      auth,
      pythonFunctions: [],
      language
    };
  }

  /**
   * Detect HTTP methods used in API route
   */
  private detectHttpMethods(content: string): string[] {
    const methods: string[] = [];
    const methodPatterns = [
      /request\.method\s*===\s*['"]GET['"]/g,
      /request\.method\s*===\s*['"]POST['"]/g,
      /request\.method\s*===\s*['"]PUT['"]/g,
      /request\.method\s*===\s*['"]PATCH['"]/g,
      /request\.method\s*===\s*['"]DELETE['"]/g,
    ];

    const methodNames = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    methodPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        methods.push(methodNames[index]);
      }
    });

    return methods.length > 0 ? methods : ['GET', 'POST']; // Default assumption
  }

  /**
   * Detect authentication patterns in code
   */
  private detectAuthPatterns(content: string): RouteInfo['auth'] {
    const patterns = {
      session: /request\.session/g,
      cookie: /response\.cookie|res\.cookie/g,
      jwt: /jwt|token|bearer|authorization/gi,
    };

    const detected: string[] = [];

    if (patterns.session.test(content)) {
      detected.push('session');
    }
    if (patterns.cookie.test(content)) {
      detected.push('cookie');
    }
    if (patterns.jwt.test(content)) {
      detected.push('jwt');
    }

    let type: RouteInfo['auth']['type'] = 'none';
    if (detected.length === 0) {
      type = 'none';
    } else if (detected.includes('session') && (detected.includes('cookie') || detected.includes('jwt'))) {
      type = 'hybrid';
    } else if (detected.includes('session')) {
      type = 'session';
    } else if (detected.includes('jwt')) {
      type = 'jwt';
    } else if (detected.includes('cookie')) {
      type = 'cookie';
    }

    return { type, detected };
  }

  /**
   * Detect if a loader function uses actionResult parameter
   */
  private detectActionResultUsage(content: string, loaderName: string): boolean {
    // Try to find the loader function and check its parameters
    const functionPattern = new RegExp(
      `(?:async\\s+)?function\\s+${loaderName}\\s*\\(([^)]*)\\)`,
      'i'
    );

    const match = content.match(functionPattern);
    if (match && match[1]) {
      const params = match[1].split(',').map(p => p.trim());

      // Check if there's a second parameter (first is request, second is actionResult)
      if (params.length >= 2) {
        return true;
      }

      // Also check if any parameter is explicitly named actionResult
      if (params.some(p => p.includes('actionResult'))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze all components
   */
  private async analyzeComponents(): Promise<Record<string, ComponentInfo>> {
    const components: Record<string, ComponentInfo> = {};
    const componentsDir = path.join(this.appDir, 'components');

    if (!fs.existsSync(componentsDir)) {
      return components;
    }

    const files = fs.readdirSync(componentsDir);

    for (const file of files) {
      if (!file.endsWith('.puremix')) continue;

      const filePath = path.join(componentsDir, file);
      const componentName = path.basename(file, '.puremix');
      const componentInfo = await this.analyzeComponent(filePath, componentName);

      if (componentInfo) {
        components[componentName] = componentInfo;
      }
    }

    return components;
  }

  /**
   * Analyze a single component
   */
  private async analyzeComponent(filePath: string, name: string): Promise<ComponentInfo> {
    const content = fs.readFileSync(filePath, 'utf8');
    let parsed: any;

    try {
      parsed = await this.fileParser.parse(content, filePath);
    } catch (error: any) {
      // If parsing fails, try manual extraction
      console.warn(`⚠️  Failed to fully parse component ${name}: ${error.message}`);
      parsed = {
        serverFunctions: {},
        componentImports: {}
      };

      // Manual extraction of server functions
      try {
        const serverScriptMatch = content.match(/<script\s+server>([\s\S]*?)<\/script>/);
        if (serverScriptMatch) {
          const functions = serverScriptMatch[1].matchAll(/(?:async\s+)?function\s+(\w+)/g);
          for (const match of functions) {
            parsed.serverFunctions[match[1]] = true;
          }
        }
      } catch (manualError) {
        // Ignore manual extraction errors
      }
    }

    const actions = Object.keys(parsed.serverFunctions || {});
    const dependencies = Object.keys(parsed.componentImports || {});

    // Detect props by looking for {prop} usage in template
    const props = this.detectComponentProps(content);

    return {
      name,
      file: path.relative(this.appDir, filePath),
      props,
      actions,
      usedBy: [], // Will be filled by cross-referencing routes
      dependencies
    };
  }

  /**
   * Detect component props from template usage
   */
  private detectComponentProps(content: string): string[] {
    const props: Set<string> = new Set();

    // Find {propName} patterns that aren't loader data
    const propPattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = propPattern.exec(content)) !== null) {
      const propName = match[1];
      // Exclude known non-props
      if (!propName.startsWith('load') && propName !== 'data' && propName !== 'state') {
        props.add(propName);
      }
    }

    return Array.from(props);
  }

  /**
   * Analyze Python modules
   */
  private async analyzePythonModules(): Promise<Record<string, PythonModuleInfo>> {
    const modules: Record<string, PythonModuleInfo> = {};

    // Scan common Python directories
    const pythonDirs = ['services', 'lib', 'controllers'];

    for (const dir of pythonDirs) {
      const fullPath = path.join(this.appDir, dir);
      if (fs.existsSync(fullPath)) {
        await this.scanPythonDirectory(fullPath, modules);
      }
    }

    return modules;
  }

  /**
   * Recursively scan for Python files
   */
  private async scanPythonDirectory(dir: string, modules: Record<string, PythonModuleInfo>): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanPythonDirectory(fullPath, modules);
      } else if (entry.name.endsWith('.py')) {
        const moduleName = path.basename(entry.name, '.py');
        const moduleInfo = await this.analyzePythonModule(fullPath, moduleName);

        if (moduleInfo && moduleInfo.functions.length > 0) {
          modules[moduleName] = moduleInfo;
        }
      }
    }
  }

  /**
   * Analyze a Python module
   */
  private async analyzePythonModule(filePath: string, _name: string): Promise<PythonModuleInfo | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const functions = this.extractPythonFunctions(content);

      return {
        file: path.relative(this.appDir, filePath),
        functions,
        usedIn: [] // Will be filled by cross-referencing routes
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract function names from Python code
   */
  private extractPythonFunctions(content: string): string[] {
    const functions: string[] = [];
    const functionPattern = /^def\s+(\w+)\s*\(/gm;
    let match: RegExpExecArray | null;

    while ((match = functionPattern.exec(content)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  /**
   * Analyze authentication across the project
   */
  private analyzeAuthentication(routes: RouteInfo[]): AuthenticationInfo {
    const sessionUsage: string[] = [];
    const cookieUsage: string[] = [];
    const jwtUsage: string[] = [];
    const protectedRoutes: string[] = [];

    routes.forEach(route => {
      if (route.auth.type !== 'none') {
        protectedRoutes.push(route.url);
      }

      if (route.auth.detected.includes('session')) {
        sessionUsage.push(route.file);
      }
      if (route.auth.detected.includes('cookie')) {
        cookieUsage.push(route.file);
      }
      if (route.auth.detected.includes('jwt')) {
        jwtUsage.push(route.file);
      }
    });

    let type: AuthenticationInfo['type'] = 'none';
    if (sessionUsage.length > 0 && jwtUsage.length > 0) {
      type = 'hybrid';
    } else if (sessionUsage.length > 0) {
      type = 'session';
    } else if (jwtUsage.length > 0) {
      type = 'jwt';
    } else if (cookieUsage.length > 0) {
      type = 'cookie';
    }

    return {
      type,
      sessionUsage,
      cookieUsage,
      jwtUsage,
      protectedRoutes
    };
  }
}

export default CodeAnalyzer;
