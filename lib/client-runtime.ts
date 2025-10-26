/**
 * Client Runtime Generator - Browser-side Framework API
 * 
 * PURPOSE: Generates client-side JavaScript that provides PureMix API in the browser
 * ARCHITECTURE: Server-side code generation → Browser execution → Server communication
 * 
 * FLOW DIAGRAM:
 * 1. Server generates client runtime with loader data and CSRF token
 * 2. Browser receives window.PureMix API with utilities
 * 3. Client calls server functions via AJAX with automatic security
 * 4. DOM utilities provide vanilla JS helpers for interactivity
 * 
 * DEPENDENCIES:
 * - types.ts for TypeScript interfaces
 * - Server-side loader results and request context
 * - CSRF token from request for security
 * 
 * BROWSER API:
 * - PureMix.call() - Server function calls
 * - PureMix.loaders - Server-side loader data
 * - PureMix.dom - DOM manipulation utilities  
 * - PureMix.storage - Local/session storage helpers
 * - PureMix.events - Event handling utilities
 */

import type { LoaderResults, PureMixRequest, ActionResult } from './types.ts';

interface ClientRuntimeOptions {
  version?: string;
  serverFunctions?: string[];
  componentFunctions?: Record<string, string[]>;
  clientScripts?: string[];
}

/**
 * Generates the complete client-side runtime JavaScript code
 * @param loaderResults - Results from server-side loader functions
 * @param request - Current request context with CSRF token
 * @param options - Configuration options including version and server functions
 * @returns Complete JavaScript code as string for browser execution
 */
export function generateClientRuntime(
  loaderResults: LoaderResults,
  request: PureMixRequest,
  options: ClientRuntimeOptions = {}
): string {
  const loaderData = Object.keys(loaderResults.results || {}).reduce((acc: Record<string, any>, key: string) => {
    acc[key] = loaderResults.results[key];
    return acc;
  }, {});

  const version = options.version || '1.0.0';
  const csrfToken = request.res?.locals?.csrfToken || '';
  const serverFunctions = options.serverFunctions || [];
  const componentFunctions = options.componentFunctions || {};
  const clientScripts = options.clientScripts || [];

  // HTML-escape JSON content to prevent script tag breakout
  const escapeJsonForHtml = (data: any): string => {
    return JSON.stringify(data)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/\//g, '\\u002f');
  };

  return `
<!-- PureMix Data Injection (secure, non-executable) -->
<script type="application/json" id="puremix-data">${escapeJsonForHtml(loaderData)}</script>
<script type="application/json" id="puremix-server-functions">${escapeJsonForHtml(serverFunctions)}</script>
<script type="application/json" id="puremix-component-functions">${escapeJsonForHtml(componentFunctions)}</script>

<script>
(function() {
  'use strict';

  // EARLY DEBUG: Check if client runtime is executing at all
  console.log('🚀 PUREMIX CLIENT RUNTIME LOADING...');
  console.log('🚀 CLIENT: Script execution started at', new Date().toISOString());

  // Safely load data from non-executable script tags
  const loadSecureData = (id) => {
    try {
      const element = document.getElementById(id);
      return element ? JSON.parse(element.textContent) : {};
    } catch (error) {
      console.warn('Failed to load PureMix data from', id, error);
      return {};
    }
  };

  // PureMix Client Runtime - extend existing object or create new one
  console.log('🚀 CLIENT: Creating window.PureMix object...');
  window.PureMix = Object.assign(window.PureMix || {}, {
    // Framework version
    version: '${version}',

    // Loader results from server (loaded securely)
    data: loadSecureData('puremix-data'),

    // Server functions available on this page (loaded securely)
    serverFunctions: loadSecureData('puremix-server-functions'),
    
    // Framework state
    state: {
      loading: false,
      hydrated: false,
      csrfToken: "${csrfToken}",
      currentRoute: window.location.pathname
    },
    
    // Initialize the framework
    init: function() {
      console.log('🚀 CLIENT: init() function called!');
      if (this.state.hydrated) {
        console.log('🚀 CLIENT: Already hydrated, skipping init');
        return;
      }

      console.log('🚀 PureMix Client Runtime v' + this.version);
      console.log('🚀 CLIENT: About to initialize form interception...');
      
      // Initialize server functions from the array passed from server
      if (Array.isArray(this.serverFunctions)) {
        const functionsArray = this.serverFunctions;
        this.serverFunctions = new Map();
        this.componentFunctions = new Map();
        this.initializeServerFunctions(functionsArray, loadSecureData('puremix-component-functions'));
      }
      
      this.interceptForms();
      this.interceptLinks();
      this.setupEventDelegation();
      this.initializeComponents();
      this.setupDevTools();
      
      this.state.hydrated = true;
      this.emit('hydrated');
    },
    
    // DOM utilities
    $: function(selector) {
      const elements = document.querySelectorAll(selector);
      return new PureMixElements(Array.from(elements));
    },
    
    // Event system
    events: {},
    
    on: function(event, callback) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(callback);
    },
    
    off: function(event, callback) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(cb => cb !== callback);
      }
    },
    
    emit: function(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data));
      }
    },

    // Form handling
    interceptForms: function() {
      document.addEventListener('submit', this.handleFormSubmit.bind(this));
    },

    handleFormSubmit: async function(e) {
      const form = e.target;
      let action = form.getAttribute('data-action');

      // Also check for onsubmit attributes that reference server functions
      if (!action) {
        const onsubmit = form.getAttribute('onsubmit');
        console.log('🔍 DEBUG: Form onsubmit attribute:', onsubmit);
        if (onsubmit && this.isServerFunction(onsubmit)) {
          action = onsubmit;
          console.log('🔍 DEBUG: Found server function in onsubmit:', action);
        }
      }

      console.log('🔍 DEBUG: Form submission - action found:', action);

      if (!action) {
        console.log('🔍 DEBUG: No action found, allowing normal form submission');
        return; // Let normal form submission happen
      }

      console.log('✅ INTERCEPTING FORM SUBMISSION FOR:', action);
      e.preventDefault();

      const formData = new FormData(form);

      // Use unified FormData conversion function
      const data = this.convertFormDataToObject(formData, 'submitForm-method');

      // Add hidden action field
      data._action = action;

      console.log('🔍 DEBUG: Form data extracted:', data);

      try {
        console.log('🚀 DEBUG: Calling server function:', action, 'with data:', data);
        const result = await this.call(action, data);
        console.log('✅ DEBUG: Form submission completed:', result);

        // Handle common responses
        if (result && result.success) {
          this.emit('formSuccess', { form, result, data });

          // Auto-refresh page if result indicates reload
          if (result.reload || result.refresh) {
            console.log('🔄 DEBUG: Reloading page as requested by server');
            setTimeout(() => this.reload(), 100);
          }
        }
      } catch (error) {
        console.error('❌ Form submission failed:', error);
        this.emit('formError', { form, error });
      }
    },

    // Setup event delegation for dynamic elements
    setupEventDelegation: function() {
      console.log('🎯 Setting up event delegation for dynamic elements');

      // Handle onclick attributes via event delegation
      document.addEventListener('click', (e) => {
        if (e.target.hasAttribute('onclick')) {
          const onclickValue = e.target.getAttribute('onclick');
          if (this.isServerFunction(onclickValue)) {
            e.preventDefault();
            this.executeServerFunction(e.target, onclickValue, e);
          }
        }
      });

      // Handle other interactive elements
      document.addEventListener('change', (e) => {
        this.emit('change', { target: e.target, value: e.target.value });
      });

      document.addEventListener('input', (e) => {
        this.emit('input', { target: e.target, value: e.target.value });
      });
    },

    // Add missing interceptLinks method
    interceptLinks: function() {
      console.log('🔗 Setting up link interception (if needed)');
      // Placeholder for link interception logic
      // Can be implemented later for SPA-style navigation
    },
    
    // Storage utilities
    storage: {
      local: {
        set: function(key, value) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch (e) {
            console.warn('LocalStorage write failed:', e);
            return false;
          }
        },
        
        get: function(key, defaultValue = null) {
          try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
          } catch (e) {
            console.warn('LocalStorage read failed:', e);
            return defaultValue;
          }
        },
        
        remove: function(key) {
          localStorage.removeItem(key);
        },
        
        clear: function() {
          localStorage.clear();
        }
      },
      
      session: {
        set: function(key, value) {
          try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch (e) {
            console.warn('SessionStorage write failed:', e);
            return false;
          }
        },
        
        get: function(key, defaultValue = null) {
          try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
          } catch (e) {
            console.warn('SessionStorage read failed:', e);
            return defaultValue;
          }
        },
        
        remove: function(key) {
          sessionStorage.removeItem(key);
        },
        
        clear: function() {
          sessionStorage.clear();
        }
      },
      
      cookie: {
        set: function(name, value, options = {}) {
          const defaults = {
            days: 7,
            path: '/',
            secure: window.location.protocol === 'https:',
            sameSite: 'Lax'
          };
          
          const opts = Object.assign(defaults, options);
          let cookie = name + '=' + encodeURIComponent(value);
          
          if (opts.days) {
            const expires = new Date(Date.now() + opts.days * 864e5);
            cookie += '; expires=' + expires.toUTCString();
          }
          
          cookie += '; path=' + opts.path;
          if (opts.secure) cookie += '; secure';
          cookie += '; samesite=' + opts.sameSite;
          
          document.cookie = cookie;
        },
        
        get: function(name) {
          return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
          }, '');
        },
        
        remove: function(name, path = '/') {
          this.set(name, '', { days: -1, path: path });
        }
      }
    },
    
    // HTTP utilities
    http: {
      get: function(url, options = {}) {
        return PureMix.fetch(url, { method: 'GET', ...options });
      },
      
      post: function(url, data, options = {}) {
        return PureMix.fetch(url, { 
          method: 'POST', 
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
          ...options 
        });
      },
      
      put: function(url, data, options = {}) {
        return PureMix.fetch(url, { 
          method: 'PUT', 
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
          ...options 
        });
      },
      
      delete: function(url, options = {}) {
        return PureMix.fetch(url, { method: 'DELETE', ...options });
      }
    },
    
    // Enhanced fetch with automatic CSRF and error handling
    fetch: async function(url, options = {}) {
      const defaults = {
        headers: {
          'X-CSRF-Token': this.state.csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        }
      };

      const config = Object.assign({}, defaults, options, {
        headers: Object.assign({}, defaults.headers, options.headers || {})
      });

      // CRITICAL DEBUG: Log the exact body being sent to server
      console.log('🚀 FETCH DEBUG: About to send request to server');
      console.log('🚀 FETCH DEBUG: URL:', url);
      console.log('🚀 FETCH DEBUG: Body type:', typeof config.body);
      console.log('🚀 FETCH DEBUG: Body content:', config.body);
      if (typeof config.body === 'string') {
        try {
          const parsedBody = JSON.parse(config.body);
          console.log('🚀 FETCH DEBUG: Parsed body data field type:', typeof parsedBody.data);
          console.log('🚀 FETCH DEBUG: Parsed body data content:', parsedBody.data);
        } catch(e) {
          console.log('🚀 FETCH DEBUG: Body is not valid JSON');
        }
      }

      try {
        this.setLoading(true);
        const response = await fetch(url, config);
        
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }
      } catch (error) {
        console.error('Fetch error:', error);
        this.emit('error', error);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },
    
    // Component functions (will be initialized in init())
    componentFunctions: new Map(),
    
    // Initialize server function registry
    initializeServerFunctions: function(functions, componentFunctions = {}) {
      if (this.serverFunctions instanceof Map) {
        this.serverFunctions.clear();
      } else {
        this.serverFunctions = new Map();
      }
      
      if (this.componentFunctions instanceof Map) {
        this.componentFunctions.clear();
      } else {
        this.componentFunctions = new Map();
      }
      
      // Register page-level server functions
      if (functions) {
        // Handle both array of names and object of functions
        const functionNames = Array.isArray(functions) ? functions : Object.keys(functions);
        
        functionNames.forEach(functionName => {
          this.serverFunctions.set(functionName, {
            name: functionName,
            type: 'page',
            component: null
          });
          
          // Create global function wrapper for direct calls
          const wrapper = this.createFunctionWrapper(name, 'page');
          window[name] = wrapper;
          console.log('✅ Server function available globally:', name, typeof wrapper);
        });
      }
      
      // Register component functions
      if (componentFunctions) {
        Object.entries(componentFunctions).forEach(([componentName, funcs]) => {
          if (Array.isArray(funcs)) {
            funcs.forEach(funcName => {
              const fullName = componentName + '.' + funcName;
              this.componentFunctions.set(fullName, {
                name: funcName,
                type: 'component',
                component: componentName
              });
              
              // Create namespaced function for direct calls
              if (!window[componentName]) window[componentName] = {};
              window[componentName][funcName] = this.createFunctionWrapper(fullName, 'component');
              console.log('✅ Component function available globally:', fullName);
            });
          }
        });
      }
    },
    
    // Create function wrapper for different call patterns
    createFunctionWrapper: function(functionName, type) {
      return async (dataOrEvent = {}) => {
        let data = dataOrEvent;
        let sourceElement = null;
        
        // Handle different call contexts
        if (dataOrEvent && dataOrEvent.target) {
          // Called from event (onclick, onsubmit, etc.)
          sourceElement = dataOrEvent.target;
          
          if (dataOrEvent.type === 'submit') {
            dataOrEvent.preventDefault();
            // Auto-extract form data
            if (sourceElement.tagName === 'FORM') {
              const formData = new FormData(sourceElement);
              console.log('🔍 DEBUG: Form submission - raw FormData entries:', Array.from(formData.entries()));
              // Check if form has file uploads (multipart/form-data)
              if (sourceElement.enctype === 'multipart/form-data' || sourceElement.querySelector('input[type="file"]')) {
                data = formData; // Keep as FormData for file uploads
                console.log('🔍 DEBUG: Form submission - keeping as FormData for file uploads');
              } else {
                // Use unified FormData conversion function
                console.log('🔍 DEBUG: About to call convertFormDataToObject with:', formData);
                data = this.convertFormDataToObject(formData, 'form-submit-main');
                console.log('🔍 DEBUG: Form submission - enhanced conversion result:', data);
                console.log('🔍 DEBUG: Post-conversion data type:', typeof data);

                // CRITICAL: Check if conversion result is corrupted
                if (typeof data === 'string' && data === '[object Object]') {
                  console.error('🚨 CORRUPTION IN FORM CONVERSION: convertFormDataToObject returned "[object Object]" string!');
                  console.trace('🚨 Form conversion corruption trace:');
                }
              }
            }
          } else if (dataOrEvent.type === 'click') {
            // For click events, check if parent form exists
            const form = sourceElement.closest('form');
            if (form) {
              const formData = new FormData(form);
              // Check if form has file uploads (multipart/form-data)
              if (form.enctype === 'multipart/form-data' || form.querySelector('input[type="file"]')) {
                data = formData; // Keep as FormData for file uploads
              } else {
                // Use unified FormData conversion function
                data = this.convertFormDataToObject(formData, 'click-event-form');
              }
            } else {
              data = {};
            }
          }
        } else if (typeof dataOrEvent === 'object' && dataOrEvent !== null && !dataOrEvent.target) {
          // Direct call with data object
          data = dataOrEvent;
        } else {
          // Direct call without parameters
          data = {};
        }
        
        // Call the actual server function
        const result = await this.call(functionName, data, { sourceElement });
        
        // Auto-reset form if successful and it was a form submission
        if (result && !result.error && sourceElement && sourceElement.tagName === 'FORM') {
          sourceElement.reset();
        }
        
        return result;
      };
    },

    // Enhanced server function calls with component support
    call: async function(functionName, data = {}, options = {}) {
      try {
        
        // Check if function is registered (with name mapping for components)
        let actualFunctionName = functionName;
        let isComponentFunction = this.componentFunctions.has(functionName);
        const isPageFunction = this.serverFunctions.has(functionName);
        
        // Handle component function name mapping: "Component.func" → "Component.Component_func"
        if (!isComponentFunction && functionName.includes('.')) {
          const parts = functionName.split('.');
          if (parts.length === 2) {
            const [componentName, funcName] = parts;
            const mappedName = componentName + '.' + componentName + '_' + funcName;
            if (this.componentFunctions.has(mappedName)) {
              actualFunctionName = mappedName;
              isComponentFunction = true;
              console.log('🔄 Mapped component function: "' + functionName + '" → "' + mappedName + '"');
            }
          }
        }
        
        console.log('🔍 After mapping check:', {
          functionName,
          actualFunctionName,
          isComponentFunction,
          isPageFunction
        });
        
        if (!isComponentFunction && !isPageFunction) {
          console.warn('Server function "' + functionName + '" not found. Available functions:', 
                      Array.from(this.serverFunctions.keys()).concat(Array.from(this.componentFunctions.keys())));
        }
        
        console.log('🔍 About to check component detection for:', functionName);
        
        // Detect component-scoped actions: "ComponentName.actionName"
        if (functionName.includes('.')) {
          const [componentName, actionName] = functionName.split('.');
          
          // Find component instance on current page
          const componentElement = document.querySelector('[data-component="' + componentName + '"]');
          const componentId = componentElement?.getAttribute('data-component-id');
          
          console.log('🔍 Component search debug:', {
            componentName,
            componentElement: !!componentElement,
            componentId,
            condition: !!(componentElement && componentId)
          });
          
          if (componentElement && componentId) {
            // Component-specific AJAX (follows action→loader→template)
            // Use the actual mapped function name for the server
            console.log('🚀 AJAX Debug: Sending component action request:', {
              endpoint: '/_puremix/component-action',
              action: actualFunctionName,
              componentId: componentId,
              data: data,
              csrfToken: this.state.csrfToken ? '✅ Present' : '❌ Missing'
            });
            
            // Handle file uploads for component actions
            let componentHeaders = {
              'X-CSRF-Token': this.state.csrfToken,
              'X-Requested-With': 'XMLHttpRequest'
            };
            let componentBody;

            if (data instanceof FormData) {
              // For file uploads, send FormData directly
              componentBody = data;
              componentBody.append('action', actionName);
              componentBody.append('componentId', componentId);
            } else {
              // For regular data, send as JSON
              componentHeaders['Content-Type'] = 'application/json';
              componentBody = JSON.stringify({
                action: actionName,  // Use original action name for server lookup
                data: data,
                componentId: componentId
              });
            }

            const response = await this.fetch('/_puremix/component-action', {
              method: 'POST',
              headers: componentHeaders,
              body: componentBody
            });
            
            if (response.type === 'component-update') {
              // Selective DOM update (no virtual DOM)
              this.updateComponentTree(response);
              
              // Emit events for component communication
              this.emit('componentAction', { 
                component: componentName, 
                action: actionName,
                data: data,
                response: response 
              });
              
              return response;
            }
          } else {
            console.warn('Component ' + componentName + ' not found on page for action: ' + functionName);
          }
        }
        
        // Page-level action (existing full flow)
        let requestHeaders = {
          'X-CSRF-Token': this.state.csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        };
        let requestBody;

        // Handle file uploads vs regular data
        if (data instanceof FormData) {
          // For file uploads, send FormData directly (browser sets Content-Type with boundary)
          requestBody = data;
          // Add action to FormData
          requestBody.append('action', actualFunctionName);
          requestBody.append('route', window.location.pathname);
        } else {
          // For regular data, send as JSON
          requestHeaders['Content-Type'] = 'application/json';
          console.log('🔍 DEBUG: About to stringify data for server:', data);
          console.log('🔍 DEBUG: Data type:', typeof data, 'Is array:', Array.isArray(data));
          console.log('🔍 DEBUG: Data JSON representation:', JSON.stringify(data));

          // CRITICAL DEBUG: Check if data is somehow already a string
          if (typeof data === 'string' && data === '[object Object]') {
            console.error('🚨 BUG DETECTED: Data has been converted to "[object Object]" string!');
            console.error('🚨 This indicates an object.toString() conversion happened somewhere');
            console.trace('🚨 Stack trace to find where data became a string:');
          }

          // CRITICAL TEST: Let's see what happens step by step
          console.log('🔬 STEP-BY-STEP DEBUG v3.0 [CORRUPTION POINT INVESTIGATION]:');
          console.log('🔬 1. Data before creating request object:', data);
          console.log('🔬 2. Data type check:', typeof data);
          console.log('🔬 3. Data JSON test:', JSON.stringify(data));

          // TEST: What happens if we manually check for [object Object]?
          if (typeof data === 'string' && data === '[object Object]') {
            console.error('🚨🚨🚨 CORRUPTION DETECTED AT LINE 701: Data is already "[object Object]" string!');
            console.error('🚨 This means the corruption happened in the FormData conversion or earlier!');
            console.trace('🚨 Stack trace:');
          }

          const requestData = {
            action: actualFunctionName,
            data: data,
            route: options.route || this.state.currentRoute
          };
          console.log('🔬 4. Request object after creation:', requestData);
          console.log('🔬 5. Request object data field type:', typeof requestData.data);
          console.log('🔬 6. Request object data field value:', requestData.data);

          requestBody = JSON.stringify(requestData);
          console.log('🔬 7. Final stringified result:', requestBody);

          // Parse it back to see what happened
          try {
            const parsed = JSON.parse(requestBody);
            console.log('🔬 8. Parsed back - data field type:', typeof parsed.data);
            console.log('🔬 9. Parsed back - data field value:', parsed.data);
          } catch (e) {
            console.error('🔬 Failed to parse back:', e);
          }
        }

        const response = await this.fetch('/_puremix/action', {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        });

        console.log('🔍 Response type check:', typeof response);
        console.log('🔍 Response content preview:', typeof response === 'string' ? response.substring(0, 200) : response);

        // Handle different response types
        if (typeof response === 'string') {
          // HTML response - perform DOM diffing on main content area
          console.log('📄 HTML response detected - performing DOM diffing');
          this.handleHtmlResponse(response, functionName);
        } else if (response.redirect) {
          this.navigate(response.redirect);
        } else if (response.reload) {
          this.reload();
        } else if (response.update) {
          this.updateData(response.update);
        }

        this.emit('action', { function: functionName, data, response });

        return response;
        
      } catch (error) {
        console.error('Server function "' + functionName + '" failed:', error);
        this.emit('actionError', { function: functionName, data, error });
        throw error;
      }
    },

    // Component tree update without virtual DOM
    updateComponentTree: function(update) {
      const element = document.querySelector('[data-component-id="' + update.componentId + '"]');
      if (!element) {
        console.warn('Component not found: ' + update.componentId);
        return;
      }

      // Store previous state for change detection
      const previousHtml = element.innerHTML;
      const componentName = element.getAttribute('data-component');

      // Smart DOM diffing - only update changed nodes
      this.diffAndUpdateDOM(element, update.html);

      // Re-initialize client-side behavior for this component only
      this.initializeComponent(element);
      
      // Update performance tracking
      this.trackComponentUpdate({
        componentId: update.componentId,
        componentName: componentName,
        previousHtml: previousHtml,
        newHtml: update.html,
        renderTime: update.renderTime,
        timestamp: Date.now()
      });
      
      // Emit for debugging and inter-component communication
      this.emit('componentUpdated', {
        id: update.componentId,
        name: componentName,
        changed: previousHtml !== update.html,
        loaderData: update.loaderData
      });
      
      console.log('✅ Component ' + componentName + '#' + update.componentId + ' updated independently');
    },

    // Handle HTML responses from server actions (for DOM diffing)
    handleHtmlResponse: function(htmlResponse, functionName) {
      console.log('🔄 Processing HTML response for function:', functionName);

      // Find the main content area to update
      // Try multiple selectors to find the content area, prioritizing app container
      let contentArea = document.querySelector('#app') ||
                       document.querySelector('main') ||
                       document.querySelector('[data-content]') ||
                       document.querySelector('#content') ||
                       document.querySelector('.main-content') ||
                       document.body;

      if (!contentArea) {
        console.warn('⚠️ No content area found - falling back to body');
        contentArea = document.body;
      }

      console.log('🎯 Content area found:', contentArea.tagName, contentArea.className || contentArea.id);

      // Store scroll positions before update
      const scrollPositions = this.preserveScrollPositions(contentArea);

      // Parse the HTML response
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlResponse;

      // Extract the main content from response
      let newContent = tempDiv.querySelector('#app') ||
                      tempDiv.querySelector('main') ||
                      tempDiv.querySelector('[data-content]') ||
                      tempDiv.querySelector('#content') ||
                      tempDiv.querySelector('.main-content');

      if (!newContent) {
        // If no specific content area, use the entire response
        console.log('🔄 No specific content area in response - using entire HTML');
        newContent = tempDiv;
      }

      // Perform DOM diffing on the content area
      console.log('🔄 Performing DOM diff between current content and server response');
      this.diffAndUpdateDOM(contentArea, newContent.innerHTML);

      // Restore scroll positions after update
      this.restoreScrollPositions(contentArea, scrollPositions);

      // Re-initialize any scripts in the updated content
      this.reinitializeScripts(contentArea);

      console.log('✅ HTML response processed and DOM updated');
    },

    // Initialize a single component's client-side behavior
    initializeComponent: function(element) {
      // Re-run any component-specific initialization
      const scripts = element.querySelectorAll('script[data-component-script]');
      scripts.forEach(script => {
        try {
          // Re-execute component scripts in isolation
          const code = script.textContent;
          if (code) {
            // Create isolated execution context for component
            new Function('element', 'PureMix', code)(element, this);
          }
        } catch (error) {
          console.error('Component script initialization failed:', error);
        }
      });
      
      // Form handlers are handled globally by interceptForms method
      // No need to re-initialize per component as they use event delegation
    },

    // Track component update performance
    trackComponentUpdate: function(data) {
      if (!this.componentMetrics) {
        this.componentMetrics = new Map();
      }
      
      const metrics = this.componentMetrics.get(data.componentId) || {
        updateCount: 0,
        totalRenderTime: 0,
        avgRenderTime: 0,
        lastUpdate: 0
      };
      
      metrics.updateCount++;
      metrics.totalRenderTime += data.renderTime || 0;
      metrics.avgRenderTime = metrics.totalRenderTime / metrics.updateCount;
      metrics.lastUpdate = data.timestamp;
      
      this.componentMetrics.set(data.componentId, metrics);
      
      // Log performance warnings for slow components
      if (metrics.avgRenderTime > 100) {
        console.warn('⚠️ Component ' + data.componentName + ' averaging ' + metrics.avgRenderTime.toFixed(1) + 'ms render time');
      }
    },
    
    // Helper function to call server functions with dynamic data
    callWithData: async function(functionName, dataProvider) {
      // dataProvider can be a function that returns data, or static data
      const data = typeof dataProvider === 'function' ? dataProvider() : dataProvider;
      return await this.call(functionName, data);
    },
    
    // Helper to get current form data plus additional dynamic data
    callWithFormData: async function(functionName, formSelector, additionalData = {}) {
      const form = document.querySelector(formSelector);

      let formData = {};
      if (form) {
        // Use unified FormData conversion function
        const formDataObj = new FormData(form);
        formData = this.convertFormDataToObject(formDataObj, 'callWithFormData-helper');
      }

      const finalData = { ...formData, ...additionalData };
      return await this.call(functionName, finalData);
    },
    
    // Helper to create dynamic onclick handlers
    createDynamicHandler: function(functionName, dataProvider) {
      return async function(event) {
        const data = typeof dataProvider === 'function' ? dataProvider() : dataProvider;
        return await window.PureMix.call(functionName, data);
      };
    },
    
    // Navigation
    navigate: function(url, options = {}) {
      if (options.replace) {
        window.location.replace(url);
      } else {
        window.location.href = url;
      }
    },
    
    reload: function() {
      window.location.reload();
    },
    
    // Data updates
    updateData: function(updates) {
      Object.assign(this.data, updates);
      this.emit('dataUpdate', updates);
    },
    
    // Loading state
    setLoading: function(loading) {
      this.state.loading = loading;
      this.$('[data-loading]')[loading ? 'show' : 'hide']();
      this.emit('loadingChange', loading);
    },
    
    // Form handling
    interceptForms: function() {
      document.addEventListener('submit', this.handleFormSubmit.bind(this));
    },
    
    handleFormSubmit: async function(e) {
      const form = e.target;
      let action = form.getAttribute('data-action');
      
      // Also check for onsubmit attributes that reference server functions
      if (!action) {
        const onsubmit = form.getAttribute('onsubmit');
        console.log('🔍 DEBUG: Form onsubmit attribute:', onsubmit);
        if (onsubmit && this.isServerFunction(onsubmit)) {
          action = onsubmit;
          console.log('🔍 DEBUG: Found server function in onsubmit:', action);
        }
      }
      
      console.log('🔍 DEBUG: Form submission - action found:', action);
      
      if (!action) {
        console.log('🔍 DEBUG: No action found, allowing normal form submission');
        return; // Let normal form submission happen
      }
      
      console.log('✅ INTERCEPTING FORM SUBMISSION FOR:', action);
      e.preventDefault();
      
      const formData = new FormData(form);

      // Use unified FormData conversion function
      const data = this.convertFormDataToObject(formData, 'form-intercept-submission');

      console.log('🔬 CRITICAL FIX: Enhanced FormData conversion result:', data);
      console.log('🔬 CRITICAL FIX: Data type check:', typeof data);

      // Additional debug for each field
      for (const [key, value] of Object.entries(data)) {
        console.log('DEBUG FIELD ' + key + ': type=' + typeof value + ', value=', value);
      }
      
      // Add hidden action field
      data._action = action;
      
      console.log('🔍 DEBUG: Form data extracted:', data);
      
      try {
        console.log('🚀 DEBUG: Calling server function:', action, 'with data:', data);
        const result = await this.call(action, data);
        console.log('✅ DEBUG: Form submission completed:', result);
        
        // Handle common responses
        if (result && result.success) {
          this.emit('formSuccess', { form, result, data });
          
          // Auto-refresh page if result indicates reload
          if (result.reload || result.refresh) {
            console.log('🔄 DEBUG: Reloading page as requested by server');
            setTimeout(() => this.reload(), 100);
          }
        }
      } catch (error) {
        console.error('❌ Form submission failed:', error);
        this.emit('formError', { form, error });
      }
    },
    
    // Link handling
    interceptLinks: function() {
      document.addEventListener('click', this.handleLinkClick.bind(this));
    },
    
    handleLinkClick: function(e) {
      const link = e.target.closest('a[data-action]');
      if (!link) return;
      
      e.preventDefault();
      
      const action = link.getAttribute('data-action');
      const data = this.parseDataAttributes(link);
      
      this.call(action, data).catch(error => {
        console.error('Link action failed:', error);
      });
    },
    
    // Event delegation for dynamic content
    setupEventDelegation: function() {
      document.addEventListener('click', this.handleDelegatedClick.bind(this));
      document.addEventListener('change', this.handleDelegatedChange.bind(this));
      document.addEventListener('input', this.handleDelegatedInput.bind(this));
    },
    
    handleDelegatedClick: async function(e) {
      const target = e.target;
      
      // Handle onclick attributes for server functions
      const onclick = target.getAttribute('onclick');
      if (onclick) {
        // Temporarily disable server function interception to debug
        console.log('🔍 Click detected on element with onclick:', onclick);
        console.log('🔍 Server functions type:', typeof this.serverFunctions, this.serverFunctions);
        
        try {
          console.log('🔧 About to call isServerFunction...');
          const isServer = this.isServerFunction(onclick);
          console.log('🔍 Is server function?', isServer, 'type:', typeof isServer);
          console.log('🔧 About to check if condition...');
          
          if (isServer === true) {
            console.log('✅ PREVENTING DEFAULT AND CALLING SERVER FUNCTION');
            e.preventDefault();
            console.log('🔧 About to call executeServerFunction with:', onclick, target);
            await this.executeServerFunction(onclick, target);
            console.log('✅ SERVER FUNCTION CALL COMPLETED');
          } else {
            console.log('❌ NOT A SERVER FUNCTION:', isServer, 'type:', typeof isServer);
          }
          
          console.log('🔧 Finished if/else block');
        } catch (error) {
          console.error('🚫 Error in server function check:', error);
          console.error('🚫 Error stack:', error.stack);
        }
      }
    },
    
    handleDelegatedChange: function(e) {
      this.emit('change', { target: e.target, value: e.target.value });
    },
    
    handleDelegatedInput: function(e) {
      this.emit('input', { target: e.target, value: e.target.value });
    },
    
    // Utility methods
    isServerFunction: function(code) {
      // Only intercept functions that are in the server functions manifest
      // This provides precise mapping between client calls and server functions
      
      console.log('🔍 DEBUG: isServerFunction called with code:', code);
      console.log('🔍 DEBUG: Server functions type:', typeof this.serverFunctions);
      console.log('🔍 DEBUG: Component functions type:', typeof this.componentFunctions);
      
      // Check if it's a function call pattern (with or without parentheses)
      // Allow: "functionName", "functionName()", "Component.functionName", "Component.functionName()"
      // Double-escaped for template literal generation
      if (!/^[\\w.]+\\s*(?:\\([^)]*\\))?\\s*$/.test(code.trim())) {
        console.log('🔍 DEBUG: Code does not match function pattern:', code.trim());
        return false;
      }
      
      // Extract function name (including component names with dots)  
      // Double-escaped for template literal generation
      const match = code.match(/^([\\w.]+)\\s*(?:\\(|$)/);
      if (!match) {
        console.log('🔍 DEBUG: Could not extract function name from:', code);
        return false;
      }
      
      const functionName = match[1];
      console.log('🔍 DEBUG: Extracted function name:', functionName);
      
      // Check if this function is in the server functions manifest
      const isInServerFunctions = (this.serverFunctions instanceof Map) ? 
        this.serverFunctions.has(functionName) : 
        Array.isArray(this.serverFunctions) && this.serverFunctions.includes(functionName);
      
      console.log('🔍 DEBUG: Server functions check - isMap:', (this.serverFunctions instanceof Map), 
                  'isArray:', Array.isArray(this.serverFunctions), 'includes:', isInServerFunctions);
      
      // For component functions, we need to handle name mapping:
      // HTML uses: "Component.functionName" 
      // Registration uses: "Component.Component_functionName"
      let isInComponentFunctions = false;
      if (this.componentFunctions instanceof Map) {
        // First try exact match
        isInComponentFunctions = this.componentFunctions.has(functionName);
        console.log('🔍 DEBUG: Exact component function match:', isInComponentFunctions);
        
        // If not found and contains a dot (component function), try the mapped name
        if (!isInComponentFunctions && functionName.includes('.')) {
          const parts = functionName.split('.');
          if (parts.length === 2) {
            const [componentName, funcName] = parts;
            const mappedName = componentName + '.' + componentName + '_' + funcName;
            console.log('🔍 DEBUG: Trying mapped component function name: "' + functionName + '" → "' + mappedName + '"');
            isInComponentFunctions = this.componentFunctions.has(mappedName);
            console.log('🔍 DEBUG: Mapped component function match:', isInComponentFunctions);
          }
        }
      } else if (Array.isArray(this.componentFunctions)) {
        isInComponentFunctions = this.componentFunctions.includes(functionName);
        console.log('🔍 DEBUG: Array component function check:', isInComponentFunctions);
      }
      
      const result = isInServerFunctions || isInComponentFunctions;
      console.log('🔍 DEBUG: Function "' + functionName + '" recognition result:', {
        isInServerFunctions: isInServerFunctions,
        isInComponentFunctions: isInComponentFunctions,
        finalResult: result
      });
      
      return result;
    },
    
    executeServerFunction: async function(code, element) {
      // Handle both "functionName" and "functionName(args)" patterns
      let functionName, argsStr = '';
      
      // Pattern 1: "functionName(args)" 
      // Double-escaped for template literal generation
      const matchWithArgs = code.match(/^([\\w.]+)\\s*\\(([^)]*)\\)\\s*$/);
      if (matchWithArgs) {
        [, functionName, argsStr] = matchWithArgs;
      } else {
        // Pattern 2: "functionName" (no parentheses)
        // Double-escaped for template literal generation
        const matchNoArgs = code.match(/^([\\w.]+)\\s*$/);
        if (!matchNoArgs) return;
        [, functionName] = matchNoArgs;
      }
      
      let args = {};
      
      if (argsStr.trim()) {
        try {
          // Simple argument parsing - enhance as needed
          args = JSON.parse('{' + argsStr + '}');
        } catch (e) {
          console.warn('Failed to parse function arguments:', argsStr);
        }
      }
      
      // Add element data attributes
      const elementData = this.parseDataAttributes(element);
      args = Object.assign(elementData, args);
      
      console.log('🚀 EXECUTING SERVER FUNCTION:', functionName, 'with args:', args);
      await this.call(functionName, args);
    },
    
    parseDataAttributes: function(element) {
      const data = {};
      
      for (const attr of element.attributes) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-action') {
          const key = attr.name.slice(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          data[key] = attr.value;
        }
      }
      
      return data;
    },

    // Smart DOM diffing algorithm to prevent blink on updates
    diffAndUpdateDOM: function(container, newHtml) {
      // Preserve scroll position of the container and its scrollable children
      const scrollStates = this.preserveScrollPositions(container);

      // Create a temporary element to parse the new HTML
      const temp = document.createElement('div');
      temp.innerHTML = newHtml;

      // Perform smart diffing on the container
      this.diffNodes(container, temp);

      // Restore scroll positions after DOM update
      this.restoreScrollPositions(container, scrollStates);
    },

    preserveScrollPositions: function(container) {
      const scrollStates = new Map();

      // Preserve container's scroll position
      if (container && typeof container.scrollHeight === 'number' && typeof container.clientHeight === 'number') {
        if (container.scrollHeight > container.clientHeight || container.scrollWidth > container.clientWidth) {
          scrollStates.set(container, {
            scrollTop: container.scrollTop,
            scrollLeft: container.scrollLeft
          });
        }
      }

      // Preserve scroll positions of scrollable descendants
      if (container && container.querySelectorAll) {
        const scrollableElements = container.querySelectorAll('*');
        for (const element of scrollableElements) {
          if (element && typeof element.scrollHeight === 'number' && typeof element.clientHeight === 'number') {
            if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
              // Generate a stable selector for this element
              const selector = this.generateElementSelector(element);
              scrollStates.set(selector, {
                scrollTop: element.scrollTop,
                scrollLeft: element.scrollLeft
              });
            }
          }
        }
      }

      return scrollStates;
    },

    restoreScrollPositions: function(container, scrollStates) {
      // Restore container scroll position
      if (scrollStates.has(container)) {
        const state = scrollStates.get(container);
        container.scrollTop = state.scrollTop;
        container.scrollLeft = state.scrollLeft;
      }

      // Restore descendant scroll positions
      for (const [selector, state] of scrollStates) {
        if (typeof selector === 'string') {
          const element = container.querySelector(selector);
          if (element) {
            element.scrollTop = state.scrollTop;
            element.scrollLeft = state.scrollLeft;
          }
        }
      }
    },

    // Re-initialize scripts in updated content area
    reinitializeScripts: function(contentArea) {
      // Find and re-execute client-side scripts in the updated area
      const scripts = contentArea.querySelectorAll('script');
      scripts.forEach(script => {
        if (!script.src) {
          // Inline script - re-execute
          try {
            const code = script.textContent || script.innerHTML;
            if (code && !script.hasAttribute('data-puremix-executed')) {
              // Create isolated execution context
              new Function(code)();
              script.setAttribute('data-puremix-executed', 'true');
            }
          } catch (error) {
            console.warn('Script re-initialization failed:', error);
          }
        }
      });

      // Re-initialize form event handlers for new forms
      const forms = contentArea.querySelectorAll('form');
      forms.forEach(form => {
        // Remove old handlers and add new ones
        form.removeEventListener('submit', this.handleFormSubmit);
      });

      console.log('✅ Scripts re-initialized in updated content area');
    },

    generateElementSelector: function(element) {
      // Generate a stable selector based on element hierarchy and classes
      const path = [];
      let current = element;

      while (current && current !== document.body && path.length < 5) {
        let selector = current.tagName.toLowerCase();

        // Add ID if available
        if (current.id) {
          selector += '#' + current.id;
          path.unshift(selector);
          break; // ID is unique enough
        }

        // Add classes if available
        if (current.className && typeof current.className === 'string') {
          const classes = current.className.trim().split(/\s+/).slice(0, 2); // Use first 2 classes
          if (classes.length > 0 && classes[0]) {
            selector += '.' + classes.join('.');
          }
        }

        // Add nth-child if we need more specificity
        const siblings = Array.from(current.parentNode?.children || []);
        const index = siblings.indexOf(current);
        if (siblings.length > 1 && index >= 0) {
          selector += ':nth-child(' + (index + 1) + ')';
        }

        path.unshift(selector);
        current = current.parentNode;
      }

      return path.join(' > ');
    },

    diffNodes: function(oldNode, newNode) {
      // Get children arrays
      const oldChildren = Array.from(oldNode.childNodes);
      const newChildren = Array.from(newNode.childNodes);

      // Process all new children
      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i];
        const oldChild = oldChildren[i];

        if (!oldChild) {
          // New node - append it
          oldNode.appendChild(newChild.cloneNode(true));
        } else if (this.nodesAreDifferent(oldChild, newChild)) {
          // Nodes are different - replace
          oldNode.replaceChild(newChild.cloneNode(true), oldChild);
        } else if (newChild.nodeType === Node.ELEMENT_NODE) {
          // Same element type - check attributes and recurse
          this.syncAttributes(oldChild, newChild);
          this.diffNodes(oldChild, newChild);
        } else if (newChild.nodeType === Node.TEXT_NODE && oldChild.textContent !== newChild.textContent) {
          // Text content changed
          oldChild.textContent = newChild.textContent;
        }
      }

      // Remove any extra old children
      while (oldNode.childNodes.length > newChildren.length) {
        oldNode.removeChild(oldNode.lastChild);
      }
    },

    nodesAreDifferent: function(oldNode, newNode) {
      // Different node types
      if (oldNode.nodeType !== newNode.nodeType) return true;

      // Different tag names for elements
      if (oldNode.nodeType === Node.ELEMENT_NODE) {
        if (oldNode.tagName !== newNode.tagName) return true;

        // Check for key attributes that indicate different content
        const oldKey = oldNode.getAttribute('data-component-key') || oldNode.getAttribute('key');
        const newKey = newNode.getAttribute('data-component-key') || newNode.getAttribute('key');
        if (oldKey !== newKey) return true;
      }

      return false;
    },

    syncAttributes: function(oldElement, newElement) {
      // Preserve user input state for form elements
      const isFormElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(oldElement.tagName);
      const wasElementFocused = document.activeElement === oldElement;
      const oldValue = isFormElement ? oldElement.value : null;
      const oldSelectionStart = isFormElement && oldElement.selectionStart;
      const oldSelectionEnd = isFormElement && oldElement.selectionEnd;

      // Remove attributes that are no longer present
      const oldAttrs = Array.from(oldElement.attributes);
      for (const attr of oldAttrs) {
        if (!newElement.hasAttribute(attr.name)) {
          oldElement.removeAttribute(attr.name);
        }
      }

      // Add/update attributes from new element
      const newAttrs = Array.from(newElement.attributes);
      for (const attr of newAttrs) {
        if (oldElement.getAttribute(attr.name) !== attr.value) {
          oldElement.setAttribute(attr.name, attr.value);
        }
      }

      // Restore user input state if element had user interaction
      if (isFormElement && oldValue !== null) {
        // Only preserve user input if the element had focus or different value than default
        const defaultValue = newElement.getAttribute('value') || '';
        if (wasElementFocused || oldValue !== defaultValue) {
          oldElement.value = oldValue;

          // Restore cursor position
          if (wasElementFocused && oldSelectionStart !== null) {
            oldElement.focus();
            oldElement.setSelectionRange(oldSelectionStart, oldSelectionEnd);
          }
        }
      }
    },
    
    // Component initialization
    initializeComponents: function() {
      // Auto-initialize components with data-component attribute
      this.$('[data-component]').each(function(element) {
        const componentName = element.getAttribute('data-component');
        const componentData = PureMix.parseDataAttributes(element);
        
        PureMix.emit('componentInit', {
          name: componentName,
          element: element,
          data: componentData
        });
      });
    },
    
    // Development tools
    setupDevTools: function() {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // Add debug methods to global scope in development
        window.PureMixDebug = {
          data: () => this.data,
          state: () => this.state,
          events: () => this.events,
          reload: () => this.reload(),
          call: (fn, data) => this.call(fn, data)
        };
        
        console.log('🔧 PureMix Debug tools available at window.PureMixDebug');
      }
    },

    // Simplified aggressive auto-conversion for all form data
    autoConvertValue: function(value) {
      // Handle non-string values (File objects, etc.)
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();

      // Empty strings stay empty strings
      if (trimmed === '') {
        return value;
      }

      // Boolean conversion
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;

      // Numeric conversion - simple and aggressive
      if (this.isNumericString(trimmed)) {
        const parsed = parseFloat(trimmed);
        if (!isNaN(parsed) && isFinite(parsed)) {
          // Return integer if no decimal point
          return trimmed.indexOf('.') === -1 ? parseInt(trimmed, 10) : parsed;
        }
      }

      // Keep as string if no conversion applies
      return value;
    },

    isNumericString: function(str) {
      // Character-by-character validation (avoiding regex per user warning)
      let hasDigit = false;
      let hasDot = false;

      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const charCode = char.charCodeAt(0);

        if (charCode >= 48 && charCode <= 57) { // 0-9
          hasDigit = true;
        } else if (char === '.') {
          if (hasDot) return false; // Multiple dots
          hasDot = true;
        } else if (char === '-' && i === 0) {
          // Allow minus sign at beginning
          continue;
        } else {
          return false; // Invalid character
        }
      }

      return hasDigit; // Must have at least one digit
    },

    // UNIFIED FormData conversion function to consolidate scattered logic
    convertFormDataToObject: function(formData, debugContext) {
      debugContext = debugContext || 'unknown';
      console.log('🔄 UNIFIED CONVERSION START [' + debugContext + ']:', formData);
      console.log('🔄 FormData type:', typeof formData);
      console.log('🔄 FormData instanceof FormData:', formData instanceof FormData);

      if (!(formData instanceof FormData)) {
        console.error('🚨 ERROR: Expected FormData, got ' + typeof formData + ':', formData);
        return formData; // Return as-is if not FormData
      }

      const result = {};

      console.log('🔄 Processing FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log('🔄   Processing key: "' + key + '", value:', value, '(type: ' + typeof value + ')');

        if (value instanceof File) {
          // Keep file objects as-is
          result[key] = value;
          console.log('🔄   → Kept as File:', value.name);
        } else {
          // Convert string values with intelligent type detection
          const stringValue = value.toString();
          console.log('🔄   → String value: "' + stringValue + '"');

          const convertedValue = this.autoConvertValue(stringValue);
          result[key] = convertedValue;

          console.log('🔄   → Converted to:', convertedValue, '(type: ' + typeof convertedValue + ')');

          // Debug the conversion
          if (convertedValue !== stringValue) {
            console.log('🔢 AUTO-CONVERTED ' + key + ': "' + stringValue + '" → ' + convertedValue + ' (' + typeof convertedValue + ')');
          }
        }
      }

      console.log('🔄 UNIFIED CONVERSION RESULT [' + debugContext + ']:', result);
      console.log('🔄 Result type:', typeof result);
      console.log('🔄 Result stringified:', JSON.stringify(result));

      return result;
    }
  });
  
  // PureMix Elements Collection
  function PureMixElements(elements) {
    this.elements = elements;
    this.length = elements.length;
  }
  
  PureMixElements.prototype = {
    // Iteration
    each: function(callback) {
      this.elements.forEach((element, index) => {
        callback.call(element, element, index);
      });
      return this;
    },
    
    // DOM manipulation
    html: function(content) {
      if (content === undefined) {
        return this.elements[0] ? this.elements[0].innerHTML : '';
      }
      this.elements.forEach(el => el.innerHTML = content);
      return this;
    },
    
    text: function(content) {
      if (content === undefined) {
        return this.elements[0] ? this.elements[0].textContent : '';
      }
      this.elements.forEach(el => el.textContent = content);
      return this;
    },
    
    val: function(value) {
      if (value === undefined) {
        return this.elements[0] ? this.elements[0].value : '';
      }
      this.elements.forEach(el => el.value = value);
      return this;
    },
    
    // CSS and styling
    addClass: function(className) {
      this.elements.forEach(el => el.classList.add(className));
      return this;
    },
    
    removeClass: function(className) {
      this.elements.forEach(el => el.classList.remove(className));
      return this;
    },
    
    toggleClass: function(className) {
      this.elements.forEach(el => el.classList.toggle(className));
      return this;
    },
    
    hasClass: function(className) {
      return this.elements.some(el => el.classList.contains(className));
    },
    
    css: function(property, value) {
      if (value === undefined) {
        return this.elements[0] ? getComputedStyle(this.elements[0])[property] : '';
      }
      this.elements.forEach(el => el.style[property] = value);
      return this;
    },
    
    // Visibility
    show: function() {
      this.elements.forEach(el => {
        el.style.display = el.getAttribute('data-display') || '';
      });
      return this;
    },
    
    hide: function() {
      this.elements.forEach(el => {
        if (el.style.display !== 'none') {
          el.setAttribute('data-display', el.style.display);
        }
        el.style.display = 'none';
      });
      return this;
    },
    
    toggle: function() {
      this.elements.forEach(el => {
        if (el.style.display === 'none') {
          el.style.display = el.getAttribute('data-display') || '';
        } else {
          el.setAttribute('data-display', el.style.display);
          el.style.display = 'none';
        }
      });
      return this;
    },
    
    // Attributes
    attr: function(name, value) {
      if (value === undefined) {
        return this.elements[0] ? this.elements[0].getAttribute(name) : null;
      }
      this.elements.forEach(el => el.setAttribute(name, value));
      return this;
    },
    
    removeAttr: function(name) {
      this.elements.forEach(el => el.removeAttribute(name));
      return this;
    },
    
    // Events
    on: function(event, handler) {
      this.elements.forEach(el => el.addEventListener(event, handler));
      return this;
    },
    
    off: function(event, handler) {
      this.elements.forEach(el => el.removeEventListener(event, handler));
      return this;
    },
    
    trigger: function(event) {
      const customEvent = new CustomEvent(event);
      this.elements.forEach(el => el.dispatchEvent(customEvent));
      return this;
    },
    
    // Navigation
    find: function(selector) {
      const found = [];
      this.elements.forEach(el => {
        const matches = el.querySelectorAll(selector);
        found.push(...matches);
      });
      return new PureMixElements(found);
    },
    
    // Utilities
    first: function() {
      return new PureMixElements(this.elements.slice(0, 1));
    },
    
    last: function() {
      return new PureMixElements(this.elements.slice(-1));
    },
    
    eq: function(index) {
      return new PureMixElements([this.elements[index]].filter(Boolean));
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PureMix.init());
  } else {
    PureMix.init();
  }

})();
</script>
${clientScripts.map(script => `<script>\n${script}\n</script>`).join('\n')}`;
}

export default { generateClientRuntime };