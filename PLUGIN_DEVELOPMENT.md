# Plugin Development Guide

Guide for creating editor plugins for PureMix `.puremix` files.

## Overview

PureMix plugins provide syntax highlighting, code snippets, and language support for `.puremix` files in various editors.

## Available Plugins

### VS Code Extension (`plugins/vscode-puremix/`)
Full-featured extension for Visual Studio Code with syntax highlighting, snippets, and IntelliSense.

### Cursor Extension (`plugins/cursor-puremix/`)
Fork of VS Code extension optimized for Cursor IDE.

## Installing Plugins Locally

### VS Code
```bash
cd plugins/vscode-puremix/

# Install dependencies (if any)
npm install

# Package the extension
npm install -g vsce
vsce package

# This creates: puremix-0.1.0.vsix

# Install in VS Code
code --install-extension puremix-0.1.0.vsix
```

### Cursor
```bash
cd plugins/cursor-puremix/
vsce package
# Install the .vsix file via Cursor's extension manager
```

## Testing During Development

### VS Code
1. Open `plugins/vscode-puremix/` in VS Code
2. Press `F5` to launch Extension Development Host
3. Create a test `.puremix` file
4. Verify syntax highlighting and snippets work

### Cursor
Same process as VS Code (Cursor is VS Code compatible)

## Plugin Architecture

### File Structure
```
plugins/vscode-puremix/
├── package.json              # Extension manifest
├── language-configuration.json # Brackets, comments, indentation
├── README.md                 # Extension documentation
├── syntaxes/
│   └── puremix.tmLanguage.json # Syntax grammar
└── snippets/
    └── puremix.json          # Code snippets
```

### Key Components

#### 1. Syntax Grammar (`syntaxes/puremix.tmLanguage.json`)
TextMate grammar defining syntax highlighting rules.

**Supported Patterns:**
- PureMix tags: `<layout>`, `<loader>`, `<imports>`, `<head>`, `<loading>`
- Script blocks: `<script server>`, `<script client>`, `<script server lang="python">`
- Template expressions: `{variable}`, `{condition ? <div>yes</div> : <div>no</div>}`
- Embedded languages: JavaScript, Python, HTML

#### 2. Language Configuration (`language-configuration.json`)
Defines editor behavior for .puremix files.

**Features:**
- Auto-closing brackets and quotes
- Comment toggling (// and /* */)
- Smart indentation
- Word boundaries
- Folding markers

#### 3. Snippets (`snippets/puremix.json`)
Pre-defined code templates activated with keyboard shortcuts.

**Available Snippets:**
- `puremix-page` - Complete page template
- `loader` - Loader function
- `action` - Server action
- `python-server` - Python server function
- `puremix-component` - Reusable component
- `form-action` - Form with action
- `script-client` - Client script
- `conditional` - Conditional rendering
- `map` - Map loop
- `import` - Import statement

## Creating New Plugins

### For Other Editors

#### JetBrains IDEs (WebStorm, PyCharm, etc.)
1. Create XML file in `.idea/` directory
2. Define file type association for `.puremix`
3. Create language injection rules for embedded JS/Python
4. Package as IntelliJ plugin

#### Sublime Text
1. Create `.sublime-syntax` file
2. Define syntax patterns using YAML
3. Create `.sublime-completions` for snippets
4. Package as Sublime package

#### Vim/Neovim
1. Create `syntax/puremix.vim` file
2. Define syntax rules using Vim script
3. Create `ftplugin/puremix.vim` for filetype settings
4. Distribute via vim-plug or other plugin managers

#### Emacs
1. Create `puremix-mode.el` file
2. Define major mode with `define-derived-mode`
3. Add syntax highlighting with `font-lock-keywords`
4. Distribute via MELPA

## Publishing Plugins

### VS Code Marketplace
```bash
# Login to publisher account
vsce login puremix

# Publish extension
cd plugins/vscode-puremix/
vsce publish
```

### Open VSX (VS Code alternative)
```bash
npx ovsx publish puremix-0.1.0.vsix -p <token>
```

### Cursor Marketplace
Follow Cursor's extension publishing guidelines (similar to VS Code)

## Contributing

### Improving Existing Plugins
1. Fork the repository
2. Make changes in `plugins/vscode-puremix/` or `plugins/cursor-puremix/`
3. Test thoroughly
4. Submit pull request

### Adding New Editor Support
1. Create new directory: `plugins/<editor-name>-puremix/`
2. Follow editor's plugin development guidelines
3. Ensure syntax highlighting for all PureMix features
4. Add to this documentation
5. Submit pull request

## Syntax Highlighting Requirements

All plugins should support:

### PureMix-Specific Tags
- `<layout>` - Layout inheritance
- `<head>` - HTML head content
- `<loading>` - Loading state content
- `<imports>` - Import statements
- `<loader>` - Server-side data loading

### Script Blocks
- `<script server>` - JavaScript server functions
- `<script client>` - Client-side JavaScript
- `<script server lang="python">` - Python server functions

### Template Syntax
- `{variable}` - Variable interpolation
- `{condition ? <div>yes</div> : <div>no</div>}` - Conditionals
- `{items.map(item => <li>{item}</li>)}` - Loops
- `{ /* JavaScript block */ }` - Multi-line JS

### Embedded Languages
- JavaScript (in `<imports>`, `<loader>`, `<script>`, template expressions)
- Python (in `<script server lang="python">`)
- HTML (template content)

## Testing Checklist

Before publishing a plugin, verify:

- [ ] `.puremix` files are recognized
- [ ] Syntax highlighting works for all PureMix tags
- [ ] JavaScript highlighting works in appropriate blocks
- [ ] Python highlighting works in `<script server lang="python">`
- [ ] HTML highlighting works in template content
- [ ] Template expressions `{}` are highlighted correctly
- [ ] Auto-closing brackets work
- [ ] Comment toggling works (// and /* */)
- [ ] Indentation is smart and correct
- [ ] Snippets trigger correctly
- [ ] No conflicts with other extensions

## Resources

- **PureMix Documentation**: https://tacho87.github.io/Puremix
- **Framework Guide**: [FRAMEWORK_GUIDE.md](./FRAMEWORK_GUIDE.md)
- **Report Issues**: https://github.com/tacho87/Puremix/issues

## Support

For plugin development questions:
- Open an issue: https://github.com/tacho87/Puremix/issues
- Tag with `plugin` label

## License

All plugins are released under MIT License. See [LICENSE](./LICENSE).
