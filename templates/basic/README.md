# PureMix Basic Template

A clean, modern starter template for PureMix applications featuring Tailwind CSS and component architecture.

## Features

- ✨ **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- 🧩 **Component Architecture** - Reusable components with props support
- 📱 **Responsive Design** - Mobile-first responsive layout
- 🎨 **Modern UI** - Clean, professional design with smooth animations
- 📝 **Contact Form** - Full-featured contact form with validation
- 🚀 **Production Ready** - Optimized for performance and SEO

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Create a new project:**
   ```bash
   npx puremix create my-app --template basic
   cd my-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Visit your app:**
   Open [http://localhost:3000](http://localhost:3000) to view your application.

## Project Structure

```
my-app/
├── app/
│   ├── routes/              # Page routes
│   │   ├── index.puremix   # Home page
│   │   ├── about.puremix   # About page
│   │   └── contact.puremix # Contact page
│   ├── components/          # Reusable components
│   │   ├── WelcomeCard.puremix
│   │   ├── FeatureCard.puremix
│   │   └── ContactForm.puremix
│   ├── views/layouts/       # Layout templates
│   │   └── main.html       # Main layout
│   └── public/             # Static assets
│       ├── css/
│       ├── js/
│       └── images/
├── package.json
├── puremix.config.js       # Framework configuration
├── tailwind.config.js      # Tailwind configuration
└── README.md
```

## Customization

### Styling

This template uses Tailwind CSS for styling. You can customize:

1. **Colors & Theme** - Edit `tailwind.config.js` to modify the design system
2. **Custom Components** - Add new component classes in `app/public/css/style.css`
3. **Layout** - Modify `app/views/layouts/main.html` for global changes

### Adding New Pages

1. Create a new `.puremix` file in `app/routes/`
2. Add the route structure:

```html
<layout>main</layout>

<head>
  <title>My New Page</title>
</head>

<loader>
  async function loadMyPage(request) {
    return {
      data: { message: 'Hello World' },
      state: { ready: true }
    };
  }
</loader>

<div class="animate-fade-in">
  <h1 class="text-4xl font-bold">{loadMyPage.data.message}</h1>
</div>
```

### Creating Components

1. Create a new `.puremix` file in `app/components/`
2. Use the component structure:

```html
<loader>
  async function loadMyComponent(request, actionResult, props) {
    return {
      data: { title: props?.title || 'Default Title' },
      state: { active: true }
    };
  }
</loader>

<div class="my-component">
  <h2>{loadMyComponent.data.title}</h2>
  <button onclick="MyComponent.MyComponent_doAction">Click Me</button>
</div>

<script server>
  async function doAction(formData, request) {
    return { success: true };
  }
</script>
```

3. Import and use in pages:

```html
<imports>
  import MyComponent from '../components/MyComponent.puremix'
</imports>

<MyComponent title="Custom Title" />
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
LOG_LEVEL=debug
PUREMIX_ENABLE_LOGS=true
SESSION_SECRET=your-secret-key-here
```

### PureMix Configuration

Edit `puremix.config.js` to customize:

- Port and host settings
- Session configuration  
- Debug logging options
- Python integration
- Security settings

## Deployment

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Setup

For production deployment:

1. Set `NODE_ENV=production`
2. Set `LOG_LEVEL=error` for minimal logging
3. Configure secure session secrets
4. Enable HTTPS and set security headers

## Learn More

- 📚 [PureMix Documentation](https://docs.puremix.dev)
- 🎯 [Component Guide](https://docs.puremix.dev/components)
- 🎨 [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- 💡 [Examples Repository](https://github.com/puremix/examples)

## Support

- 🐛 [Report Issues](https://github.com/puremix/puremix/issues)
- 💬 [Community Discord](https://discord.gg/puremix)
- 📧 [Email Support](mailto:support@puremix.dev)

## License

MIT License - see [LICENSE](LICENSE) file for details.