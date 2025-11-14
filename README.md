# PureMix Framework

[![npm version](https://img.shields.io/npm/v/puremix.svg?style=flat-square)](https://www.npmjs.com/package/puremix)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg?style=flat-square)](https://www.python.org/)

> **Full-stack framework with native Python integration**

📚 [Documentation](https://tacho87.github.io/Puremix) | 🚀 [Quick Start](#-installation) | 🐍 [Python Guide](#-python-integration-6-ways) | 💬 [Community](https://github.com/tacho87/Puremix/discussions)

---

## 🎯 What is PureMix?

PureMix is a **server-side rendering framework** inspired by Remix, that lets you build web applications using **HTML syntax** while seamlessly mixing **JavaScript, TypeScript, and Python** in the same file.

**Remix-style loader/action pattern, with first-class Python support.**

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

PureMix offers **6 different ways** to use Python in your web applications:

1. **Python Script Tags** - Embedded Python functions in `.puremix` files
2. **Standalone Python Modules** - Independent `.py` files auto-discovered at startup
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

Write familiar HTML with server-side logic - no JSX, no build step required.

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

React-style components with props, but server-rendered for instant page loads.

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

### ⚡ Simple Development

- **Node.js 22+** runs TypeScript natively - no compilation step required
- **File-based routing** - no router configuration needed
- **Hot reload** during development - instant feedback
- **Loader/action pattern** inspired by Remix for data fetching and mutations

### 🚀 Smart DOM Diffing

Efficient updates without virtual DOM overhead:

- **Form state preservation** - no loss of user input during updates
- **Scroll position recovery** - maintains scroll position
- **Fast updates** - sub-10ms component updates
- **No visual flicker** - smooth transitions

### 🛡️ Production Features

- **Security** - CSRF protection, input sanitization, XSS prevention
- **Session management** - Built-in cookie and JWT support
- **Error handling** - Graceful degradation when Python unavailable
- **Process pools** - Python workers for concurrent request handling
- **Logging** - Environment-based debug levels

---

## 🚀 Installation

### Prerequisites

- **Node.js 22+** (for native TypeScript support)
- **Python 3.8+** (optional, for Python features)

### Quick Start

```bash
# Create new project
npx puremix create my-app

# Choose template:
# - default: Modern SSR application with routing
# - basic: Modern Tailwind CSS with animations
# - minimal: Zero dependencies, pure CSS

cd my-app
npm run dev
```

Visit `http://localhost:3000` and start coding!

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

<!-- HTML Template (supports JSX-like expressions) -->
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

**⚠️ Critical Concept:** Actions (server functions) return values that are passed to the loader as `actionResult`. When a form submits, the action runs first, then the loader re-executes with the action's result. This is the Remix-style pattern for handling mutations.

---

## 🐍 Python Integration (6 Ways)

### 1. Python Script Tags (Embedded Functions)

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

<!-- Use in forms -->
<form onsubmit="calculate_loan">
  <input name="principal" type="number" placeholder="Loan amount">
  <input name="rate" type="number" placeholder="Interest rate %">
  <input name="years" type="number" placeholder="Years">
  <button type="submit">Calculate</button>
</form>
```

### 2. Standalone Python Modules (Recommended)

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

### 3. ES6 Import Syntax

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

### 4. Global Python Functions (Zero Import)

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

### 5. Inline Python Execution (Dynamic Code)

```html
<loader>
  async function loadDashboard(request) {
    // Execute Python code on-the-fly
    const result = await request.python.call('analyze_custom', { data: [1, 2, 3] }, `
import numpy as np

def analyze_custom(data, js_context=None):
    arr = np.array(data['data'])
    return {
        'success': True,
        'mean': float(arr.mean()),
        'std': float(arr.std()),
        'sum': float(arr.sum())
    }
    `);

    return { data: { analysis: result } };
  }
</loader>
```

### 6. Direct Module Execution

```html
<loader>
  async function loadFinancialReport(request) {
    // Call specific Python file and function
    const loanAnalysis = await request.python.executeFile(
      './app/services/financial_calculator.py',
      'calculate_amortization',
      {
        principal: 300000,
        rate: 4.5,
        years: 30
      }
    );

    return { data: { loan: loanAnalysis } };
  }
</loader>
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

### Catch-All Routes

```html
<!-- app/routes/docs/[...slug].puremix -->
<loader>
  async function loadDocs(request) {
    // request.params.slug = ['api', 'users', 'create']
    const docPath = request.params.slug.join('/');
    const doc = await getDocumentation(docPath);

    return { data: { doc } };
  }
</loader>
```

---

## 🌐 Building APIs (All Types Supported)

### REST API

```javascript
// app/routes/api/products/[id].js
export default async function handler(request, response) {
  const { id } = request.params;

  if (request.method === 'GET') {
    const product = await getProduct(id);
    return response.json({ success: true, data: product });
  }

  if (request.method === 'PUT') {
    const updated = await updateProduct(id, request.body);
    return response.json({ success: true, data: updated });
  }

  if (request.method === 'DELETE') {
    await deleteProduct(id);
    return response.status(204).end();
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
```

### RPC-Style API

```javascript
// app/routes/api/rpc.js
export default async function handler(request, response) {
  const { method, params } = request.body;

  switch (method) {
    case 'user.create':
      return response.json(await createUser(params));
    case 'user.update':
      return response.json(await updateUser(params));
    case 'order.place':
      return response.json(await placeOrder(params));
    default:
      return response.status(400).json({ error: 'Unknown method' });
  }
}
```

### GraphQL API

```javascript
// app/routes/api/graphql.js
import { graphql, buildSchema } from 'graphql';

const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    products: [Product]
  }
`);

export default async function handler(request, response) {
  const { query, variables } = request.body;
  const result = await graphql({ schema, source: query, variableValues: variables });
  return response.json(result);
}
```

### Python API

```python
# app/routes/api/analyze.py
import json
import pandas as pd
import numpy as np

def main(context):
    """Main entry point for Python API routes"""
    request = context.get('request', {})

    if request.get('method') != 'POST':
        return {
            'status': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    data = request.get('body', {})
    df = pd.DataFrame(data['values'])

    analysis = {
        'mean': float(df['value'].mean()),
        'std': float(df['value'].std()),
        'count': len(df)
    }

    return {
        'status': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'success': True, 'analysis': analysis})
    }
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
│   └── lib/                 # Utilities
│       ├── database.js
│       └── validators.js
├── public/                  # Static assets
│   ├── css/
│   ├── images/
│   └── js/
├── puremix.config.js        # Configuration
├── package.json
└── server.js                # Production server
```

---

## ⚙️ Configuration

`puremix.config.js`:

```javascript
export default {
  port: 3000,
  staticDir: 'public',

  // Session management
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production'
    }
  },

  // Debug logging
  verboseDebug: {
    enabled: process.env.NODE_ENV !== 'production',
    level: 'info',        // 'error', 'warn', 'info', 'debug'
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
FROM node:22-alpine

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

### Systemd Service

```ini
# /etc/systemd/system/puremix-app.service
[Unit]
Description=PureMix Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/my-app
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="SESSION_SECRET=your-secret-key"
ExecStart=/usr/bin/puremix start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable puremix-app
sudo systemctl start puremix-app
sudo systemctl status puremix-app
```

---

## 📚 Complete Examples

### User Authentication

```html
<!-- app/routes/login.puremix -->
<layout>auth</layout>

<head>
  <title>Login</title>
</head>

<loader>
  async function loadLogin(request, actionResult) {
    // Redirect if already logged in
    if (request.session.userId) {
      return { redirect: '/dashboard' };
    }

    return {
      data: {
        error: actionResult?.error || null
      }
    };
  }
</loader>

<div class="login-container">
  <h1>Login</h1>

  {loadLogin.data.error &&
    <div class="error">{loadLogin.data.error}</div>
  }

  <form onsubmit="handleLogin">
    <input name="email" type="email" placeholder="Email" required>
    <input name="password" type="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>
</div>

<script server>
  async function handleLogin(formData, request) {
    const { email, password } = formData;

    const user = await authenticateUser(email, password);

    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    request.session.userId = user.id;
    request.session.email = user.email;

    return {
      success: true,
      redirect: '/dashboard'
    };
  }
</script>
```

### CRUD with Python ML

```html
<!-- app/routes/products/index.puremix -->
<layout>main</layout>

<imports>
  import { predict_price } from '../services/ml_pricing'
  import ProductCard from '../components/ProductCard.puremix'
</imports>

<loader>
  async function loadProducts(request, actionResult) {
    const products = await getProducts();

    // Use Python ML to predict prices for new products
    const predictions = await predict_price({
      products: products.map(p => ({
        category: p.category,
        features: p.features
      }))
    });

    return {
      data: {
        products,
        predictions,
        message: actionResult?.message
      }
    };
  }
</loader>

<div class="products-page">
  <h1>Products</h1>

  {loadProducts.data.message &&
    <div class="success">{loadProducts.data.message}</div>
  }

  <div class="products-grid">
    {loadProducts.data.products.map((product, i) =>
      <ProductCard
        product={product}
        predictedPrice={loadProducts.data.predictions[i]}
      />
    )}
  </div>

  <form onsubmit="createProduct">
    <h2>Add New Product</h2>
    <input name="name" placeholder="Product name" required>
    <input name="category" placeholder="Category" required>
    <textarea name="features" placeholder="Features (comma-separated)"></textarea>
    <button type="submit">Add Product</button>
  </form>
</div>

<script server>
  async function createProduct(formData, request) {
    const features = formData.features.split(',').map(f => f.trim());

    // Predict optimal price using Python ML
    const pricePrediction = await predict_price({
      products: [{
        category: formData.category,
        features: features
      }]
    });

    const product = await saveProduct({
      name: formData.name,
      category: formData.category,
      features: features,
      price: pricePrediction[0]
    });

    return {
      success: true,
      message: `Product added with AI-predicted price: $${pricePrediction[0]}`
    };
  }
</script>
```

---

## 🙏 Acknowledgments

PureMix is inspired by [Remix](https://remix.run/), a fantastic full-stack web framework. We've adapted their loader/action pattern and added first-class Python integration to create a framework that bridges JavaScript and Python ecosystems.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🔗 Resources

- **📚 Documentation**: [Full Framework Guide](https://tacho87.github.io/Puremix)
- **💬 Discussions**: [GitHub Discussions](https://github.com/tacho87/Puremix/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/tacho87/Puremix/issues)
- **📦 NPM Package**: [@puremix](https://www.npmjs.com/package/puremix)

---

## 🌟 Use Cases

### For Python Developers

- Use Python for web development without learning complex JavaScript tooling
- Import Python modules using familiar ES6 syntax
- Access Pandas, NumPy, scikit-learn directly in web applications

### For JavaScript Developers

- Familiar HTML/JSX syntax
- Add Python capabilities when needed for data science/ML
- Express.js foundation - use existing middleware

### For Full-Stack Teams

- Single codebase for server logic, Python ML, and UI
- Shared components between pages
- TypeScript support for type safety
- Production features built-in

---

**MIT License - Built for developers building data-driven web applications.**
