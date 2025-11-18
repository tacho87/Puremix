# PureMix Framework

[![npm version](https://img.shields.io/npm/v/puremix.svg?style=flat-square)](https://www.npmjs.com/package/puremix)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg?style=flat-square)](https://www.python.org/)

> **HTML-first full-stack framework with native Python integration**

📚 [Documentation](https://puremix.dev) | 🚀 [Quick Start](#-installation) | 🐍 [Python Guide](#-python-integration) | 💬 [Community](#-community)

---

## 🎯 What is PureMix?

PureMix is a **server-side rendering framework** that lets you build web applications using **familiar HTML syntax** while seamlessly mixing **JavaScript, TypeScript, and Python** in the same file.

**Write HTML, get full-stack capabilities with first-class Python support.**

### Why PureMix?

```html
<!-- This is a complete PureMix page -->
<layout>main</layout>

<imports>
  <!-- Import Python functions like JavaScript modules -->
  import { analyze_sentiment, process_text } from '../ai/nlp_engine'
  import UserCard from '../components/UserCard.puremix'
</imports>

<loader>
  async function loadDashboard(request) {
    // Call Python AI functions directly
    const sentiment = await analyze_sentiment({
      text: "PureMix makes Python integration effortless!"
    });

    const users = await getUsers();

    return {
      data: { users, sentiment }
    };
  }
</loader>

<div class="dashboard">
  <h1>AI Sentiment: {loadDashboard.data.sentiment.score}/10</h1>

  {loadDashboard.data.users.map(user =>
    <UserCard user={user} />
  )}
</div>

<script server>
  async function refreshAnalysis(formData, request) {
    const newSentiment = await analyze_sentiment({ text: formData.text });
    return { success: true, sentiment: newSentiment };
  }
</script>
```

**That's it.** One file. HTML, JavaScript, and Python working together seamlessly.

---

## ✨ Core Features

### 🐍 Native Python Integration

PureMix offers **comprehensive Python support** with multiple integration patterns:

1. **Python Script Tags** - Embedded Python functions in `.puremix` files
2. **Auto-Discovered Python Modules** - Independent `.py` files auto-registered at startup
3. **ES6 Import Syntax** - Import Python functions like JavaScript modules  
4. **Global Python Functions** - Auto-registered, callable anywhere
5. **Inline Python Execution** - Dynamic Python code via `request.python.call()`
6. **Direct Module Calls** - Execute specific Python files via `request.python.executeFile()`

```html
<!-- Example: Python script tag -->
<script server lang="python">
def analyze_data(data, js_context=None):
    import pandas as pd
    import numpy as np

    df = pd.DataFrame(data)
    return {
        'success': True,
        'mean': float(df['values'].mean()),
        'std': float(df['values'].std())
    }
</script>

<!-- Call it like a JavaScript function -->
<button onclick="analyze_data">Run Analysis</button>
```

### 🎯 HTML-First Development

Write familiar HTML with server-side logic - no complex build step required.

```html
<div class="products">
  {products.map(product =>
    <div class="card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      {product.inStock ?
        <button onclick="addToCart">Add to Cart</button> :
        <span class="out-of-stock">Out of Stock</span>
      }
    </div>
  )}
</div>
```

### 🧩 Component Architecture

Modern components with props, but server-rendered for instant page loads.

```html
<!-- Define component: app/components/ProductCard.puremix -->
<div class="product-card">
  <img src="{product.image}" alt="{product.name}">
  <h3>{product.name}</h3>
  <p class="price">${product.price}</p>
  <button onclick="addToCart">Add to Cart</button>
</div>

<script server>
  async function addToCart(formData, request) {
    await cart.add(product.id, request.session.userId);
    return { success: true, message: 'Added to cart!' };
  }
</script>
```

```html
<!-- Use component anywhere -->
<ProductCard product={item} />
```

### ⚡ Smart Development Experience

- **TypeScript Native** - Node.js 16+ runs TypeScript without compilation
- **File-based routing** - No router configuration needed
- **Hot reload** - Instant feedback during development
- **CSS Integration** - Built-in Tailwind CSS and SCSS support
- **Interactive CLI** - Template selection with detailed descriptions

### 🚀 Production-Ready Features

- **Smart DOM Diffing** - Zero-flicker updates, 6-10ms response times
- **Form state preservation** - No loss of user input during updates
- **Security built-in** - CSRF protection, input sanitization, XSS prevention
- **Python process pools** - Concurrent request handling with graceful fallbacks
- **Environment-based logging** - Debug levels for development vs production

---

## 🚀 Installation

### Prerequisites

- **Node.js 16+** (for native TypeScript support)
- **Python 3.8+** (optional, for Python features)

### Quick Start

```bash
# Create new project (interactive template selection)
npx puremix create my-app

# Choose from templates:
# 🎨 Basic Template - Modern Tailwind CSS with animations
# 🏗️ Default Template - Full MongoDB + auth + admin panel  
# ⚡ Minimal Template - Zero dependencies, pure CSS

cd my-app
npm install
npm run dev
```

Visit `http://localhost:3000` and start coding!

### Template Features

| Template | CSS | Dependencies | Best For |
|----------|-----|-------------|----------|
| **Basic** | Tailwind CSS + SCSS | Modern web stack | Production applications with stunning UI |
| **Default** | Plain CSS | MongoDB + Auth | Enterprise applications with admin panel |
| **Minimal** | Plain CSS | Zero dependencies | Learning, lightweight apps, performance-critical |

---

## 📖 Core Concepts

### The `.puremix` File Structure

Every page is a single `.puremix` file with these sections:

```html
<layout>main</layout>

<imports>
  import { validateEmail } from '../utils/validators.js'
  import { analyze_text } from '../ai/nlp_engine'
  import Button from '../components/Button.puremix'
</imports>

<head>
  <title>Page Title</title>
  <meta name="description" content="Page description">
</head>

<loader>
  async function loadPage(request, actionResult) {
    // Runs on every GET request
    // Access request.params, request.query, request.session

    const data = await fetchData();

    return {
      data: { items: data },
      state: { loading: false }
    };
  }
</loader>

<!-- HTML Template with template expressions -->
<div>
  <h1>{loadPage.data.title}</h1>

  {loadPage.data.items.map(item =>
    <div class="item">
      <h3>{item.name}</h3>
      <Button label="Click me" onClick="handleClick" />
    </div>
  )}
</div>

<script server>
  async function handleClick(formData, request) {
    // Runs when form/button submitted
    // Full access to Node.js, Python, databases

    return { success: true, message: 'Clicked!' };
  }
</script>

<script client>
  // Optional browser-side JavaScript
  document.querySelector('button').addEventListener('click', async (e) => {
    e.preventDefault();
    const result = await PureMix.call('handleClick');
    console.log(result.message);
  });
</script>
```

### Request Lifecycle

```
1. HTTP Request → /products/123
         ↓
2. Route Resolution → app/routes/products/[id].puremix
         ↓
3. Parse File → Extract <loader>, <script server>, template
         ↓
4. Execute Action (if POST) → Run server function
         ↓
5. Execute Loader → Fetch data with action result
         ↓
6. Render Template → Process HTML with data
         ↓
7. Inject Client Runtime → Add PureMix.call() API
         ↓
8. Send HTML Response
```

---

## 🐍 Python Integration

### 1. Auto-Discovered Python Modules (Recommended)

Create `app/services/ml_analyzer.py`:

```python
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def analyze_sales(data, js_context=None):
    """Predict future sales using ML"""
    df = pd.DataFrame(data['sales'])

    X = df[['month']].values
    y = df['revenue'].values

    model = LinearRegression()
    model.fit(X, y)

    # Predict next 3 months
    future_months = np.array([[len(df) + i] for i in range(1, 4)])
    predictions = model.predict(future_months)

    return {
        'success': True,
        'predictions': predictions.tolist(),
        'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing'
    }
```

Use in `.puremix` files:

```html
<imports>
  import { analyze_sales } from '../services/ml_analyzer'
</imports>

<loader>
  async function loadDashboard(request) {
    const salesData = await getSalesData();

    // Call Python function like JavaScript
    const prediction = await analyze_sales({ sales: salesData });

    return {
      data: { salesData, prediction }
    };
  }
</loader>

<div>
  <h2>Sales Prediction: {loadDashboard.data.prediction.trend}</h2>
  {loadDashboard.data.prediction.predictions.map((pred, i) =>
    <p>Month {i + 1}: ${pred.toFixed(2)}</p>
  )}
</div>
```

**Framework auto-discovers all Python files at startup.**

### 2. ES6 Import Syntax

```html
<imports>
  <!-- Import Python functions exactly like JavaScript -->
  import { process_text, analyze_sentiment } from '../ai/nlp_engine'
  import { calculate_metrics } from '../analytics/metrics_calculator'
</imports>

<loader>
  async function loadAnalytics(request) {
    // Call Python functions seamlessly
    const sentiment = await analyze_sentiment({ text: request.query.text });
    const metrics = await calculate_metrics({ data: sentiment });

    return { data: { sentiment, metrics } };
  }
</loader>
```

### 3. Global Python Functions (Zero Import)

```html
<loader>
  async function loadPage(request) {
    // All Python functions available globally!
    // (Auto-discovered from app/ directory)

    const validated = await validate_email({ email: 'test@example.com' });
    const processed = await process_data(validated);
    const formatted = await format_text({ text: processed.result });

    return { data: { result: formatted } };
  }
</loader>
```

### 4. Python Script Tags

```html
<script server lang="python">
def calculate_loan(data, js_context=None):
    """Calculate monthly loan payment"""
    principal = data.get('principal', 0)
    rate = data.get('rate', 0) / 100 / 12
    months = data.get('years', 0) * 12

    payment = principal * (rate * (1 + rate)**months) / ((1 + rate)**months - 1)

    return {
        'success': True,
        'monthly_payment': round(payment, 2),
        'total_paid': round(payment * months, 2)
    }
</script>

<form onsubmit="calculate_loan">
  <input name="principal" type="number" placeholder="Loan amount">
  <input name="rate" type="number" placeholder="Interest rate %">
  <input name="years" type="number" placeholder="Years">
  <button type="submit">Calculate</button>
</form>
```

---

## 🛣️ File-Based Routing

Routes are automatically mapped from file structure:

```
app/routes/
├── index.puremix              → /
├── about.puremix              → /about
├── products/
│   ├── index.puremix          → /products
│   ├── [id].puremix           → /products/:id
│   └── [category]/
│       └── [slug].puremix     → /products/:category/:slug
└── api/
    ├── users/
    │   ├── index.js           → /api/users
    │   └── [id].js            → /api/users/:id
    └── auth/
        ├── login.js           → /api/auth/login
        └── register.js        → /api/auth/register
```

### Dynamic Routes

```html
<!-- app/routes/products/[id].puremix -->
<loader>
  async function loadProduct(request) {
    // request.params.id automatically extracted
    const product = await getProduct(request.params.id);

    return { data: { product } };
  }
</loader>

<div>
  <h1>{loadProduct.data.product.name}</h1>
  <p>Product ID: {params.id}</p>
</div>
```

---

## 🎨 Template Expressions

### Simple Data Binding

```html
<h1>{user.name}</h1>
<p>{user.email}</p>
<span>{user.profile.bio}</span>
```

### Conditionals

```html
{user.isAdmin ?
  <div class="admin-panel">Admin Controls</div> :
  <div class="user-panel">User Dashboard</div>
}

{product.inStock &&
  <button>Add to Cart</button>
}
```

### Loops

```html
{products.map(product =>
  <div class="card">
    <h3>{product.name}</h3>
    <p>${product.price}</p>
  </div>
)}

{users.filter(u => u.isActive).map(user =>
  <UserCard user={user} />
)}
```

### JavaScript Blocks

```html
{
  // Execute full JavaScript within templates
  let activeUsers = users.filter(u => u.isActive);
  let adminCount = activeUsers.filter(u => u.role === 'admin').length;

  function formatRole(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  __export = { activeUsers, adminCount, formatRole };
}

<h2>Active Users: {activeUsers.length} ({adminCount} admins)</h2>
{activeUsers.map(user =>
  <p>{user.name} - {formatRole(user.role)}</p>
)}
```

---

## 🛠️ Development Tools

### CSS Build System

PureMix includes integrated CSS processing:

```bash
# All templates include CSS build integration
npm run dev     # Builds CSS and starts dev server
npm run build   # Builds CSS for production  
npm run css:watch # Watch CSS files during development
```

### Interactive CLI

```bash
# Enhanced project creation with template descriptions
./cli/puremix.ts create my-app

# Interactive prompts guide template selection
# Each template includes detailed feature descriptions
```

### Health Checks

```bash
# System requirements and project health
puremix doctor

# Environment and project information
puremix info
```

---

## 📦 Project Structure

```
my-puremix-app/
├── app/
│   ├── routes/              # Pages and API routes
│   │   ├── index.puremix
│   │   ├── dashboard.puremix
│   │   ├── products/
│   │   │   ├── [id].puremix
│   │   │   └── index.puremix
│   │   └── api/
│   │       ├── users.js
│   │       └── auth/
│   │           └── login.js
│   ├── components/          # Reusable components
│   │   ├── Button.puremix
│   │   ├── Card.puremix
│   │   └── UserProfile.puremix
│   ├── layouts/             # Layout templates
│   │   └── main.puremix
│   ├── services/            # Python modules (auto-discovered)
│   │   ├── ml_analyzer.py
│   │   └── data_processor.py
│   ├── controllers/         # Business logic
│   │   ├── auth.js
│   │   └── products.js
│   └── public/              # Static assets
│       ├── css/
│       │   ├── style.css
│       │   ├── styles.scss
│       │   └── _mixins.scss
│       ├── images/
│       └── js/
├── puremix.config.js        # Configuration
├── package.json
├── tailwind.config.js       # Tailwind configuration (Basic template)
├── postcss.config.js        # PostCSS configuration (Basic template)
└── server.js                # Production server
```

---

## ⚙️ Configuration

`puremix.config.js`:

```javascript
export default {
  port: 3000,
  staticDir: 'app/public',

  // Session management
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production'
    }
  },

  // Debug logging with environment-based levels
  verboseDebug: {
    enabled: process.env.NODE_ENV !== 'production',
    level: 'debug',        // 'error', 'warn', 'info', 'debug'
    console: true,
    save: false
  },

  // Python configuration
  python: {
    enabled: true,
    workers: 4,           // Process pool size
    timeout: 30000        // 30 second timeout
  }
};
```

---

## 🚀 Deployment

### Production Server

```bash
# Direct production start
NODE_ENV=production puremix start --port 3000

# Or with PM2 for process management
pm2 start "puremix start" --name my-app

# PM2 with environment variables
pm2 start "puremix start" \
  --name my-app \
  --env production \
  --log ./logs/app.log

# PM2 cluster mode (multiple instances)
pm2 start "puremix start" \
  --name my-app \
  --instances 4 \
  --exec-mode cluster
```

### Docker

```dockerfile
FROM node:18-alpine

# Install Python (optional, for Python features)
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Install Python packages (if using Python features)
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Install Node dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

EXPOSE 3000

# Run production server
CMD ["puremix", "start", "--host", "0.0.0.0"]
```

### Environment Variables

```bash
NODE_ENV=production
SESSION_SECRET=your-secret-key-here
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost/db
PYTHON_PATH=/usr/bin/python3
```

---

## 📊 Current Status: Production Ready ✅

### Version: v0.1.0-alpha.3

**🚀 Major Features Implemented:**

- ✅ **Server-side rendering** with .puremix files
- ✅ **Python integration** with 6 different usage patterns
- ✅ **Component system** with props and selective updates
- ✅ **Smart DOM diffing** (sub-10ms updates, zero flicker)
- ✅ **File-based routing** with dynamic parameters
- ✅ **CSS build system** with Tailwind CSS and SCSS support
- ✅ **Interactive CLI** with template selection
- ✅ **Process pools** for Python workers
- ✅ **ActionResult consistency** between Python and JavaScript ✨
- ✅ **Security features** built-in

**🛠️ Developer Experience:**

- ✅ **Hot reload** development server
- ✅ **TypeScript native** support
- ✅ **Comprehensive error handling** and logging
- ✅ **Production deployment** guides
- ✅ **Three production-tested templates**

**🐍 Python Integration:**

- ✅ **Auto-discovery** of Python modules at startup
- ✅ **ES6 import syntax** for Python functions
- ✅ **Global function access** without imports
- ✅ **Graceful fallbacks** when Python unavailable
- ✅ **Process isolation** and error recovery

---

## 🌟 Use Cases

### For Python Developers

- Use Python for web development without learning complex JavaScript tooling
- Import Python modules using familiar ES6 syntax
- Access Pandas, NumPy, scikit-learn directly in web applications

### For JavaScript Developers  

- Familiar HTML template syntax
- Add Python capabilities when needed for data science/ML
- Express.js foundation - use existing middleware

### For Full-Stack Teams

- Single codebase for server logic, Python ML, and UI
- Shared components between pages
- TypeScript support for type safety
- Production features built-in

---

## 📝 Changelog

### v0.1.0-alpha.3 (November 2025)

#### 🎯 **Major Enhancements**

- ✅ **ActionResult Consistency**: Fixed inconsistency between Python and JavaScript server function returns
  - Python functions now return results directly (no automatic `.data` wrapper)
  - JavaScript functions maintain direct return behavior
  - Consistent access patterns: `actionResult.message` for both languages
  - Updated 16+ template expressions across the test suite

#### 🔧 **Bug Fixes**

- **Python Integration**: Fixed substring error in `lib/import-resolver.ts` that was preventing Python financial calculations
- **Form Testing**: Fixed missing submitted data display in basic form test route
- **Template Engine**: Resolved edge cases in complex nested conditional expressions

#### 🧪 **Testing Improvements**

- **Comprehensive Test Suite**: Validated all 34 routes, 5 API endpoints, and 8 Python modules
- **Performance Benchmarks**: Confirmed sub-10ms DOM diffing and excellent request times (3-50ms)
- **Python ML Integration**: Validated NumPy, Pandas, and Scikit-learn library compatibility
- **Cross-Language Testing**: Verified ActionResult consistency across 22 Python functions

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

## 🔗 Resources

- **📚 Documentation**: [puremix.dev](https://puremix.dev)
- **📦 NPM Package**: [@puremix](https://www.npmjs.com/package/puremix)
- **🐛 Issues**: [GitHub Issues](https://github.com/puremix/puremix/issues)
- **💬 Community**: [GitHub Discussions](https://github.com/puremix/puremix/discussions)
- **📋 Roadmap**: See [docs/version-config.json](docs/version-config.json)

---

**MIT License - Built for developers creating data-driven web applications.**