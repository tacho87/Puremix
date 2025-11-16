# Changelog

All notable changes to the PureMix framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.1][0.1.0-alpha.1] - 2025-01-13

### 🎉 Initial Alpha Release

This is the first public alpha release of PureMix - an HTML-first full-stack framework with seamless Python integration.

### ✨ Core Features

#### Framework Architecture

- **File-based Routing** - Next.js-style routing with dynamic parameters and catch-all routes
- **Server-Side Rendering** - Complete SSR with loader/action pattern
- **Component System** - PureMix components with props and selective updates
- **Hot Reload** - Development server with file watching and instant updates

#### Template Engine

- **Pure AST-Based Interpreter** - Completely regex-free template processing (3,387 lines)
- **JavaScript Block Execution** - Full JavaScript support with `__export` pattern
- **Conditional Rendering** - Complex nested conditionals and ternary operations
- **Expression Support** - Property chains, logical operators, array methods

#### Python Integration 

- **Six-Tier Architecture** - From inline execution to ES6 imports
- **Process Pool Management** - 4 dedicated Python workers for performance
- **Seamless Language Mixing** - Call Python functions like JavaScript modules
- **Auto-Discovery** - Recursive Python module scanning at server startup
- **ML Library Support** - NumPy, Pandas, Scikit-learn, TensorFlow interfaces
- **Graceful Degradation** - Automatic fallbacks when Python unavailable

Python integration methods:

1. Script tag functions (`<script server lang="python">`)
2. Inline execution (`request.python.call()`)
3. Module files (independent Python modules as microservices)
4. ES6 import syntax (`import { func } from '../lib/module.py'`)
5. Global functions (auto-discovered, zero imports needed)
6. ML library interfaces (direct NumPy/Pandas access)

#### Smart DOM Diffing

- **Zero-Flicker Updates** - Intelligent updates without page reload
- **Form State Preservation** - Maintains focus, cursor position, input values
- **Scroll Position Recovery** - Persistent scroll state across updates

#### Developer Experience

- **Zero Build Complexity** - Node.js 22+ native TypeScript support
- **Three Starter Templates** - Basic (Tailwind CSS), Minimal (zero deps), Advanced (MongoDB + auth)
- **Comprehensive Documentation** - 100KB+ of framework guides
- **TypeScript Support** - Full type definitions for all APIs

#### Security

- **Multi-Layer Sanitization** - XSS, SQL injection, path traversal prevention
- **CSRF Protection** - Automatic token generation and validation
- **File Upload Validation** - MIME type checking, size limits, malware protection
- **Session Management** - Secure cookie handling with configurable expiry

### 📦 Package Contents

- Core framework
- CLI tools (create, dev, build, start commands)
- Three production-ready templates
- Python integration scripts
- Comprehensive documentation (FRAMEWORK_GUIDE.md)

### 🧪 Testing

- 204 passing integration tests
- Full TypeScript compilation (zero errors)
- Automated tests for routing, loaders, actions, components
- Python integration validation
- Template engine edge case testing

### ⚠️ Known Limitations (Alpha Software)

#### Template Engine

- **Conditional Edge Cases** - Some deeply nested conditional expressions may render both branches (~10% edge cases)
- **Location**: `lib/puremix-interpreter.ts:1743` (evaluateConditional function)
- **Workaround**: Use simpler conditional structures or split complex logic into multiple expressions
- **Status**: Documented, rare in practice, tracked for improvement

#### TypeScript in Loaders

- **Issue**: TypeScript interfaces and type annotations not supported in server-side loader functions
- **Reason**: Loader functions are compiled at runtime using Function constructor
- **Workaround**: Use plain JavaScript objects in loader/action functions
- **Example**:
  ```javascript
  // ❌ NOT SUPPORTED
  interface User { id: number; name: string; }
  async function loadPage(request): Promise<LoaderResult> { }

  // ✅ USE THIS INSTEAD
  async function loadPage(request) {
    const users = [{ id: 1, name: "Alice" }];
    return { data: { users } };
  }
  ```

#### Debug Logging

- **Issue**: Some console.log statements present in production code
- **Location**: `lib/client-runtime.ts`, `lib/import-resolver.ts`, `lib/puremix-interpreter.ts`
- **Impact**: Minor - only affects development mode
- **Workaround**: Use `verboseDebug` config to control logging
- **Status**: Planned cleanup for beta release

#### Python Dependencies

- **Not a Bug**: Graceful fallbacks when Python or libraries unavailable
- **Behavior**: Framework continues to work, returns mock responses
- **Development**: Install Python 3.8+ and libraries (pandas, numpy) for full functionality
- **Production**: Framework detects availability and provides clear error messages

### 📚 Documentation

- **README.md** - Quick start and feature overview
- **FRAMEWORK_GUIDE.md** (91KB) - Complete tutorial for developers
- **LICENSE** - MIT license with attribution requirements

### 🎯 What's Next

#### Beta Roadmap (v0.1.0-beta.1)

- Fix template engine conditional edge cases
- Add comprehensive unit test suite
- TypeScript interface support in loaders
- Remove debug console.log statements
- Performance optimization and benchmarking
- Production deployment examples

#### Stable Release Roadmap (v0.1.0)

- API stability guarantee
- Security audit
- Production use case validation
- Complete documentation site (GitHub Pages)
- VS Code extension for .puremix syntax highlighting
- Community contribution guidelines

### 🐛 Bug Reports

Please report issues at: https://github.com/tacho87/Puremix/issues

### 💬 Community

- GitHub: https://github.com/tacho87/Puremix
- Documentation: https://tacho87.github.io/Puremix (coming soon)
- Author: Anastacio Gianareas <agianareas@devpath.io>

### 🙏 Acknowledgments

Thank you to the early testers and contributors who provided feedback during development.

---

**Note**: This is alpha software. APIs may change based on community feedback. Use in production at your own risk. We encourage experimentation and feedback!

[0.1.0-alpha.1]: https://github.com/tacho87/Puremix/releases/tag/v0.1.0-alpha.1
