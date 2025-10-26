# PureMix Framework

> **HTML-first full-stack web framework with seamless Python integration**

PureMix is a server-side rendering framework that lets you build modern web applications using familiar HTML syntax while seamlessly mixing JavaScript, TypeScript, and Python in your server-side logic.

## ✨ Features

- 🎯 **HTML-First Development** - Write familiar HTML with server-side logic
- 🧩 **Component Architecture** - React-style components with props and selective updates
- 🐍 **Python Integration** - Mix Python and JavaScript seamlessly in your server functions
- ⚡ **Zero Build Complexity** - No bundlers, no complex tooling - just pure development productivity
- 🔥 **Hot Reload** - Instant feedback during development with file watching
- 📱 **Responsive Templates** - Two beautiful starter templates (Tailwind CSS & Zero-dependency)
- 🛡️ **Production Ready** - Built-in security, logging, and performance optimizations

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+** (for native TypeScript support)
- **Python 3.8+** (optional, for Python integration features)

### Installation

```bash
# Install PureMix globally
npm install -g puremix

# Create a new project
puremix create my-app

# Choose your template:
# - basic: Beautiful Tailwind CSS with animations
# - minimal: Zero-dependency with custom CSS

cd my-app
npm run dev
```

### Your First Page

Create `app/routes/index.puremix`:

```html
<layout>main</layout>

<head>
  <title>My PureMix App</title>
</head>

<loader>
  async function loadHome(request) {
    return {
      data: { 
        message: 'Hello PureMix!',
        visitors: 42 
      }
    };
  }
</loader>

<div class="hero">
  <h1>{loadHome.data.message}</h1>
  <p>Visitors: {loadHome.data.visitors}</p>
  
  <form onsubmit="incrementVisitors">
    <button type="submit">Visit +1</button>
  </form>
</div>

<script server>
  async function incrementVisitors(formData, request) {
    // Server-side function automatically available to forms
    return {
      success: true,
      message: 'Visitor count updated!'
    };
  }
</script>
```

## 📖 Core Concepts

### `.puremix` File Structure

Every PureMix page is a `.puremix` file with these sections:

```html
<layout>main</layout>        <!-- Layout template -->
<imports>                    <!-- Import components/modules -->
  import MyCard from '../components/MyCard.puremix'
</imports>

<head>                       <!-- HTML head content -->
  <title>Page Title</title>
</head>

<loader>                     <!-- Server-side data loading -->
  async function loadPage(request, actionResult) {
    return { data: { users: await getUsers() } };
  }
</loader>

<!-- HTML Template with data binding -->
<div>
  <h1>{loadPage.data.title}</h1>
  {loadPage.data.users.map(user => 
    <MyCard user={user} key={user.id} />
  )}
</div>

<script server>              <!-- Server-side functions -->
  async function createUser(formData, request) {
    const user = await saveUser(formData);
    return { success: true, user };
  }
</script>

<script client>              <!-- Optional client-side JavaScript -->
  // Enhanced interactions without page reload
  document.querySelector('form').addEventListener('submit', async (e) => {
    const result = await PureMix.call('createUser', new FormData(e.target));
    // Update UI with result
  });
</script>
```

### Component System

Create reusable components in `app/components/`:

```html
<!-- app/components/UserCard.puremix -->
<div class="card">
  <h3>{user.name}</h3>
  <p>{user.email}</p>
  <button onclick="deleteUser">Delete</button>
</div>

<script server>
  async function deleteUser(formData, request) {
    await removeUser(request.params.userId);
    return { success: true, message: 'User deleted' };
  }
</script>
```

Use components with React-style props:

```html
<UserCard user={loadPage.data.user} theme="dark" />
```

### Python Integration

Mix Python seamlessly in your server functions:

```html
<script server>
  async function analyzeData(formData, request) {
    // This runs Python code!
    const result = await python`
      import pandas as pd
      import numpy as np
      
      # Access JavaScript data
      data = js_context['formData']
      df = pd.DataFrame(data)
      
      # Perform analysis
      analysis = {
        'mean': df['values'].mean(),
        'std': df['values'].std(),
        'predictions': model.predict(df[features]).tolist()
      }
      
      return analysis
    `;
    
    return { success: true, analysis: result };
  }
</script>
```

## 🎨 Starter Templates

### Basic Template
- **Tailwind CSS 3.4+** with stunning animations
- **Floating blob backgrounds** with color blending
- **Premium interactions** - hover effects, scale transforms
- **Production badge** and gradient text animations
- **Perfect for**: Modern apps requiring impressive visual impact

### Minimal Template  
- **Zero external dependencies** - pure CSS
- **Beautiful gradients** and smooth animations
- **Glassmorphism effects** and feature cards
- **Ultra-lightweight** - maximum performance
- **Perfect for**: Learning PureMix or lightweight applications

## 🛠️ CLI Commands

```bash
# Create new project
puremix create <project-name> [--template <basic|minimal>]

# Development server with hot reload  
puremix dev [--port 3000] [--host localhost]

# Production deployment
node server.js  # or your production server setup
```

## 📁 Project Structure

```
my-puremix-app/
├── app/
│   ├── routes/           # Pages (.puremix files)
│   │   ├── index.puremix
│   │   └── about.puremix
│   ├── components/       # Reusable components
│   │   └── Card.puremix
│   └── layouts/          # Layout templates
│       └── main.puremix
├── public/               # Static assets
│   ├── css/
│   └── images/
├── puremix.config.js     # Framework configuration
├── package.json
└── server.js             # Production server
```

## ⚙️ Configuration

Create `puremix.config.js`:

```javascript
export default {
  port: 3000,
  staticDir: 'public',
  
  // Debug logging
  verboseDebug: {
    enabled: true,
    level: 'info',
    console: true,
    save: false
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }
};
```

## 🚀 Deployment

### Production Server

```javascript
// server.js
import PureMixEngine from 'puremix/lib/puremix-engine.ts';
import express from 'express';

const app = express();
const config = await import('./puremix.config.js');

const pureMixEngine = new PureMixEngine(config.default);
await pureMixEngine.setupRoutes('./app');

app.use(pureMixEngine.middleware());
app.listen(3000, () => {
  console.log('🚀 PureMix app running on port 3000');
});
```

### Environment Variables

```bash
# Production
NODE_ENV=production
SESSION_SECRET=your-secret-key
PORT=3000

# Optional Python packages
PYTHON_PATH=/usr/bin/python3
```

### Docker Deployment

```dockerfile
FROM node:22-alpine
WORKDIR /app

# Install Python (optional)
RUN apk add --no-cache python3 py3-pip

COPY package*.json ./
RUN npm ci --production

COPY . .
EXPOSE 3000

CMD ["node", "server.js"]
```

## 🐍 Python Integration Setup

Install Python packages for data science features:

```bash
# Core data science stack
pip install pandas numpy scikit-learn

# Optional: Machine learning
pip install tensorflow pytorch

# Optional: Visualization  
pip install matplotlib seaborn plotly
```

Check Python integration:

```bash
python scripts/check_numpy.py
python scripts/check_pandas.py
python scripts/check_tensorflow.py
```

## 📚 Examples

### Form Handling with Validation

```html
<form onsubmit="submitForm">
  <input name="email" type="email" required>
  <input name="password" type="password" required>
  <button type="submit">Login</button>
</form>

<script server>
  async function submitForm(formData, request) {
    const { email, password } = formData;
    
    // Validation
    if (!email || !password) {
      return { success: false, error: 'Missing fields' };
    }
    
    // Authentication logic
    const user = await authenticateUser(email, password);
    if (user) {
      request.session.userId = user.id;
      return { success: true, redirect: '/dashboard' };
    }
    
    return { success: false, error: 'Invalid credentials' };
  }
</script>
```

### AJAX Updates Without Page Reload

```html
<div id="counter">Count: {loadPage.data.count}</div>
<button onclick="increment">+1</button>

<script server>
  async function increment(formData, request) {
    request.session.count = (request.session.count || 0) + 1;
    return { success: true, count: request.session.count };
  }
</script>

<script client>
  document.querySelector('button').addEventListener('click', async (e) => {
    e.preventDefault();
    const result = await PureMix.call('increment');
    if (result.success) {
      document.getElementById('counter').textContent = `Count: ${result.count}`;
    }
  });
</script>
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [Coming Soon]
- **Examples**: Check the `templates/` directory
- **Issues**: [GitHub Issues]
- **Community**: [Coming Soon]

---

**Built with ❤️ for developers who want to build modern web apps without the complexity.**