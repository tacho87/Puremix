# PureMix Extension for Visual Studio Code

Syntax highlighting, code snippets, and language support for PureMix framework `.puremix` files.

## Features

### Syntax Highlighting
- **PureMix-specific tags**: `<layout>`, `<head>`, `<loading>`, `<imports>`, `<loader>`
- **Script blocks**: `<script server>`, `<script client>`, `<script server lang="python">`
- **Template expressions**: `{variable}`, `{condition ? <div>yes</div> : <div>no</div>}`
- **Embedded languages**: JavaScript, Python, HTML

### Code Snippets
- `puremix-page` - Complete page template
- `loader` - Loader function
- `action` - Server action
- `python-server` - Python server function
- `puremix-component` - Reusable component
- `form-action` - Form with server action
- `script-client` - Client-side script
- `conditional` - Conditional rendering
- `map` - Map loop for lists
- `import` - Import statement

### IntelliSense
- Auto-closing tags for PureMix blocks
- Smart bracket matching
- Auto-indentation
- Comment support

## Installation

### From VSIX File (Local Development)
1. Download `puremix-0.1.0.vsix` from releases
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded file

### From Marketplace (Coming Soon)
```bash
code --install-extension puremix
```

## Usage

1. Create a new file with `.puremix` extension
2. Start typing `puremix-page` and press Tab
3. Enjoy syntax highlighting and IntelliSense!

## Example

```puremix
<layout>main</layout>

<loader>
  async function loadDashboard(request) {
    return {
      data: { title: "Dashboard" }
    };
  }
</loader>

<div>
  <h1>{loadDashboard.data.title}</h1>
</div>

<script server lang="python">
  def analyze_data(data, js_context=None):
    import pandas as pd
    return {'success': True}
</script>
```

## Development

### Building the Extension
```bash
npm install -g vsce
vsce package
```

### Testing Locally
1. Press `F5` in VS Code to open Extension Development Host
2. Create a `.puremix` file to test syntax highlighting

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the main repository.

## License

MIT License - see [LICENSE](../../LICENSE)

## Links

- [PureMix Framework](https://github.com/tacho87/Puremix)
- [Documentation](https://tacho87.github.io/Puremix)
- [Report Issues](https://github.com/tacho87/Puremix/issues)
