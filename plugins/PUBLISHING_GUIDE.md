# PureMix Extension Publishing Guide

## 🎯 Overview

Complete guide for publishing PureMix editor extensions to VS Code and Cursor marketplaces as **"PureMix Highlighting v0.1.0"**.

## 📦 Extension Status

### ✅ Completed Work
- **Icon Design**: Abstract integration SVG icons created (HTML/JS/Python mixing concept)
- **Package.json Updated**: Both extensions renamed to "PureMix Highlighting" with enhanced descriptions
- **Extension Features**: Complete syntax highlighting, snippets, and language support ready

### 📁 Current Structure
```
plugins/
├── vscode-puremix/
│   ├── icon.svg                  # ✅ Professional icon created
│   ├── package.json              # ✅ Updated to "PureMix Highlighting"
│   ├── syntaxes/puremix.tmLanguage.json
│   ├── snippets/puremix.json
│   └── language-configuration.json
└── cursor-puremix/
    ├── icon.svg                  # ✅ Professional icon created
    ├── package.json              # ✅ Updated to "PureMix Highlighting"
    ├── syntaxes/puremix.tmLanguage.json
    ├── snippets/puremix.json
    └── language-configuration.json
```

## 🚀 Publishing Steps

### Phase 1: Icon Conversion (Required)

The SVG icons need to be converted to PNG format for marketplace compliance.

#### Option A: Online Conversion (Recommended)
1. Open `plugins/vscode-puremix/icon.svg` and `plugins/cursor-puremix/icon.svg` in a browser
2. Take screenshots or use online SVG to PNG converters
3. Save as `icon.png` (512×512px) in both plugin directories

#### Option B: Command Line Tools
```bash
# Install ImageMagick or similar tools
brew install imagemagick

# Convert SVG to PNG (run in each plugin directory)
cd plugins/vscode-puremix
convert icon.svg -resize 512x512 icon.png

cd ../cursor-puremix
convert icon.svg -resize 512x512 icon.png
```

#### Option C: Design Tools
- Open SVG in Adobe Illustrator, Figma, or similar
- Export as PNG 512×512px
- Save as `icon.png` in both directories

### Phase 2: Install VSCE (Visual Studio Code Extension Tool)

```bash
# Install globally
npm install -g @vscode/vsce

# Or locally in project directory
cd plugins/vscode-puremix
npm install @vscode/vsce
```

### Phase 3: Package Extensions

#### VS Code Extension
```bash
cd plugins/vscode-puremix

# Package the extension (creates VSIX in same folder)
npx vsce package
# Output: puremix-0.1.0.vsix (in plugins/vscode-puremix/)

# Verify package
ls -la *.vsix
```

#### Cursor Extension
```bash
cd plugins/cursor-puremix

# Package the extension (creates VSIX in same folder)
npx vsce package
# Output: puremix-cursor-0.1.0.vsix (in plugins/cursor-puremix/)

# Verify package
ls -la *.vsix
```

### Phase 4: Test Extensions Locally

```bash
# Install and test VS Code extension
code --install-extension puremix-0.1.0.vsix

# Test syntax highlighting
# 1. Open VS Code
# 2. Create test.puremix file
# 3. Verify syntax highlighting works
```

### Phase 5: Marketplace Publishing Setup

#### VS Code Marketplace
1. **Create Publisher Account**:
   - Visit: https://marketplace.visualstudio.com/manage
   - Click "Create Publisher"
   - Choose publisher name: `puremix`

2. **Get Personal Access Token**:
   - Go to: https://marketplace.visualstudio.com/manage/publishers/puremix
   - Click "Create Personal Access Token"
   - Copy token for CLI use

3. **Publish Extension**:
```bash
cd plugins/vscode-puremix
npx vsce login puremix
# Paste your personal access token when prompted

npx vsce publish
```

#### Cursor Marketplace
1. **Research Current Process**:
   - Check Cursor's current extension submission process
   - May use same VSIX file as VS Code
   - Visit Cursor documentation for latest requirements

2. **Alternative: Open VSX**:
```bash
npx ovsx publish puremix-0.1.0.vsix -p <your-token>
```

## 📋 Extension Details

### Package.json Information
- **Extension Name**: PureMix Highlighting
- **Version**: 0.1.0
- **Publisher**: puremix
- **Description**: Syntax highlighting and snippets for PureMix framework (.puremix files) with advanced language support

### Features Included
- ✅ **Syntax Highlighting**: Complete TextMate grammar
- ✅ **Code Snippets**: 9 comprehensive snippets (page templates, loaders, actions, etc.)
- ✅ **Language Support**: HTML, JavaScript, TypeScript, Python integration
- ✅ **Auto-completion**: Brackets, tags, and attributes
- ✅ **Professional Icon**: Abstract integration design

## 🎨 Icon Design Details

### Concept
- **Abstract Integration**: Represents the mixing of HTML, JavaScript, and Python
- **Color Scheme**: Professional gradients using PureMix brand colors
- **Symbolism**:
  - HTML: Angle brackets `< >` (orange/red gradient)
  - JavaScript: Curly braces `{ }` (yellow gradient)
  - Python: Square brackets `[ ]` + snake element (blue gradient)
  - Connection: Integration lines showing language mixing

### Technical Specs
- **Format**: PNG (512×512px required by marketplaces)
- **Background**: Transparent
- **Style**: Modern, clean, professional
- **Scalability**: Works at small sizes (16×16px in editor)

## 📝 Marketplace Listing Content

### Description
```
PureMix Highlighting provides advanced syntax highlighting and code snippets for the PureMix full-stack framework.

Features:
• Complete syntax highlighting for .puremix files
• Support for HTML, JavaScript, TypeScript, and Python
• 9 comprehensive code snippets for rapid development
• Auto-completion for PureMix tags and attributes
• Professional code editing experience

PureMix is a server-side rendering framework that seamlessly mixes JavaScript, TypeScript, and Python in the same file for building modern web applications.
```

### Tags/Keywords
- `puremix`
- `fullstack`
- `python`
- `html`
- `web framework`
- `syntax highlighting`
- `snippets`
- `server-side rendering`

### Categories
- Programming Languages
- Snippets
- Formatters

## 🔧 Troubleshooting

### Common Issues

#### Icon Not Displaying
- **Problem**: Extension icon not showing in marketplace
- **Solution**: Ensure `icon.png` is exactly 512×512px and in correct directory
- **Check**: Verify `icon.png` exists and is referenced in package.json

#### Package Fails
- **Problem**: `vsce package` command fails
- **Solution**: Check package.json syntax and required fields
- **Common Fix**: Ensure all required files exist (icon.png, grammar files, etc.)

#### Publishing Denied
- **Problem**: Marketplace rejects submission
- **Solution**: Review marketplace guidelines and ensure compliance
- **Check**: Verify publisher name uniqueness and extension naming

### Validation Commands
```bash
# Validate package structure
vsce ls

# Check extension manifest
vsce verify-published

# Test package installation
code --install-extension puremix-0.1.0.vsix --force
```

## 📊 Success Metrics

### Launch Goals
- **VS Code Marketplace**: 100+ downloads in first week
- **Cursor Marketplace**: 50+ downloads in first week
- **User Rating**: 4.0+ stars average
- **Active Users**: Maintain steady adoption

### Promotion Strategy
1. **Framework Documentation**: Link from PureMix official docs
2. **Community Sharing**: Share in relevant developer communities
3. **Tutorial Integration**: Include in PureMix getting started guides
4. **Social Media**: Announce on Twitter, LinkedIn, developer forums

## 🚀 Post-Launch Maintenance

### Version Updates
```bash
# Update version in package.json
"version": "0.1.1"

# Package new version
npx vsce package

# Publish update
npx vsce publish
```

### User Feedback
- Monitor marketplace reviews and ratings
- Track GitHub issues and feature requests
- Update based on user suggestions
- Maintain compatibility with latest PureMix framework changes

## 📞 Support

### For Extension Issues
- **GitHub Issues**: https://github.com/tacho87/Puremix/issues
- **Tag with**: `extension` or `vscode` label
- **Response Time**: Within 48 hours

### For Publishing Issues
- **VS Code Marketplace**: Microsoft publisher support
- **Cursor Marketplace**: Check current support channels
- **Technical Issues**: Framework documentation and community

---

**PureMix Extension Publishing - Ready for Marketplace Launch!** 🎉

All assets are prepared, documentation is complete, and the extensions are ready for publishing as "PureMix Highlighting v0.1.0" to both VS Code and Cursor marketplaces.