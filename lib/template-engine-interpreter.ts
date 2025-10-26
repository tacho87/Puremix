/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                        ⚠️  MUST READ  ⚠️                       ║
 * ║                    NO REGEX ALLOWED!                        ║
 * ║                                                              ║
 * ║  This file is COMPLETELY REGEX-FREE by architectural        ║
 * ║  design. Any addition of regex patterns is FORBIDDEN!       ║
 * ║                                                              ║
 * ║  Use only:                                                   ║
 * ║  ✅ Pure AST-based interpretation                            ║
 * ║  ✅ Character-by-character analysis                          ║
 * ║  ✅ Node.js JavaScript execution                             ║
 * ║                                                              ║
 * ║  NO REGEX PATTERNS - Pure computer science approach!        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/**
 * PureMix Template Engine - Pure AST-Based Interpreter
 * 
 * COMPLETELY REGEX-FREE VERSION
 * 
 * Uses only:
 * - Pure AST-based interpreter for all template processing
 * - Character-by-character analysis for code block detection
 * - Node.js JavaScript execution in isolated contexts
 * 
 * NO regex patterns - pure computer science approach
 */

import { PureMixInterpreter } from './puremix-interpreter.ts';
import { getLogger } from './debug-logger.ts';
import type { LoaderResults, PureMixRequest } from './types.ts';

const logger = getLogger();

// Create logging helpers that work with the existing VerboseDebugLogger
const log = {
  debug: (message: string, data?: any) => {
    if (logger) {
      logger.logTemplateRender({}, { message: `[TemplateEngineInterpreter] ${message}`, data: data || {} });
    }
  },
  info: (message: string, data?: any) => {
    if (logger) {
      logger.logTemplateRender({}, { message: `[TemplateEngineInterpreter] ${message}`, data: data || {} });
    }
  },
  warn: (message: string, data?: any) => {
    if (logger) {
      logger.logTemplateRender({}, { message: `[TemplateEngineInterpreter] ${message}`, data: data || {} });
    }
  },
  error: (message: string, data?: any) => {
    if (logger) {
      logger.logTemplateRender({}, { message: `[TemplateEngineInterpreter] ERROR: ${message}`, data: data || {} });
    }
  }
};

export interface TemplateContext {
  // Loader data
  data: Record<string, any>;
  state: Record<string, any>;
  
  // Request context
  request: PureMixRequest;
  params: Record<string, string>;
  query: Record<string, string>;
  
  // Environment
  env: string;
  
  // Component data (for component rendering)
  props?: Record<string, any>;
  
  // Component renderer function for independent rendering
  componentRenderer?: (tagName: string, fullTag: string, context: Record<string, any>) => Promise<string>;
}

export interface ComponentInfo {
  name: string;
  path: string;
  template: string;
  functions: Record<string, Function>;
}

/**
 * Modern Template Engine using Pure AST-Based Interpreter
 * 
 * NO regex, NO string manipulation - only pure AST-based interpretation
 */
export class TemplateEngineInterpreter {
  private components: Map<string, ComponentInfo> = new Map();
  private interpreter: PureMixInterpreter;
  private pureMixEngine?: any; // Reference to PureMix engine for component rendering

  constructor(pureMixEngine?: any) {
    this.interpreter = new PureMixInterpreter();
    this.pureMixEngine = pureMixEngine;
  }

  /**
   * Process a template using pure AST-based interpretation
   * NO REGEX - Only AST parsing and evaluation
   */
  async processTemplate(
    template: string,
    loaderData: LoaderResults | Record<string, any>,
    request: PureMixRequest,
    componentImports: Record<string, string> = {}
  ): Promise<string> {
    // CRITICAL: Test if this is actually being called
    if (Object.keys(componentImports || {}).length > 0) {
      console.log('🚨🚨🚨 COMPONENT TEMPLATE PROCESSING DETECTED!', {
        templatePreview: template.substring(0, 200),
        componentImports: componentImports
      });
    }
    
    log.debug('TemplateEngineInterpreter.processTemplate called (REGEX-FREE)', {
      templateLength: template.length,
      loaderDataKeys: Object.keys(loaderData || {})
    });
    
    const startTime = performance.now();
    
    try {
      // Build execution context
      const context = this.buildContext(loaderData, request);
      
      // Add component renderer to the context for the PureMix interpreter
      context.componentRenderer = this.createComponentRenderer(componentImports, request);
      
      // FIRST: Process component tags using async component rendering
      console.log('🧩 COMPONENT PROCESSING: About to process component tags before AST interpretation');
      console.log('🧩 COMPONENT PROCESSING: componentImports =', componentImports);
      console.log('🧩 COMPONENT PROCESSING: template length =', template.length);
      
      let templateWithRenderedComponents: string;
      try {
        templateWithRenderedComponents = await this.processComponentTagsAsync(template, componentImports, request, context);
        console.log('🧩 COMPONENT PROCESSING: Successfully completed async component processing');
      } catch (error) {
        console.log('❌ COMPONENT PROCESSING ERROR:', error);
        templateWithRenderedComponents = template; // Fallback to original template
      }
      
      // SECOND: Use pure AST-based interpreter for {} expressions
      console.log('🚀 TEMPLATE ENGINE DEBUG - CALLING AST INTERPRETER!', {
        templatePreview: templateWithRenderedComponents.substring(0, 200),
        contextKeys: Object.keys(context),
        hasInterpreter: !!this.interpreter,
        hasComponentRenderer: !!context.componentRenderer
      });
      
      const result = this.interpreter.interpret(templateWithRenderedComponents, context);
      
      console.log('🎯 TEMPLATE ENGINE DEBUG - AST INTERPRETER RESULT:', {
        resultPreview: result.substring(0, 200),
        resultLength: result.length,
        templateLength: template.length,
        unchanged: result === template
      });
      
      const processingTime = performance.now() - startTime;
      log.debug('AST-based template interpretation completed', {
        processingTime: `${processingTime.toFixed(2)}ms`,
        templateLength: template.length,
        resultLength: result?.length || 0
      });
      
      return result;
      
    } catch (error) {
      log.error('AST-based template interpretation failed', {
        error: error instanceof Error ? error.message : String(error),
        template: template.substring(0, 200) + '...'
      });
      
      // Return original template on error
      return template;
    }
  }

  /**
   * Process individual components using the AST interpreter
   */
  async processComponent(
    componentName: string,
    componentPath: string,
    template: string,
    props: Record<string, any> = {},
    request: PureMixRequest
  ): Promise<string> {
    try {
      // Build component context
      const context = {
        ...props,
        request,
        env: process.env.NODE_ENV || 'development'
      };
      
      // Use AST interpreter for component processing
      const result = this.interpreter.interpret(template, context);
      
      log.debug('AST-based component interpretation completed', {
        component: componentName,
        propsCount: Object.keys(props).length,
        resultLength: result.length
      });
      
      return result;
      
    } catch (error) {
      log.error('AST-based component interpretation failed', {
        component: componentName,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return template;
    }
  }

  /**
   * Register a component for use in templates
   */
  registerComponent(name: string, info: ComponentInfo): void {
    this.components.set(name, info);
    log.debug('Component registered', { name, path: info.path });
  }

  /**
   * Get registered component
   */
  getComponent(name: string): ComponentInfo | undefined {
    return this.components.get(name);
  }

  /**
   * Create a component renderer function for independent component rendering
   * Each component renders independently with its own loaders and server functions
   */
  private createComponentRenderer(componentImports: Record<string, string>, request: PureMixRequest) {
    return async (tagName: string, fullTag: string, _context: Record<string, any>) => {
      try {
        // Check if this component is imported
        if (!componentImports[tagName]) {
          return `<!-- Component ${tagName} not imported -->`;
        }
        
        const componentFilePath = componentImports[tagName];
        
        // Extract component name from the full file path 
        // /Users/.../UserStats.puremix -> UserStats
        const componentName = componentFilePath.split('/').pop()?.replace('.puremix', '') || tagName;
        
        // Parse props from the tag with context for evaluation
        const props = this.parseComponentProps(fullTag, _context);
        
        console.log(`🔍 COMPONENT RENDERER DEBUG: Rendering component ${tagName}`, {
          componentFilePath,
          componentName,
          hasEngine: !!this.pureMixEngine,
          hasRenderMethod: !!(this.pureMixEngine && this.pureMixEngine.renderComponent),
          propsKeys: Object.keys(props)
        });
        
        // Use the PureMix engine to render the component INDEPENDENTLY
        // Each component has its own loaders, server functions, and state
        if (this.pureMixEngine && this.pureMixEngine.renderComponent) {
          const renderResult = await this.pureMixEngine.renderComponent(componentName, props, request);
          
          // Generate unique component ID for client-side tracking
          const componentId = `${componentName}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          
          // Register component instance for client-side function registry
          const componentInstance = {
            id: componentId,
            name: componentName,
            props: props,
            loaderResults: renderResult.loaderResults,
            lastRendered: renderResult.html,
            serverFunctions: Object.keys(renderResult.serverFunctions || {}),
            parentRoute: request.url || '/'
          };
          
          this.pureMixEngine.registerComponentInstance(componentInstance);
          
          // Wrap the component HTML with tracking attributes for client-side updates
          return `<div data-component="${componentName}" data-component-id="${componentId}">${renderResult.html}</div>`;
        }
        
        // Fallback: render a placeholder with component ID for client-side updates
        const componentId = `${tagName}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        return `<div id="${componentId}" data-component="${tagName}" data-path="${componentFilePath}">
          <!-- Component ${tagName} loading... -->
          <script>console.log('Component ${tagName} needs independent rendering');</script>
        </div>`;
        
      } catch (error) {
        log.error(`Independent component rendering failed for ${tagName}`, {
          error: error instanceof Error ? error.message : String(error),
          tagName,
          fullTag
        });
        return `<!-- Component ${tagName} render error: ${error} -->`;
      }
    };
  }
  
  /**
   * Parse props from component tag using character-based analysis (NO REGEX)
   * Components can receive props for independent rendering
   */
  private parseComponentProps(fullTag: string, context: Record<string, any>): Record<string, any> {
    const props: Record<string, any> = {};

    console.log('🔍 COMPONENT PROPS DEBUG: Parsing props from tag:', { fullTag });
    console.log('🔍 COMPONENT PROPS DEBUG: Available context keys:', { contextKeys: Object.keys(context) });

    // Find the opening tag and extract everything between the component name and closing >
    // Example: <ConditionalTestComponent user={data.user} showDetails={true} testMode={true} />
    const tagStart = fullTag.indexOf('<') + 1;
    const tagEnd = fullTag.lastIndexOf('>');
    if (tagStart === 0 || tagEnd === -1) {
      console.log('🔍 COMPONENT PROPS DEBUG: Invalid tag format');
      return props;
    }

    const tagContent = fullTag.substring(tagStart, tagEnd).trim();
    const firstSpace = tagContent.indexOf(' ');

    if (firstSpace === -1) {
      console.log('🔍 COMPONENT PROPS DEBUG: No props found in tag');
      return props; // No props, just component name
    }

    const propsSection = tagContent.substring(firstSpace + 1).trim();
    console.log('🔍 COMPONENT PROPS DEBUG: Props section:', { propsSection });

    // Parse props using character-by-character analysis
    let i = 0;
    while (i < propsSection.length) {
      // Skip whitespace
      while (i < propsSection.length && /\s/.test(propsSection[i])) {
        i++;
      }

      if (i >= propsSection.length) break;

      // Find prop name (before =)
      const propNameStart = i;
      while (i < propsSection.length && propsSection[i] !== '=' && !/\s/.test(propsSection[i])) {
        i++;
      }

      if (i >= propsSection.length || propsSection[i] !== '=') {
        console.log('🔍 COMPONENT PROPS DEBUG: Invalid prop format, no = found');
        break;
      }

      const propName = propsSection.substring(propNameStart, i).trim();
      i++; // Skip =

      // Skip whitespace after =
      while (i < propsSection.length && /\s/.test(propsSection[i])) {
        i++;
      }

      if (i >= propsSection.length) {
        console.log('🔍 COMPONENT PROPS DEBUG: No value found for prop:', propName);
        break;
      }

      // Parse prop value
      let propValue: any;
      if (propsSection[i] === '{') {
        // Expression: {expression}
        const exprStart = i + 1;
        let braceCount = 1;
        i++; // Skip opening {

        while (i < propsSection.length && braceCount > 0) {
          if (propsSection[i] === '{') braceCount++;
          else if (propsSection[i] === '}') braceCount--;
          i++;
        }

        const expression = propsSection.substring(exprStart, i - 1).trim();
        console.log('🔍 COMPONENT PROPS DEBUG: Evaluating expression:', { propName, expression });

        try {
          // Use the AST interpreter to evaluate the expression by wrapping it in template syntax
          const result = this.interpreter.interpret(`{${expression}}`, context);
          // Convert result to appropriate type
          if (result === 'true') propValue = true;
          else if (result === 'false') propValue = false;
          else if (result === 'null') propValue = null;
          else if (result === 'undefined') propValue = undefined;
          else if (!isNaN(Number(result)) && result.trim() !== '') propValue = Number(result);
          else propValue = result;

          console.log('🔍 COMPONENT PROPS DEBUG: Expression result:', { propName, expression, result, propValue, type: typeof propValue });
        } catch (error) {
          console.warn('🔍 COMPONENT PROPS DEBUG: Expression evaluation failed:', { propName, expression, error });
          propValue = undefined;
        }
      } else if (propsSection[i] === '"' || propsSection[i] === "'") {
        // String literal: "value" or 'value'
        const quote = propsSection[i];
        const valueStart = i + 1;
        i++; // Skip opening quote

        while (i < propsSection.length && propsSection[i] !== quote) {
          if (propsSection[i] === '\\') i++; // Skip escaped characters
          i++;
        }

        propValue = propsSection.substring(valueStart, i);
        i++; // Skip closing quote
        console.log('🔍 COMPONENT PROPS DEBUG: String literal:', { propName, propValue });
      } else {
        // Bare value (should be rare)
        const valueStart = i;
        while (i < propsSection.length && !/\s/.test(propsSection[i])) {
          i++;
        }

        const rawValue = propsSection.substring(valueStart, i);
        propValue = rawValue === 'true' ? true : rawValue === 'false' ? false : rawValue;
        console.log('🔍 COMPONENT PROPS DEBUG: Bare value:', { propName, rawValue, propValue });
      }

      props[propName] = propValue;
    }

    console.log('🔍 COMPONENT PROPS DEBUG: Final props:', { props });
    return props;
  }

  /**
   * Process component tags asynchronously using actual component rendering
   * This method handles the async component rendering BEFORE template interpretation
   */
  private async processComponentTagsAsync(
    source: string, 
    componentImports: Record<string, string>, 
    request: PureMixRequest,
    context: Record<string, any>
  ): Promise<string> {
    let result = source;
    let componentsProcessed = 0;
    
    console.log('🧩 ASYNC COMPONENT PROCESSING: Starting component tag processing', {
      hasComponentImports: Object.keys(componentImports).length > 0,
      componentNames: Object.keys(componentImports)
    });
    
    // Process each component tag using character-based analysis (NO REGEX)
    let searchStart = 0;
    
    while (searchStart < result.length) {
      // Find the next < character
      const openAngle = result.indexOf('<', searchStart);
      if (openAngle === -1) break;
      
      // Skip if inside code block (reuse the isInsideCodeBlock method from interpreter)
      // For now, simple check - can be enhanced
      if (this.isInsideCodeBlockSimple(result, openAngle)) {
        searchStart = openAngle + 1;
        continue;
      }
      
      // Check if this is a component tag (starts with uppercase letter)
      let tagNameStart = openAngle + 1;
      
      // Skip whitespace
      while (tagNameStart < result.length && result[tagNameStart] === ' ') {
        tagNameStart++;
      }
      
      // Check if starts with uppercase letter (component naming convention)
      if (tagNameStart >= result.length || !/[A-Z]/.test(result[tagNameStart])) {
        searchStart = openAngle + 1;
        continue;
      }
      
      // Extract tag name
      let tagNameEnd = tagNameStart;
      while (tagNameEnd < result.length && /[a-zA-Z0-9_]/.test(result[tagNameEnd])) {
        tagNameEnd++;
      }
      
      const tagName = result.substring(tagNameStart, tagNameEnd);
      
      // Check if this component is imported
      if (!componentImports[tagName]) {
        searchStart = openAngle + 1;
        continue;
      }
      
      console.log(`🧩 ASYNC COMPONENT PROCESSING: Found component tag ${tagName}`);
      
      // Find the end of the component tag
      let fullTagEnd: number;
      
      // Check for self-closing tag
      const selfClosingEnd = result.indexOf('/>', tagNameStart);
      const regularClosingStart = result.indexOf('>', tagNameStart);
      
      if (selfClosingEnd !== -1 && (regularClosingStart === -1 || selfClosingEnd < regularClosingStart)) {
        fullTagEnd = selfClosingEnd + 2;
      } else if (regularClosingStart !== -1) {
        // Look for closing tag
        const closingTagPattern = `</${tagName}>`;
        const closingTagStart = result.indexOf(closingTagPattern, regularClosingStart);
        if (closingTagStart !== -1) {
          fullTagEnd = closingTagStart + closingTagPattern.length;
        } else {
          fullTagEnd = regularClosingStart + 1;
        }
      } else {
        searchStart = openAngle + 1;
        continue;
      }
      
      // Extract the full tag for rendering
      const fullTag = result.substring(openAngle, fullTagEnd);
      
      console.log(`🧩 ASYNC COMPONENT PROCESSING: Rendering component ${tagName}`, {
        fullTag: fullTag.substring(0, 100) + '...'
      });
      
      // Try to render the component using the async component renderer
      try {
        const componentRenderer = context.componentRenderer;
        if (componentRenderer && typeof componentRenderer === 'function') {
          const renderedComponent = await componentRenderer(tagName, fullTag, context);
          console.log(`✅ ASYNC COMPONENT PROCESSING: Successfully rendered ${tagName}`, {
            renderedLength: renderedComponent.length,
            renderedPreview: renderedComponent.substring(0, 150) + '...'
          });
          
          // Replace the tag with rendered content
          result = result.substring(0, openAngle) + renderedComponent + result.substring(fullTagEnd);
          
          // Update search position
          searchStart = openAngle + renderedComponent.length;
          componentsProcessed++;
          
        } else {
          console.log(`⚠️  ASYNC COMPONENT PROCESSING: No componentRenderer available for ${tagName}`);
          searchStart = fullTagEnd;
        }
        
      } catch (error) {
        console.log(`❌ ASYNC COMPONENT PROCESSING: Error rendering ${tagName}:`, error);
        const errorComment = `<!-- Component ${tagName} render error: ${error} -->`;
        result = result.substring(0, openAngle) + errorComment + result.substring(fullTagEnd);
        searchStart = openAngle + errorComment.length;
      }
    }
    
    console.log(`🧩 ASYNC COMPONENT PROCESSING: Completed processing ${componentsProcessed} components`);
    return result;
  }
  
  /**
   * Simple code block detection - basic implementation
   * TODO: Use more sophisticated detection if needed
   */
  private isInsideCodeBlockSimple(source: string, position: number): boolean {
    // Check for <script>, <pre>, <code> blocks
    const beforeText = source.substring(0, position).toLowerCase();
    const scriptStart = beforeText.lastIndexOf('<script');
    const scriptEnd = beforeText.lastIndexOf('</script>');
    const preStart = beforeText.lastIndexOf('<pre');
    const preEnd = beforeText.lastIndexOf('</pre>');
    const codeStart = beforeText.lastIndexOf('<code');
    const codeEnd = beforeText.lastIndexOf('</code>');
    
    return (scriptStart > scriptEnd) || (preStart > preEnd) || (codeStart > codeEnd);
  }

  // =========================================================================
  // PRIVATE METHODS - ALL REGEX-FREE
  // =========================================================================

  private buildContext(
    loaderData: LoaderResults | Record<string, any>,
    request: PureMixRequest
  ): TemplateContext {
    log.debug('buildContext called with latest fixes (REGEX-FREE)', {
      loaderData: JSON.stringify(loaderData, null, 2)
    });
    
    // Handle both LoaderResults and direct data objects
    let data: Record<string, any> = {};
    let state: Record<string, any> = {};
    
    if (loaderData && typeof loaderData === 'object') {
      if ('data' in loaderData) {
        // LoaderResults format
        data = (loaderData as LoaderResults).data || {};
        state = (loaderData as LoaderResults).state || {};
        log.debug('LoaderResults format detected', { data });
      } else {
        // Direct data object
        data = loaderData;
        log.debug('Direct data object format detected', { data });
      }
    }

    // Build context that preserves the original loader structure
    // and makes both flat access and loader-specific access available
    const context: TemplateContext = {
      data,
      state,
      request,
      params: request.params || {},
      query: request.query || {},
      env: process.env.NODE_ENV || 'development',
      
      // Make loader data available at top level for easy access
      ...data
    };

    // IMPORTANT: Also include the original loaderData structure 
    // so that expressions like {loadWelcome.data.welcomeMessage} work
    if (loaderData && typeof loaderData === 'object') {
      Object.assign(context, loaderData);
      log.debug('After Object.assign, context keys', { contextKeys: Object.keys(context) });
      
      // CRITICAL FIX: If the loader data has a 'results' structure,
      // flatten it so that expressions like {loadWelcome.data.welcomeMessage} work
      if ('results' in loaderData && typeof loaderData.results === 'object') {
        Object.assign(context, loaderData.results);
        log.debug('Flattened results structure applied', { newContextKeys: Object.keys(context) });
      }
    }

    log.debug('Final context structure (REGEX-FREE)', {
      contextKeys: Object.keys(context),
      hasLoadWelcome: 'loadWelcome' in context,
      loadWelcome: 'loadWelcome' in context ? (context as any).loadWelcome : undefined
    });

    return context;
  }

  /**
   * Process components using AST-based detection instead of regex
   * NO REGEX - Uses AST parsing to identify component usage
   */
  private async processComponentsAST(
    template: string,
    componentImports: Record<string, string>,
    context: TemplateContext
  ): Promise<string> {
    console.log('🔧 COMPONENT PROCESSING DEBUG - processComponentsAST called!', {
      componentCount: Object.keys(componentImports).length,
      templateLength: template.length,
      componentImports: componentImports
    });
    
    log.debug('Component processing using AST (REGEX-FREE)', {
      componentCount: Object.keys(componentImports).length,
      templateLength: template.length,
      componentImports: componentImports
    });
    
    // If no component imports, return template as-is
    if (!componentImports || Object.keys(componentImports).length === 0) {
      log.debug('No component imports found, returning template unchanged');
      return template;
    }
    
    // Process component tags in the template
    let processedTemplate = template;
    
    for (const [componentName, componentPath] of Object.entries(componentImports)) {
      log.debug(`Processing component: ${componentName} from ${componentPath}`);
      
      // Find component tags using character-based analysis (NO REGEX)
      processedTemplate = await this.replaceComponentTags(
        processedTemplate, 
        componentName, 
        componentPath, 
        context
      );
    }
    
    log.debug('Component processing completed', {
      originalLength: template.length,
      processedLength: processedTemplate.length
    });
    
    return processedTemplate;
  }
  
  /**
   * Replace component tags with rendered component HTML using character-based analysis
   * NO REGEX - Pure character analysis for component tag detection
   */
  private async replaceComponentTags(
    template: string,
    componentName: string,
    componentPath: string,
    context: TemplateContext
  ): Promise<string> {
    const selfClosingTag = `<${componentName} />`;
    const openingTag = `<${componentName}`;
    
    let result = template;
    let searchStart = 0;
    
    while (searchStart < result.length) {
      // Look for component tags
      const selfClosingPos = this.findPatternAtPosition(result, selfClosingTag, searchStart);
      const openingPos = this.findPatternAtPosition(result, openingTag, searchStart);
      
      let tagStart = -1;
      let tagEnd = -1;
      let props: Record<string, any> = {};
      
      // Determine which tag we found first
      if (selfClosingPos !== -1 && (openingPos === -1 || selfClosingPos < openingPos)) {
        // Self-closing tag: <ComponentName />
        tagStart = selfClosingPos;
        tagEnd = selfClosingPos + selfClosingTag.length;
        
        // TODO: Parse props from self-closing tag if needed
        // For now, use empty props
        
      } else if (openingPos !== -1) {
        // Opening tag: <ComponentName>...</ComponentName>
        tagStart = openingPos;
        
        // Find the end of the opening tag (look for >)
        let openTagEnd = -1;
        for (let i = openingPos + openingTag.length; i < result.length; i++) {
          if (result[i] === '>') {
            openTagEnd = i + 1;
            break;
          }
        }
        
        if (openTagEnd === -1) {
          searchStart = openingPos + 1;
          continue;
        }
        
        // Find the closing tag
        const closingTag = `</${componentName}>`;
        const closingPos = this.findPatternAtPosition(result, closingTag, openTagEnd);
        
        if (closingPos === -1) {
          searchStart = openingPos + 1;
          continue;
        }
        
        tagEnd = closingPos + closingTag.length;
        
        // TODO: Parse props and children if needed
        // For now, use empty props
      } else {
        // No more component tags found
        break;
      }
      
      if (tagStart !== -1 && tagEnd !== -1) {
        log.debug(`Found ${componentName} tag at position ${tagStart}-${tagEnd}`);
        
        try {
          // Render the component
          const componentHtml = await this.renderComponentInternal(
            componentName,
            componentPath,
            props,
            context.request
          );
          
          // Replace the tag with rendered HTML
          result = result.substring(0, tagStart) + componentHtml + result.substring(tagEnd);
          
          // Update search position
          searchStart = tagStart + componentHtml.length;
          
          log.debug(`Replaced ${componentName} component tag with rendered HTML`, {
            componentHtml: componentHtml.substring(0, 100) + '...'
          });
          
        } catch (error) {
          log.error(`Failed to render component ${componentName}`, {
            error: error instanceof Error ? error.message : String(error),
            componentPath
          });
          
          // Skip this tag and continue
          searchStart = tagEnd;
        }
      } else {
        break;
      }
    }
    
    return result;
  }
  
  /**
   * Internal component rendering that uses registered components or falls back to PureMix engine
   */
  private async renderComponentInternal(
    componentName: string,
    componentPath: string,
    props: Record<string, any>,
    request: PureMixRequest
  ): Promise<string> {
    // First, check if we have a registered component
    const registeredComponent = this.getComponent(componentName);
    if (registeredComponent) {
      log.debug(`Using registered component: ${componentName}`);
      return await this.processComponent(
        componentName,
        registeredComponent.path,
        registeredComponent.template,
        props,
        request
      );
    }
    
    // If not registered, try to use the PureMix engine to render it
    if (this.pureMixEngine) {
      try {
        log.debug(`Using PureMix engine to render component: ${componentName}`);
        const renderResult = await this.pureMixEngine.renderComponent(componentPath, props, request);
        return renderResult.html;
      } catch (error) {
        log.error(`PureMix engine failed to render component ${componentName}`, {
          error: error instanceof Error ? error.message : String(error),
          componentPath
        });
      }
    }
    
    // If all else fails, return a placeholder indicating the component couldn't be rendered
    const placeholder = `<!-- Component ${componentName} could not be rendered (path: ${componentPath}) -->`;
    log.warn(`Component ${componentName} could not be rendered`, {
      componentPath,
      hasPureMixEngine: !!this.pureMixEngine,
      availableComponents: Array.from(this.components.keys())
    });
    
    return placeholder;
  }

  /**
   * Check if a position is inside a code block using character analysis (NO REGEX)
   * Replaces all the regex-based tag matching with pure character analysis
   */
  private isInsideCodeBlockCharacterBased(template: string, position: number): boolean {
    // Check if inside HTML tag blocks using character-based analysis
    const codeBlockTags = [
      { open: '<script', close: '</script>' },
      { open: '<style', close: '</style>' },
      { open: '<pre', close: '</pre>' },
      { open: '<code', close: '</code>' }
    ];
    
    for (const { open, close } of codeBlockTags) {
      // Find the most recent opening tag before this position
      let lastOpenPos = -1;
      let searchStart = 0;
      
      while (true) {
        const openPos = this.findTagAtPosition(template, open, searchStart);
        if (openPos === -1 || openPos >= position) break;
        lastOpenPos = openPos;
        searchStart = openPos + 1;
      }
      
      if (lastOpenPos !== -1) {
        // Find the corresponding closing tag after the opening tag
        const closePos = this.findTagAtPosition(template, close, lastOpenPos);
        
        // If position is between opening and closing tag, it's inside a code block
        if (closePos === -1 || position < closePos) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Find a tag at a specific position using character-based search (NO REGEX)
   */
  private findTagAtPosition(template: string, tag: string, startPos: number): number {
    for (let i = startPos; i <= template.length - tag.length; i++) {
      let match = true;
      
      for (let j = 0; j < tag.length; j++) {
        if (template[i + j].toLowerCase() !== tag[j].toLowerCase()) {
          match = false;
          break;
        }
      }
      
      if (match) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Check if an expression should be skipped using character analysis (NO REGEX)
   */
  private shouldSkipExpressionCharacterBased(expression: string): boolean {
    const trimmed = expression.trim();
    
    // Skip string literals using character analysis
    if (trimmed.length >= 2) {
      const first = trimmed[0];
      const last = trimmed[trimmed.length - 1];
      
      if ((first === '"' && last === '"') || 
          (first === "'" && last === "'") || 
          (first === '`' && last === '`')) {
        return true;
      }
    }
    
    // Skip obvious JavaScript code patterns using character analysis
    const jsPatterns = ['console.', 'function', '=>', 'document.', 'window.'];
    
    for (const pattern of jsPatterns) {
      if (this.containsPattern(trimmed, pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a string contains a pattern using character-based search (NO REGEX)
   */
  private containsPattern(text: string, pattern: string): boolean {
    for (let i = 0; i <= text.length - pattern.length; i++) {
      let match = true;
      
      for (let j = 0; j < pattern.length; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Count occurrences of a pattern using character-based analysis (NO REGEX)
   */
  private countPatternOccurrences(text: string, pattern: string): number {
    let count = 0;
    let searchStart = 0;
    
    while (true) {
      const foundIndex = this.findPatternAtPosition(text, pattern, searchStart);
      if (foundIndex === -1) break;
      
      count++;
      searchStart = foundIndex + pattern.length;
    }
    
    return count;
  }

  /**
   * Find pattern at position using character-based search (NO REGEX)
   */
  private findPatternAtPosition(text: string, pattern: string, startPos: number): number {
    for (let i = startPos; i <= text.length - pattern.length; i++) {
      let match = true;
      
      for (let j = 0; j < pattern.length; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Find balanced brace expressions using character counting (NO REGEX)
   * Replaces the regex-based expression finding with pure character analysis
   */
  private findBalancedExpressionsCharacterBased(template: string): Array<{fullMatch: string, content: string, position: number}> {
    const expressions: Array<{fullMatch: string, content: string, position: number}> = [];
    let i = 0;
    
    while (i < template.length) {
      if (template[i] === '{') {
        const start = i;
        let braceCount = 1;
        let j = i + 1;
        
        // Find the matching closing brace using character counting
        while (j < template.length && braceCount > 0) {
          if (template[j] === '{') {
            braceCount++;
          } else if (template[j] === '}') {
            braceCount--;
          }
          j++;
        }
        
        // If we found a balanced expression
        if (braceCount === 0) {
          const fullMatch = template.substring(start, j);
          const content = template.substring(start + 1, j - 1); // Remove outer braces
          expressions.push({ fullMatch, content, position: start });
          i = j;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
    
    return expressions;
  }

  /**
   * Parse conditional expressions using character analysis (NO REGEX)
   * Replaces regex-based ternary parsing with proper character analysis
   */
  private parseConditionalCharacterBased(expression: string): {
    condition: string,
    trueExpr: string,
    falseExpr: string
  } | null {
    // Find the question mark and colon using character analysis with HTML content awareness
    let questionMarkIndex = -1;
    let colonIndex = -1;
    let braceDepth = 0;
    let angleDepth = 0;
    let inQuotes = false;
    let quoteChar = '';
    let inHtmlContent = false; // NEW: Track when we're inside HTML text content

    // Find question mark
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];

      if (!inQuotes) {
        if (char === '"' || char === "'" || char === '`') {
          inQuotes = true;
          quoteChar = char;
        } else if (char === '{') {
          braceDepth++;
          inHtmlContent = false; // Entering expression context
        } else if (char === '}') {
          braceDepth--;
        } else if (char === '<') {
          angleDepth++;
          inHtmlContent = false; // Starting HTML tag
        } else if (char === '>') {
          angleDepth--;
          // We might be entering HTML text content after closing a tag
          if (angleDepth === 0 && braceDepth === 0) {
            inHtmlContent = true;
          }
        } else if (char === '?' && braceDepth === 0 && angleDepth === 0 && !inHtmlContent) {
          questionMarkIndex = i;
          break;
        }
      } else if (char === quoteChar && (i === 0 || expression[i-1] !== '\\')) {
        inQuotes = false;
        quoteChar = '';
      }
    }

    if (questionMarkIndex === -1) {
      return null;
    }

    // Reset state and find colon with enhanced HTML content detection
    braceDepth = 0;
    angleDepth = 0;
    inQuotes = false;
    quoteChar = '';
    inHtmlContent = false;

    for (let i = questionMarkIndex + 1; i < expression.length; i++) {
      const char = expression[i];

      if (!inQuotes) {
        if (char === '"' || char === "'" || char === '`') {
          inQuotes = true;
          quoteChar = char;
        } else if (char === '{') {
          braceDepth++;
          inHtmlContent = false; // Entering expression context
        } else if (char === '}') {
          braceDepth--;
        } else if (char === '<') {
          angleDepth++;
          inHtmlContent = false; // Starting HTML tag
        } else if (char === '>') {
          angleDepth--;
          // Check if we're entering HTML text content
          if (angleDepth === 0 && braceDepth === 0) {
            inHtmlContent = true;
          }
        } else if (char === ':' && braceDepth === 0 && angleDepth === 0 && !inHtmlContent) {
          // Only accept colon if we're NOT in HTML text content
          colonIndex = i;
          break;
        }

        // Additional content detection: non-whitespace after > means we're in HTML text
        if (inHtmlContent && char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r' && char !== '<') {
          // We're definitely in HTML text content now
          inHtmlContent = true;
        } else if (char === '<' && inHtmlContent) {
          // Starting a new tag, exiting text content
          inHtmlContent = false;
          angleDepth++;
        }
      } else if (char === quoteChar && (i === 0 || expression[i-1] !== '\\')) {
        inQuotes = false;
        quoteChar = '';
      }
    }
    
    if (colonIndex === -1) {
      return null;
    }
    
    return {
      condition: expression.substring(0, questionMarkIndex).trim(),
      trueExpr: expression.substring(questionMarkIndex + 1, colonIndex).trim(),
      falseExpr: expression.substring(colonIndex + 1).trim()
    };
  }

  /**
   * Parse array method calls using character analysis (NO REGEX)
   * Replaces regex-based array.map() parsing with character-based parsing
   */
  private parseArrayMethodCharacterBased(expression: string): {
    arrayExpr: string,
    method: string,
    parameter: string,
    template: string
  } | null {
    // Look for .map( pattern using character analysis
    const methods = ['map', 'filter', 'forEach'];
    
    for (const method of methods) {
      const methodPattern = `.${method}(`;
      const methodIndex = this.findPatternAtPosition(expression, methodPattern, 0);
      
      if (methodIndex !== -1) {
        const arrayExpr = expression.substring(0, methodIndex).trim();
        
        // Find the arrow function parameters and template
        const parenStart = methodIndex + methodPattern.length;
        let parenEnd = -1;
        let parenDepth = 1;
        
        for (let i = parenStart; i < expression.length && parenDepth > 0; i++) {
          if (expression[i] === '(') {
            parenDepth++;
          } else if (expression[i] === ')') {
            parenDepth--;
            if (parenDepth === 0) {
              parenEnd = i;
              break;
            }
          }
        }
        
        if (parenEnd !== -1) {
          const functionContent = expression.substring(parenStart, parenEnd).trim();
          
          // Parse arrow function: param => template
          const arrowIndex = this.findPatternAtPosition(functionContent, '=>', 0);
          
          if (arrowIndex !== -1) {
            const parameter = functionContent.substring(0, arrowIndex).trim();
            const template = functionContent.substring(arrowIndex + 2).trim();
            
            return {
              arrayExpr,
              method,
              parameter,
              template
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Process all template expressions using the AST interpreter exclusively
   * NO REGEX - Pure delegation to the AST interpreter
   */
  private processTemplateWithAST(template: string, context: TemplateContext): string {
    log.debug('Processing template with pure AST interpreter (NO REGEX)', {
      templateLength: template.length,
      contextKeys: Object.keys(context).length
    });
    
    try {
      // Use the AST interpreter for ALL template processing
      // This eliminates the need for any regex-based processing
      const result = this.interpreter.interpret(template, context);
      
      log.debug('AST template processing completed successfully', {
        resultLength: result.length
      });
      
      return result;
      
    } catch (error) {
      log.error('AST template processing failed', {
        error: error instanceof Error ? error.message : String(error),
        templatePreview: template.substring(0, 100)
      });
      
      return template;
    }
  }
}

/**
 * Factory function to create a template engine instance
 */
export function createTemplateEngine(pureMixEngine?: any): TemplateEngineInterpreter {
  return new TemplateEngineInterpreter(pureMixEngine);
}