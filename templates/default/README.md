# PureMix Application

A minimal PureMix application with file-based routing and server-side rendering.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── routes/           # .puremix route files
│   └── index.puremix # Home page (/)
├── components/       # Reusable .puremix components
├── public/           # Static assets (CSS, images, JS)
├── views/            # Layout templates
│   └── layouts/
│       └── main.html # Main layout template
```

## Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run doctor` - Check framework health

## Documentation

- 📚 **FRAMEWORK_GUIDE.md** - Complete PureMix framework guide (linked from framework root)
- 📖 **PROJECT_STRUCTURE.md** - Detailed project organization guide

## Creating Routes

Add new .puremix files in `app/routes/`:

```html
<!-- app/routes/about.puremix -->
<layout>main</layout>

<loader>
  async function loadPage(request) {
    return {
      data: { title: 'About Us' }
    };
  }
</loader>

<div>
  <h1>{loadPage.data.title}</h1>
  <p>Welcome to our about page!</p>
</div>
```

This automatically creates the `/about` route.

## Creating Components

Add reusable components in `app/components/`:

```html
<!-- app/components/Card.puremix -->
<div class="card">
  <h3>{title}</h3>
  <p>{description}</p>
</div>
```

Use in routes:

```html
<imports>
  import Card from '../components/Card.puremix'
</imports>

<Card title="My Card" description="Card content" />
```

## Learn More

Visit [PureMix documentation](https://puremix.dev) to learn more about the framework.
