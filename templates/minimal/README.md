# PureMix Minimal Template

The simplest possible PureMix starter template with no external dependencies. Perfect for learning PureMix or building lightweight applications.

## Features

- 🎯 **Zero Dependencies** - Only uses built-in CSS and HTML
- ⚡ **Ultra Lightweight** - Minimal footprint for maximum performance  
- 🧩 **Component Architecture** - Includes component examples with props
- 📱 **Responsive Design** - Mobile-first design that works everywhere
- 🏗️ **Clean Structure** - Well-organized codebase for easy customization

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Create a new project
npx puremix create my-app --template minimal
cd my-app

# Install dependencies (minimal!)
npm install

# Start development server
npm run dev

# Visit your app
open http://localhost:3000
```

## Project Structure

```
my-app/
├── app/
│   ├── routes/              # Page routes
│   │   ├── index.puremix   # Home page
│   │   ├── about.puremix   # About page  
│   │   └── contact.puremix # Contact page
│   ├── components/          # Reusable components
│   │   └── SimpleCard.puremix
│   ├── views/layouts/       # Layout templates
│   │   └── main.html       # Main layout
│   └── public/             # Static assets
│       └── css/
│           └── style.css   # Plain CSS styles
├── package.json            # Minimal dependencies
├── puremix.config.js       # Framework configuration
└── README.md
```

## Customization

### Styling

This template uses plain CSS with no frameworks. Customize styles in `app/public/css/style.css`:

```css
/* Add your custom styles here */
.my-component {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}
```

### Adding Pages

Create new routes by adding `.puremix` files to `app/routes/`:

```html
<layout>main</layout>

<head>
  <title>My New Page</title>
</head>

<loader>
  async function loadMyPage(request) {
    return {
      data: { message: 'Hello!' },
      state: { ready: true }
    };
  }
</loader>

<div class="fade-in">
  <h1>{loadMyPage.data.message}</h1>
</div>
```

### Creating Components

Add new components to `app/components/`:

```html
<loader>
  async function loadMyComponent(request, actionResult, props) {
    return {
      data: { title: props?.title || 'Default' },
      state: { active: true }
    };
  }
</loader>

<div class="card">
  <h3>{loadMyComponent.data.title}</h3>
  <button onclick="MyComponent.MyComponent_action">Click Me</button>
</div>

<script server>
  async function action(formData, request) {
    return { success: true };
  }
</script>
```

## Configuration

### Environment Variables

```env
NODE_ENV=development
LOG_LEVEL=info
SESSION_SECRET=your-secret-here
```

### PureMix Settings

Edit `puremix.config.js` for:

- Port configuration
- Session settings
- Logging options (minimal by default)
- Security settings

## Deployment

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

## Why Choose Minimal?

- **Learning**: Perfect for understanding PureMix without complexity
- **Performance**: Ultra-fast loading with zero external dependencies
- **Customization**: Clean foundation to build exactly what you need
- **Simplicity**: Focus on your content, not configuration

## Next Steps

- Explore the [Basic Template](../basic/) for Tailwind CSS integration
- Check out the [Advanced Template](../advanced/) for MongoDB and authentication
- Read the [PureMix Documentation](https://docs.puremix.dev)

## Support

- 📚 [Documentation](https://docs.puremix.dev)
- 🐛 [Report Issues](https://github.com/puremix/puremix/issues)
- 💬 [Community](https://discord.gg/puremix)

## License

MIT License - Perfect for any project!