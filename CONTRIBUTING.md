# Contributing to PureMix

Thank you for your interest in contributing to PureMix! This document provides guidelines for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (Node.js version, OS, Python version if applicable)
- **Code samples** (if possible, a minimal `.puremix` file that reproduces the issue)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Clear description** of the feature
- **Use cases** - why is this feature needed?
- **Potential implementation** approach (if you have ideas)
- **Examples** from other frameworks (if applicable)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test thoroughly** - ensure `npx tsc --noEmit` passes
4. **Update documentation** if you've changed APIs
5. **Write clear commit messages**
6. **Submit your pull request**

#### Pull Request Guidelines

- **One feature per PR** - keep changes focused
- **Test your changes** - add tests if applicable
- **Update CHANGELOG.md** - document your changes
- **Follow code style** - maintain consistency with existing code
- **Document new features** - update FRAMEWORK_GUIDE.md

## Development Setup

```bash
# Clone the repository
git clone https://github.com/tacho87/Puremix.git
cd Puremix

# Install dependencies
npm install

# Run TypeScript type checking
npx tsc --noEmit

# Test with the comprehensive test project
cd tests/projects/comprehensive-test/
npm install
npm run dev
```

## Project Structure

```
Puremix/
├── lib/              # Core framework code
│   ├── puremix-engine.ts
│   ├── puremix-interpreter.ts
│   ├── template-engine-interpreter.ts
│   ├── python-executor.ts
│   ├── file-parser.ts
│   └── ...
├── cli/              # CLI tools
│   ├── puremix.ts
│   ├── create.ts
│   ├── dev.ts
│   └── build.ts
├── templates/        # Project templates
│   ├── basic/
│   ├── minimal/
│   └── advanced/
├── plugins/          # Editor plugins
│   ├── vscode-puremix/
│   └── cursor-puremix/
├── docs/             # GitHub Pages documentation
├── tests/            # Test projects
└── CLAUDE.MD         # AI assistant guidance
```

## Coding Standards

### TypeScript
- Use TypeScript for all `.ts` files
- Maintain type safety - avoid `any` when possible
- Use interfaces for complex types
- Document public APIs with JSDoc comments

### Code Style
- 2 spaces for indentation
- Use single quotes for strings
- Semicolons required
- Use meaningful variable names
- Add comments for complex logic

### Documentation
- Update FRAMEWORK_GUIDE.md for new features
- Update CLAUDE.MD for framework architectural changes
- Add examples for new functionality
- Keep documentation clear and concise

## Areas for Contribution

### High Priority
- [ ] Unit tests for core modules
- [ ] Performance optimization
- [ ] Production build system
- [ ] Error boundary system
- [ ] Additional starter templates

### Medium Priority
- [ ] TypeScript support in loader functions
- [ ] Static site generation (SSG)
- [ ] Hot module replacement (HMR)
- [ ] Additional editor plugins (Sublime, Vim, etc.)
- [ ] Example projects

### Low Priority
- [ ] Component marketplace
- [ ] Python package management
- [ ] Additional ML library interfaces
- [ ] GraphQL integration
- [ ] WebSocket support

## Testing

### Running Tests
```bash
# Run integration tests
npm test

# Run verbose tests
npm run test:verbose

# Type check only
npx tsc --noEmit
```

### Writing Tests
- Add integration tests for new features
- Test edge cases
- Ensure tests are deterministic
- Use descriptive test names

## Commit Message Guidelines

Format: `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(python): add ES6 import syntax for Python modules
fix(template): resolve nested conditional rendering issue
docs(guide): add API versioning strategies section
```

## Documentation Standards

### FRAMEWORK_GUIDE.md
- Token-friendly for LLMs
- Clear code examples
- Progressive disclosure (simple → advanced)
- Real-world use cases

### CLAUDE.MD
- Framework architecture details
- Development guidelines
- Critical rules and patterns
- Implementation status

## Community

- **GitHub Discussions**: For questions and community interaction
- **Issues**: For bug reports and feature requests
- **Pull Requests**: For code contributions

## License

By contributing to PureMix, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with the `question` label, or start a discussion on GitHub Discussions.

Thank you for contributing to PureMix! 🎯
