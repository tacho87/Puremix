# PureMix Framework Guide

**Complete reference for building with PureMix - Token-friendly for LLMs and developers**

---

## 🚀 Quick Start

PureMix is a server-side rendering framework that seamlessly mixes **JavaScript/TypeScript/Python** in `.puremix` files for building modern web applications.

### Core Philosophy

- **File-based routing** (inspired by Remix)
- **Server-first** with progressive enhancement
- **Language agnostic** - Use JS, TS, or Python anywhere
- **Sensible defaults** - Sensible defaults, optional customization
- **Client-agnostic** - Use vanilla JS, React, Vue, Svelte, or any framework

### What Makes PureMix Different

PureMix combines the best of both worlds:

- **Server-Side Rendering** - Fast initial page loads, SEO-friendly
- **Progressive Enhancement** - Add interactivity with any client framework
- **Multi-Language** - JavaScript, TypeScript, and Python in the same file
- **Smart DOM Diffing** - Intelligent updates without page reload
- **No Build Step** - Development without webpack/vite (optional for production)

---

## 🔍 Behind the Scenes - How PureMix Works

Understanding the framework architecture helps you build better applications.

### Request Lifecycle

```
1. HTTP Request arrives
         ↓
2. Route Resolution (file-based routing)
         ↓
3. Parse .puremix file (extract blocks)
         ↓
4. Execute Action (if POST request)
         ↓
5. Execute Loader (with action result)
         ↓
6. Process Template (AST-based, no regex)
         ↓
7. Render Components (async, with props)
         ↓
8. Inject Client Runtime (PureMix API)
         ↓
9. Send HTML Response
         ↓
10. Browser executes client scripts
```

### Core Components

#### **1. PureMix Engine** (`lib/puremix-engine.ts`)

- Express.js wrapper with enhanced routing
- File watcher for hot reload
- Server function registry
- Component lifecycle management
- Python process pool integration

**Key Features:**

```javascript
// Automatic route mapping
app/routes/products/[id].puremix → /products/:id

// Server function auto-discovery
<script server> functions → Globally available

// Python module scanning
app/services/*.py → Auto-registered on startup
```

#### **2. File Parser** (`lib/file-parser.ts`)

- Extracts framework blocks (`<loader>`, `<script server>`, etc.)
- Compiles functions in isolated contexts
- Resolves imports (JS/TS/Python)
- Discovers Python functions in script tags

**What it parses:**

```html
<layout>      → Layout template name
<head>        → Custom meta tags, scripts
<imports>     → Module imports (JS/TS/Python)
<loader>      → Data fetching function
<script server> → Server-side functions
<script client> → Browser-side scripts
HTML content   → Template to render
```

#### **3. Template Engine** (`lib/template-engine-interpreter.ts`)

- **COMPLETELY REGEX-FREE** - Pure AST-based processing
- Processes template expressions `{...}`
- Handles conditionals, loops, JavaScript blocks
- Component tag rendering with props

**Architecture:**

```
HTML Template
     ↓
Lexical Analysis (tokenization)
     ↓
Syntax Analysis (AST parsing)
     ↓
Semantic Analysis (validation)
     ↓
Code Generation (final HTML)
```

**Why AST-based?**

- More reliable than regex
- Handles nested structures correctly
- Supports complex JavaScript blocks
- Maintainable and extensible

#### **4. Client Runtime** (`lib/client-runtime.ts`)

- Generates browser-side `window.PureMix` API
- Injects loader data securely (JSON in script tags)
- AJAX form/button interception
- Smart DOM diffing (zero-flicker updates)

**What gets injected:**

```javascript
window.PureMix = {
  data: { /* loader results */ },
  call: (functionName, data) => { /* AJAX to server */ },
  // Internal methods for framework
};
```

#### **5. Python Integration** (`lib/python-executor.ts`)

- Process pool with 4 worker processes
- Automatic module discovery and registration
- Graceful fallbacks when Python unavailable
- Context sharing between JS and Python

**How it works:**

```
JavaScript calls Python function
         ↓
Task added to worker queue
         ↓
Available worker picks up task
         ↓
Python script executed in subprocess
         ↓
Result serialized to JSON
         ↓
Returned to JavaScript caller
```

### Request Context

Every loader and action receives a `request` object:

```javascript
request = {
  // Express objects
  req,          // Raw Express request
  res,          // Raw Express response

  // Convenience properties
  params,       // Route parameters { id: "123" }
  query,        // Query strings { page: "2" }
  body,         // POST body data
  cookies,      // Parsed cookies (cookie-parser)
  session,      // Session data (express-session)
  user,         // User from session (if authenticated)
  files,        // Uploaded files (multer)
  method,       // HTTP method (GET, POST, etc.)
  url,          // Full URL
  env,          // Environment variables

  // Framework utilities
  python,       // Python execution interface

  // Helper functions
  redirect: (url) => ({ redirect: url }),
  json: (data) => ({ json: data }),
  error: (msg) => ({ error: msg }),
  success: (msg, data) => ({ success: true, message: msg, ...data })
}
```

### How Cookies Work

PureMix uses **cookie-parser** middleware automatically:

```javascript
// lib/puremix-engine.ts:342
this.app.use(cookieParser());

// lib/puremix-engine.ts:1602
request.cookies = req.cookies; // Available in loaders/actions
```

**Reading cookies:**

```javascript
const sessionId = request.cookies.sessionId;
const preferences = request.cookies.userPrefs;
```

**Setting cookies:**

```javascript
// In server functions
request.res.cookie('sessionId', 'abc123', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

### Session Management

PureMix uses **express-session** out of the box:

```javascript
// Available in request object
request.session.user = { id: 123, name: 'Alice' };
request.session.csrfToken = 'secure-token';

// Access in next request
const user = request.session.user;
```

### Security Features

1. **CSRF Protection** - Automatic token validation for AJAX calls
2. **Cookie Security** - httpOnly, secure flags
3. **Input Sanitization** - Automatic for common XSS vectors
4. **Session Management** - Secure session handling
5. **Python Isolation** - Subprocess execution prevents crashes

---

## 📁 Project Structure

```
your-project/
├── app/
│   ├── routes/              # File-based routing (auto-mapped to URLs)
│   │   ├── index.puremix         # → /
│   │   ├── about.puremix         # → /about
│   │   ├── products/
│   │   │   ├── index.puremix     # → /products
│   │   │   └── [id].puremix      # → /products/:id (dynamic)
│   │   └── blog/
│   │       └── [...slug].puremix # → /blog/* (catch-all)
│   │
│   ├── components/          # Reusable .puremix components
│   │   ├── Header.puremix
│   │   ├── Footer.puremix
│   │   └── UserCard.puremix
│   │
│   ├── layouts/             # Layout templates (wrap pages)
│   │   ├── main.html
│   │   └── admin.html
│   │
│   ├── controllers/         # Business logic (JS/TS)
│   │   ├── users.js
│   │   └── products.ts
│   │
│   ├── services/            # Python modules (auto-discovered)
│   │   ├── analytics.py
│   │   └── ml_models.py
│   │
│   └── lib/                 # Shared utilities
│       ├── database.js      # DB connections (Mongoose, etc.)
│       ├── auth.js          # Authentication helpers
│       └── validators.js
│
├── public/                  # Static assets (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── images/
│
├── puremix.config.js        # Framework configuration
└── package.json
```

---

## 📄 .puremix File Anatomy

A `.puremix` file has **five main sections**:

```html
<!-- 1. LAYOUT (optional) -->
<layout>main</layout>

<!-- 2. HEAD (optional - custom meta tags, scripts) -->
<head>
  <title>Page Title</title>
  <meta name="description" content="Page description">
</head>

<!-- 3. IMPORTS -->
<imports>
  import { getUser } from '../controllers/users'
  import { validate_email } from '../services/validators'
  import UserCard from '../components/UserCard.puremix'
</imports>

<!-- 4. LOADER (server-side data fetching) -->
<loader>
  async function loadPage(request, actionResult) {
    const userId = request.params.id;
    const user = await getUser(userId);

    return {
      data: { user },           // Required: data for template
      state: { isEditing: false } // Optional: UI state
    };
  }
</loader>

<!-- 5. HTML TEMPLATE -->
<div class="container">
  <h1>{loadPage.data.user.name}</h1>

  <!-- Component usage -->
  <UserCard user={loadPage.data.user} />

  <!-- Form with server action -->
  <form onsubmit="updateUser">
    <input name="name" value="{loadPage.data.user.name}">
    <button type="submit">Update</button>
  </form>
</div>

<!-- 6. SERVER SCRIPTS (JavaScript actions) -->
<script server>
  async function updateUser(formData, request) {
    const name = formData.get('name');
    const user = await saveUser(request.params.id, { name });
    return { success: true, user };
  }
</script>

<!-- 7. SERVER SCRIPTS (Python actions) -->
<script server lang="python">
def analyze_user(data, js_context=None):
    """Python function with pandas, numpy, etc."""
    import pandas as pd
    df = pd.DataFrame(data)
    return {'success': True, 'stats': df.describe().to_dict()}
</script>

<!-- Call Python function from form -->
<form onsubmit="analyze_user">
  <input type="hidden" name="userId" value="{loadPage.data.user.id}">
  <button type="submit">Analyze User Data</button>
</form>

<!-- 8. CLIENT SCRIPTS (browser-side) -->
<script>
  // Runs in the browser
  document.addEventListener('DOMContentLoaded', function() {
    // Access loader data
    const userData = PureMix.data.loadPage.data.user;
    console.log('User:', userData.name);
  });
</script>
```

---

## 🛣️ Routing System

### File-Based Routes

Routes are automatically created from your file structure:

```bash
# Static routes
app/routes/index.puremix              → /
app/routes/about.puremix              → /about
app/routes/contact.puremix            → /contact

# Nested routes
app/routes/products/index.puremix     → /products
app/routes/products/new.puremix       → /products/new

# Dynamic parameters
app/routes/users/[id].puremix         → /users/:id
app/routes/blog/[category]/[slug].puremix → /blog/:category/:slug

# Catch-all routes
app/routes/docs/[...path].puremix     → /docs/*
```

### Accessing Parameters

```html
<loader>
  async function loadPage(request) {
    // Route parameters
    const userId = request.params.id;           // from [id].puremix
    const category = request.params.category;   // from [category]
    const pathSegments = request.params.path;   // from [...path] (array)

    // Query parameters
    const page = request.query.page;            // from ?page=2
    const sort = request.query.sort;            // from ?sort=name

    return { data: { userId, category, page, sort } };
  }
</loader>

<!-- Use in template -->
<div>
  <p>User ID: {params.id}</p>
  <p>Category: {params.category}</p>
  <p>Page: {loadPage.data.page}</p>
</div>
```

---

## 📦 Loaders (Data Fetching)

Loaders run **on the server** before the page renders.

**⚠️ Important:** The `actionResult` parameter contains the return value from any action (server function) that executed before the loader. This is how PureMix handles the Remix pattern: **Action → Loader → Render**.

### Basic Loader

```html
<loader>
  async function loadPage(request, actionResult) {
    // Fetch data from database, API, etc.
    const products = await getProducts();

    // Check if an action just ran
    const message = actionResult?.success
      ? 'Product saved successfully!'
      : null;

    return {
      data: { products, message }
    };
  }
</loader>
```

### Request Object

```javascript
request.params    // Route parameters { id: "123" }
request.query     // Query strings { page: "2", sort: "name" }
request.body      // POST body data
request.method    // HTTP method (GET, POST, etc.)
request.url       // Full URL
request.cookies   // Cookies object
request.session   // Session data
request.user      // User object (if authenticated)
request.files     // Uploaded files (multipart forms)
```

### Using Action Results

Loaders receive action results when forms are submitted:

```html
<loader>
  async function loadPage(request, actionResult) {
    const products = await getProducts();

    // actionResult contains data from server actions
    const successMessage = actionResult?.success
      ? 'Product saved!'
      : null;

    return {
      data: { products },
      state: { message: successMessage }
    };
  }
</loader>
```

---

## 🎬 Actions (Server Functions)

Actions handle **form submissions** and **AJAX calls**.

**⚠️ IMPORTANT:** Actions **always require a loader** to handle the result. The framework flow is:

1. Action executes (if POST request)
2. Loader executes with `actionResult` parameter
3. Page renders with loader data

Without a loader, action results won't be displayed.

### Form Submission

```html
<loader>
  async function loadPage(request, actionResult) {
    const products = await getProducts();

    // Handle action result
    const message = actionResult?.success
      ? 'Product created successfully!'
      : actionResult?.error || null;

    return {
      data: { products },
      state: { message, error: actionResult?.error }
    };
  }
</loader>

<!-- Automatic form handling -->
<form onsubmit="createProduct">
  <input name="name" placeholder="Product name">
  <input name="price" type="number" placeholder="Price">
  <button type="submit">Create</button>
</form>

{loadPage.state.message &&
  <div class="success">{loadPage.state.message}</div>
}

{loadPage.state.error &&
  <div class="error">{loadPage.state.error}</div>
}

<script server>
  async function createProduct(formData, request) {
    const name = formData.get('name');
    const price = parseFloat(formData.get('price'));

    // Validate
    if (!name || !price) {
      return {
        success: false,
        error: 'Name and price required'
      };
    }

    // Save to database
    const product = await saveProduct({ name, price });

    return {
      success: true,
      product
    };
  }
</script>
```

### AJAX Call (JavaScript)

```html
<button onclick="handleClick()">Load More</button>

<script>
  async function handleClick() {
    // Call server function via AJAX
    const result = await PureMix.call('loadMoreProducts', {
      page: 2,
      limit: 10
    });

    if (result.success) {
      console.log('Products:', result.products);
      // Update UI without page reload
    }
  }
</script>

<script server>
  async function loadMoreProducts(data, request) {
    const { page, limit } = data;
    const products = await getProducts({ page, limit });
    return { success: true, products };
  }
</script>
```

---

## 🐍 Python Integration

PureMix supports Python as a **first-class language**.

### Method 1: Inline Python (Script Tags)

```html
<script server lang="python">
def analyze_sales(data, js_context=None):
    """Analyze sales data with pandas"""
    import pandas as pd
    import numpy as np

    df = pd.DataFrame(data)

    return {
        'success': True,
        'total': float(df['amount'].sum()),
        'average': float(df['amount'].mean()),
        'stats': df.describe().to_dict()
    }
</script>

<!-- Call from form -->
<form onsubmit="analyze_sales">
  <button type="submit">Analyze Sales</button>
</form>
```

### Method 2: Python Module Files (Recommended)

**Create Python file:** `app/services/analytics.py`

```python
def calculate_metrics(data, js_context=None):
    """Calculate business metrics"""
    import pandas as pd

    df = pd.DataFrame(data)

    return {
        'success': True,
        'revenue': float(df['sales'].sum()),
        'growth': float(df['sales'].pct_change().mean() * 100)
    }

def forecast_sales(data, js_context=None):
    """Forecast future sales using ML"""
    from sklearn.linear_model import LinearRegression
    import numpy as np

    X = np.array(data['dates']).reshape(-1, 1)
    y = np.array(data['sales'])

    model = LinearRegression()
    model.fit(X, y)

    return {
        'success': True,
        'forecast': model.predict([[30]]).tolist()
    }
```

**Use in .puremix file:**

```html
<imports>
  import { calculate_metrics, forecast_sales } from '../services/analytics'
</imports>

<loader>
  async function loadDashboard(request) {
    const salesData = await getSalesData();

    // Call Python functions like JavaScript!
    const metrics = await calculate_metrics(salesData);
    const forecast = await forecast_sales(salesData);

    return {
      data: { metrics, forecast }
    };
  }
</loader>
```

### Method 3: Inline Python Execution

```html
<loader>
  async function loadPage(request) {
    // Execute Python code dynamically
    const result = await request.python.call('process_data', inputData, `
      import pandas as pd

      def process_data(data, js_context=None):
        df = pd.DataFrame(data)
        return {'result': df.head().to_dict()}
    `);

    return { data: result };
  }
</loader>
```

### Python Best Practices

✅ **DO:**

- Use Python modules in `app/services/` for reusable logic
- Return dictionaries with `success` key
- Handle errors gracefully
- Use type hints for better code

❌ **DON'T:**

- Mix Python and JavaScript in same function
- Return Python objects directly (convert to dict/list)
- Forget error handling

---

## 🧩 Components

Components are **reusable .puremix files** with props.

### Creating a Component

**File:** `app/components/ProductCard.puremix`

```html
<!-- Component receives props -->
<div class="product-card">
  <h3>{product.name}</h3>
  <p>${product.price}</p>

  {product.inStock ?
    <button onclick="addToCart">Add to Cart</button> :
    <span class="out-of-stock">Out of Stock</span>
  }
</div>

<script server>
  async function addToCart(formData, request) {
    const productId = formData.get('productId');
    await addProductToCart(request.user.id, productId);
    return { success: true };
  }
</script>
```

### Using Components

```html
<imports>
  import ProductCard from '../components/ProductCard.puremix'
</imports>

<div class="products">
  {loadPage.data.products.map(product =>
    <ProductCard product={product} />
  )}
</div>
```

### Component Props

Components can receive any data type:

```html
<!-- String props -->
<UserCard name="John" role="admin" />

<!-- Object props -->
<UserCard user={loadPage.data.user} />

<!-- Array props -->
<ProductList items={loadPage.data.products} />

<!-- Boolean props -->
<Modal isOpen={true} />

<!-- Mixed props -->
<Dashboard
  user={loadPage.data.user}
  stats={loadPage.data.stats}
  isAdmin={true}
/>
```

---

## 🔐 Authentication & Authorization

### Cookie-Based Authentication

**Setup:** `app/lib/auth.js`

```javascript
import crypto from 'crypto';

// Session storage (in production, use Redis or database)
const sessions = new Map();

export function createSession(userId) {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    userId,
    createdAt: Date.now()
  });
  return sessionId;
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}

export function destroySession(sessionId) {
  sessions.delete(sessionId);
}

export function requireAuth(request) {
  const sessionId = request.cookies.sessionId;
  const session = getSession(sessionId);

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
```

**Login page:** `app/routes/login.puremix`

```html
<loader>
  async function loadLogin(request, actionResult) {
    // Redirect if already logged in
    if (request.cookies.sessionId) {
      const session = getSession(request.cookies.sessionId);
      if (session) {
        return { redirect: '/' };
      }
    }

    return {
      data: {},
      state: {
        error: actionResult?.error,
        success: actionResult?.success
      }
    };
  }
</loader>

<div class="login-page">
  <h1>Login</h1>

  {loadLogin.state.error &&
    <div class="error">{loadLogin.state.error}</div>
  }

  <form onsubmit="handleLogin">
    <input name="email" type="email" placeholder="Email" required>
    <input name="password" type="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>
</div>

<script server>
  import { createSession } from '../lib/auth';
  import { verifyUser } from '../controllers/users';

  async function handleLogin(formData, request) {
    const email = formData.get('email');
    const password = formData.get('password');

    // Verify credentials
    const user = await verifyUser(email, password);

    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Create session
    const sessionId = createSession(user.id);

    // Set cookie
    request.res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return {
      success: true,
      redirect: '/'
    };
  }
</script>
```

**Protected page:** `app/routes/dashboard.puremix`

```html
<imports>
  import { requireAuth } from '../lib/auth'
  import { getUserData } from '../controllers/users'
</imports>

<loader>
  async function loadDashboard(request) {
    // Require authentication
    try {
      const session = requireAuth(request);
      const userData = await getUserData(session.userId);

      return {
        data: { user: userData }
      };
    } catch (error) {
      // Redirect to login if not authenticated
      return { redirect: '/login' };
    }
  }
</loader>

<div class="dashboard">
  <h1>Welcome, {loadDashboard.data.user.name}</h1>

  <form onsubmit="logout">
    <button type="submit">Logout</button>
  </form>
</div>

<script server>
  import { destroySession } from '../lib/auth';

  async function logout(formData, request) {
    const sessionId = request.cookies.sessionId;
    if (sessionId) {
      destroySession(sessionId);
      request.res.clearCookie('sessionId');
    }
    return { redirect: '/login' };
  }
</script>
```

### JWT Authentication (Token-Based)

JWT (JSON Web Tokens) are ideal for **stateless authentication**, **API endpoints**, and **mobile apps**.

#### **Setup:** `app/lib/jwt-auth.js`

```javascript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Generate JWT token for user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id || user._id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request headers
 */
export function extractToken(request) {
  // Check Authorization header
  const authHeader = request.req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Check cookie (for web app hybrid auth)
  if (request.cookies.token) {
    return request.cookies.token;
  }

  return null;
}

/**
 * Middleware: Require JWT authentication
 */
export function requireJWTAuth(request) {
  const token = extractToken(request);

  if (!token) {
    throw new Error('No authentication token provided');
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  return decoded; // Returns { userId, email, role }
}

/**
 * Hash password for storage
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

#### **Login API:** `app/routes/api/auth/login.js`

```javascript
import { connectDB, User } from '../../../lib/database.js';
import { generateToken, verifyPassword } from '../../../lib/jwt-auth.js';

export default async function handler(request, response) {
  // Handle OPTIONS for CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).json({ success: true });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      error: 'Use POST to login'
    });
  }

  try {
    const { email, password } = request.body;

    // Validate input
    if (!email || !password) {
      return response.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return response.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return response.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    return response.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

#### **Register API:** `app/routes/api/auth/register.js`

```javascript
import { connectDB, User } from '../../../lib/database.js';
import { generateToken, hashPassword } from '../../../lib/jwt-auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { name, email, password } = request.body;

    // Validate input
    if (!name || !email || !password) {
      return response.status(400).json({
        success: false,
        error: 'Name, email, and password required'
      });
    }

    if (password.length < 8) {
      return response.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return response.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    return response.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Registration successful'
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

#### **Protected API:** `app/routes/api/user/profile.js`

```javascript
import { requireJWTAuth } from '../../../lib/jwt-auth.js';
import { connectDB, User } from '../../../lib/database.js';

export default async function handler(request, response) {
  try {
    // Require JWT authentication
    const { userId } = requireJWTAuth(request);

    await connectDB();

    // Get user data
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return response.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return response.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return response.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}
```

#### **Client-Side Usage (Vanilla JavaScript)**

```html
<!-- app/routes/login.puremix -->
<div class="login-page">
  <h1>Login</h1>

  <div id="message"></div>

  <form id="loginForm">
    <input type="email" name="email" placeholder="Email" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>
</div>

<script>
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Store token in localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        document.getElementById('message').innerHTML =
          `<div class="error">${result.error}</div>`;
      }
    } catch (error) {
      document.getElementById('message').innerHTML =
        `<div class="error">Login failed: ${error.message}</div>`;
    }
  });
</script>
```

#### **Making Authenticated API Calls**

```javascript
// Get token from localStorage
const token = localStorage.getItem('token');

// Make authenticated request
const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  console.log('User profile:', data.user);
} else {
  // Token expired or invalid - redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
```

#### **Hybrid: JWT + Cookies for Web Apps**

For traditional web apps, you can store JWT in httpOnly cookies:

```javascript
// In login action
async function handleLogin(formData, request) {
  const token = generateToken(user);

  // Store JWT in httpOnly cookie
  request.res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict'
  });

  return { success: true, redirect: '/dashboard' };
}
```

Then in loaders/actions, the token is automatically available:

```javascript
async function loadDashboard(request) {
  try {
    const { userId } = requireJWTAuth(request); // Reads from cookie
    const userData = await getUserData(userId);
    return { data: { user: userData } };
  } catch (error) {
    return { redirect: '/login' };
  }
}
```

### Authentication Comparison

| Feature                   | Cookie-Based           | JWT (localStorage)  | JWT (httpOnly Cookie) |
| ------------------------- | ---------------------- | ------------------- | --------------------- |
| **Storage**         | Server session         | Client localStorage | Server cookie         |
| **Stateful**        | Yes                    | No                  | No                    |
| **Mobile/API**      | ❌                     | ✅                  | ❌                    |
| **XSS Protection**  | ✅                     | ❌                  | ✅                    |
| **CSRF Protection** | Needed                 | ✅                  | Needed                |
| **Scalability**     | Requires session store | ✅ Highly scalable  | ✅ Highly scalable    |
| **Best For**        | Traditional web apps   | APIs, mobile apps   | Hybrid web + API      |

**Recommendation:**

- **Web-only app**: Cookie-based (simpler)
- **API/Mobile**: JWT in headers
- **Hybrid**: JWT in httpOnly cookies

---

## 🗄️ Database Integration (Mongoose Example)

### Setup Database Connection

**File:** `app/lib/database.js`

```javascript
import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// User model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Product model
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
```

### Using in Routes

```html
<imports>
  import { connectDB, Product } from '../lib/database'
</imports>

<loader>
  async function loadProducts(request) {
    await connectDB();

    const page = parseInt(request.query.page || '1');
    const limit = 10;

    const products = await Product.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments();

    return {
      data: {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
</loader>

<div class="products">
  <h1>Products</h1>

  {loadProducts.data.products.map(product =>
    <div class="product">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  )}

  <div class="pagination">
    Page {loadProducts.data.page} of {loadProducts.data.totalPages}
  </div>

  <form onsubmit="createProduct">
    <input name="name" placeholder="Product name" required>
    <input name="price" type="number" placeholder="Price" required>
    <button type="submit">Create Product</button>
  </form>
</div>

<script server>
  import { connectDB, Product } from '../lib/database';

  async function createProduct(formData, request) {
    await connectDB();

    const name = formData.get('name');
    const price = parseFloat(formData.get('price'));

    const product = await Product.create({
      name,
      price
    });

    return {
      success: true,
      product: product.toObject()
    };
  }
</script>
```

---

## 🎨 Client vs Server Scripts

### Server Scripts

Run on the **server** (Node.js environment):

```html
<script server>
  // JavaScript server function
  async function handleData(formData, request) {
    // Has access to:
    // - Database
    // - File system
    // - Environment variables
    // - Server-side libraries

    const result = await queryDatabase();
    return { success: true, result };
  }
</script>

<script server lang="python">
# Python server function
def process_data(data, js_context=None):
    # Has access to:
    # - pandas, numpy, sklearn
    # - File system
    # - Python libraries

    import pandas as pd
    df = pd.DataFrame(data)
    return {'result': df.to_dict()}
</script>
```

### Client Scripts

Run in the **browser**:

```html
<script>
  // OR <script client>
  // Plain JavaScript that runs in the browser

  document.addEventListener('DOMContentLoaded', function() {
    // Has access to:
    // - DOM (document, window)
    // - Browser APIs
    // - PureMix.data (loader results)
    // - PureMix.call() (AJAX to server functions)

    const userData = PureMix.data.loadPage.data.user;
    console.log('User:', userData);

    // Call server function via AJAX
    document.querySelector('#btn').addEventListener('click', async () => {
      const result = await PureMix.call('serverFunction', { id: 123 });
      console.log(result);
    });
  });
</script>
```

### Data Flow

```
Server → Loader → Template → HTML + PureMix.data → Browser
                                                     ↓
Browser → User Action → PureMix.call() → Server Function
                                            ↓
                                       Server Response → Update UI
```

---

## 🎨 Using Client-Side Frameworks

PureMix is **client-agnostic** - you can use **any** client-side framework or library alongside server-side rendering.

### Philosophy: Progressive Enhancement

PureMix follows a **server-first** approach:

1. Server renders HTML (fast initial load, SEO-friendly)
2. Client enhances with JavaScript (interactivity)
3. Use any framework for client-side (optional)

### Vanilla JavaScript (Recommended Start)

The simplest approach - no build tools, no dependencies:

```html
<loader>
  async function loadPage(request) {
    const products = await getProducts();
    return { data: { products } };
  }
</loader>

<div id="app">
  <h1>Products</h1>
  <div id="product-list">
    {loadPage.data.products.map(p =>
      <div class="product">{p.name}</div>
    )}
  </div>
</div>

<script>
  // Access server data
  const products = PureMix.data.loadPage.data.products;

  // Add client-side interactivity
  document.querySelectorAll('.product').forEach((el, index) => {
    el.addEventListener('click', () => {
      alert(`Clicked: ${products[index].name}`);
    });
  });

  // Call server functions
  async function loadMore() {
    const result = await PureMix.call('loadMoreProducts', { page: 2 });
    // Update DOM with new products
  }
</script>
```

### React Integration

Use React for complex interactive components while keeping server-side rendering for SEO:

**Install:**

```bash
npm install react react-dom
```

**File:** `app/routes/products.puremix`

```html
<loader>
  async function loadPage(request) {
    const products = await getProducts();
    return { data: { products } };
  }
</loader>

<!-- Server-rendered HTML for SEO -->
<div id="react-root">
  <h1>Products</h1>
  {loadPage.data.products.map(p =>
    <div class="product-item">{p.name} - ${p.price}</div>
  )}
</div>

<!-- Load React from CDN or bundled -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<script type="text/babel">
  const { useState, useEffect } = React;

  function ProductList() {
    // Hydrate with server data
    const [products, setProducts] = useState(PureMix.data.loadPage.data.products);
    const [loading, setLoading] = useState(false);

    async function loadMore() {
      setLoading(true);
      const result = await PureMix.call('loadMoreProducts', { page: 2 });
      setProducts([...products, ...result.products]);
      setLoading(false);
    }

    return (
      <div>
        <h1>Products (React)</h1>
        {products.map(product => (
          <div key={product.id} className="product-item">
            {product.name} - ${product.price}
          </div>
        ))}
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      </div>
    );
  }

  // Hydrate instead of render (preserve server HTML)
  ReactDOM.hydrateRoot(
    document.getElementById('react-root'),
    <ProductList />
  );
</script>

<script server>
  async function loadMoreProducts(data, request) {
    const { page } = data;
    const products = await getProducts({ page });
    return { success: true, products };
  }
</script>
```

### Vue.js Integration

Perfect for progressive enhancement with reactive data binding:

**Install:**

```bash
npm install vue
```

**File:** `app/routes/dashboard.puremix`

```html
<loader>
  async function loadPage(request) {
    const userData = await getUserData(request.user.id);
    return { data: { user: userData } };
  }
</loader>

<div id="vue-app">
  <!-- Server-rendered fallback -->
  <div class="user-profile">
    <h1>{{ user.name }}</h1>
    <p>Email: {{ user.email }}</p>
  </div>
</div>

<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<script>
  const { createApp } = Vue;

  createApp({
    data() {
      return {
        user: PureMix.data.loadPage.data.user,
        editing: false
      };
    },
    methods: {
      async updateProfile() {
        const result = await PureMix.call('updateProfile', {
          name: this.user.name,
          email: this.user.email
        });

        if (result.success) {
          this.editing = false;
          alert('Profile updated!');
        }
      }
    },
    template: `
      <div class="user-profile">
        <h1>{{ user.name }}</h1>
        <p v-if="!editing">Email: {{ user.email }}</p>
        <div v-else>
          <input v-model="user.name" placeholder="Name">
          <input v-model="user.email" placeholder="Email">
          <button @click="updateProfile">Save</button>
        </div>
        <button @click="editing = !editing">
          {{ editing ? 'Cancel' : 'Edit' }}
        </button>
      </div>
    `
  }).mount('#vue-app');
</script>
```

### Svelte Integration

Compile Svelte components and include them:

**File:** `public/js/Counter.js` (pre-compiled Svelte)

```javascript
// Compiled Svelte component
export default class Counter {
  constructor(options) {
    // Svelte component logic
  }
}
```

**File:** `app/routes/counter.puremix`

```html
<div id="svelte-app"></div>

<script type="module">
  import Counter from '/js/Counter.js';

  new Counter({
    target: document.getElementById('svelte-app'),
    props: {
      initialCount: PureMix.data.loadPage.data.count || 0
    }
  });
</script>
```

### Alpine.js (Lightweight)

Perfect for adding reactive behavior without a build step:

```html
<loader>
  async function loadPage(request) {
    const items = await getTodoItems();
    return { data: { items } };
  }
</loader>

<script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>

<div x-data="{
  items: PureMix.data.loadPage.data.items,
  newItem: '',
  async addItem() {
    const result = await PureMix.call('addTodoItem', { text: this.newItem });
    if (result.success) {
      this.items.push(result.item);
      this.newItem = '';
    }
  }
}">
  <h1>Todo List</h1>

  <input x-model="newItem" @keyup.enter="addItem" placeholder="New item">
  <button @click="addItem">Add</button>

  <ul>
    <template x-for="item in items" :key="item.id">
      <li x-text="item.text"></li>
    </template>
  </ul>
</div>
```

### HTMX (HTML-Driven)

For a more HTML-centric approach with minimal JavaScript:

```html
<script src="https://unpkg.com/htmx.org@1.9.10"></script>

<div>
  <button
    hx-post="/api/data"
    hx-trigger="click"
    hx-target="#result"
    hx-swap="innerHTML"
  >
    Load Data
  </button>

  <div id="result">
    <!-- Response will be inserted here -->
  </div>
</div>
```

### jQuery (Legacy Support)

If you need to support older codebases:

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<script>
  $(document).ready(function() {
    // Access server data
    const products = PureMix.data.loadPage.data.products;

    $('#loadMore').click(async function() {
      const result = await PureMix.call('loadMoreProducts', { page: 2 });
      result.products.forEach(p => {
        $('#product-list').append(`<div>${p.name}</div>`);
      });
    });
  });
</script>
```

### Build Tools (Optional)

For production apps with frameworks, use standard build tools:

**Vite + React:**

```bash
npm install vite @vitejs/plugin-react
```

**vite.config.js:**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public/dist',
    rollupOptions: {
      input: './src/main.js'
    }
  }
});
```

**Include in .puremix file:**

```html
<script type="module" src="/dist/main.js"></script>
```

### Best Practices

#### ✅ **DO:**

- Use vanilla JS for simple enhancements
- Use frameworks for complex interactive features
- Hydrate with server data (`PureMix.data`)
- Call server functions via `PureMix.call()`
- Keep server rendering for SEO

#### ❌ **DON'T:**

- Don't rebuild what's already rendered server-side
- Don't fetch data client-side that could be loaded server-side
- Don't block initial render with heavy JavaScript
- Don't forget to handle loading states

### Framework Comparison

| Framework            | Build Required | Bundle Size | Learning Curve | Use Case             |
| -------------------- | -------------- | ----------- | -------------- | -------------------- |
| **Vanilla JS** | ❌             | 0 KB        | Easy           | Simple interactions  |
| **Alpine.js**  | ❌             | 15 KB       | Easy           | Reactive components  |
| **HTMX**       | ❌             | 14 KB       | Easy           | HTML-driven          |
| **Vue**        | Optional       | 34 KB       | Medium         | Progressive apps     |
| **React**      | Yes (prod)     | 44 KB       | Medium         | Complex UIs          |
| **Svelte**     | Yes            | 2 KB        | Medium         | Performance-critical |
| **jQuery**     | ❌             | 30 KB       | Easy           | Legacy support       |

### Hybrid Approach (Recommended)

Use the right tool for each feature:

```html
<loader>
  async function loadPage(request) {
    const data = await getPageData();
    return { data };
  }
</loader>

<!-- Static content: Server-rendered -->
<header>
  <h1>{loadPage.data.title}</h1>
  <nav>
    {loadPage.data.menuItems.map(item =>
      <a href="{item.url}">{item.label}</a>
    )}
  </nav>
</header>

<!-- Simple interactivity: Vanilla JS -->
<button id="simple-btn">Click Me</button>
<script>
  document.getElementById('simple-btn').onclick = () => alert('Hi!');
</script>

<!-- Complex component: React -->
<div id="dashboard-app"></div>
<script type="module">
  import Dashboard from '/js/dashboard.js';
  // Mount React component
</script>

<!-- Form handling: PureMix built-in -->
<form onsubmit="handleSubmit">
  <input name="email">
  <button>Submit</button>
</form>
```

**Result:** Fast initial load + Rich interactivity + SEO-friendly + Progressive enhancement

---

## 📝 Template Expressions

### Simple Expressions

```html
{user.name}
{product.price}
{loadPage.data.total}
```

### Conditionals

```html
{user.isAdmin ?
  <button>Admin Panel</button> :
  <span>Regular User</span>
}

{product.inStock ?
  <div class="available">In Stock</div> :
  <div class="unavailable">Out of Stock</div>
}
```

### Loops

```html
{products.map(product =>
  <div class="product">
    <h3>{product.name}</h3>
    <p>${product.price}</p>
  </div>
)}

{users.filter(u => u.isActive).map(user =>
  <div>{user.name}</div>
)}
```

### JavaScript Blocks

```html
{
  // Full JavaScript execution
  let total = 0;
  let items = loadPage.data.items;

  for (let item of items) {
    total += item.price * item.quantity;
  }

  let tax = total * 0.1;
  let grandTotal = total + tax;

  __export = { total, tax, grandTotal };
}

<div class="summary">
  <p>Subtotal: ${total}</p>
  <p>Tax: ${tax}</p>
  <p>Total: ${grandTotal}</p>
</div>
```

---

## ⚙️ Configuration

**File:** `puremix.config.js`

```javascript
export default {
  // Server configuration
  port: process.env.PORT || 3000,
  host: 'localhost',

  // Application directory
  appDir: 'app',

  // Development mode
  isDev: process.env.NODE_ENV !== 'production',

  // Hot reload
  hotReload: true,

  // Python configuration
  python: {
    usePool: true,        // Enable process pool
    minWorkers: 2,        // Minimum workers
    maxWorkers: 8,        // Maximum workers
    timeout: 30000        // Execution timeout (ms)
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production'
  },

  // Debug logging
  verboseDebug: {
    enabled: process.env.VERBOSE_DEBUG === 'true',
    level: 'debug',       // error, warn, info, debug
    console: true,
    save: false
  }
};
```

---


---

## 🚀 Production Deployment

### Running in Production

PureMix uses a simple command for production deployment:

```bash
# Direct production start
NODE_ENV=production puremix start --port 3000 --host 0.0.0.0

# With environment file
NODE_ENV=production PORT=8080 puremix start
```

### PM2 Process Management

For production environments, use PM2 for process management:

```bash
# Basic PM2 start
pm2 start "puremix start" --name my-app

# With environment variables
pm2 start "puremix start" \
  --name my-app \
  --env production \
  --log ./logs/app.log

# Cluster mode (multiple instances)
pm2 start "puremix start" \
  --name my-app \
  --instances 4 \
  --exec-mode cluster

# Save PM2 configuration
pm2 save

# Auto-restart on reboot
pm2 startup
```

### Docker Deployment

**Dockerfile:**

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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run production server
CMD ["puremix", "start", "--host", "0.0.0.0"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=${SESSION_SECRET}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Systemd Service

For Linux servers, create a systemd service:

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
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable puremix-app
sudo systemctl start puremix-app
sudo systemctl status puremix-app

# View logs
sudo journalctl -u puremix-app -f
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/my-app
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (if serving from PureMix)
    location /public {
        alias /var/www/my-app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment Variables

**Production .env file:**

```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-very-secret-key-change-this

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp

# Python (if using Python features)
PYTHON_PATH=/usr/bin/python3

# Logging
VERBOSE_DEBUG=false

# Optional: External services
SMTP_HOST=smtp.example.com
SMTP_PORT=587
REDIS_URL=redis://localhost:6379
```

### Health Check Endpoint

Add a health check route for monitoring:

```javascript
// app/routes/health.js
export default async function handler(request, response) {
  // Check database connection, Python availability, etc.
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV
  };

  return response.status(200).json(health);
}
```

### Performance Tips

1. **Enable gzip compression:**
```javascript
// Add to puremix.config.js or use nginx compression
import compression from 'compression';
app.use(compression());
```

2. **Set appropriate session max age:**
```javascript
session: {
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,                 // HTTPS only in production
    sameSite: 'strict'
  }
}
```

3. **Use PM2 cluster mode for multi-core servers**

4. **Monitor with PM2 Plus or similar tools**

## 🚀 Common Patterns

### CRUD Operations

```html
<imports>
  import { connectDB, Product } from '../lib/database'
</imports>

<loader>
  async function loadProducts(request) {
    await connectDB();
    const products = await Product.find();
    return { data: { products } };
  }
</loader>

<div>
  <!-- CREATE -->
  <form onsubmit="createProduct">
    <input name="name" placeholder="Name">
    <button type="submit">Create</button>
  </form>

  <!-- READ (list) -->
  {loadProducts.data.products.map(product =>
    <div>
      <h3>{product.name}</h3>

      <!-- UPDATE -->
      <form onsubmit="updateProduct">
        <input type="hidden" name="id" value="{product._id}">
        <input name="name" value="{product.name}">
        <button type="submit">Update</button>
      </form>

      <!-- DELETE -->
      <form onsubmit="deleteProduct">
        <input type="hidden" name="id" value="{product._id}">
        <button type="submit">Delete</button>
      </form>
    </div>
  )}
</div>

<script server>
  import { connectDB, Product } from '../lib/database';

  async function createProduct(formData) {
    await connectDB();
    const product = await Product.create({
      name: formData.get('name')
    });
    return { success: true, product };
  }

  async function updateProduct(formData) {
    await connectDB();
    const product = await Product.findByIdAndUpdate(
      formData.get('id'),
      { name: formData.get('name') },
      { new: true }
    );
    return { success: true, product };
  }

  async function deleteProduct(formData) {
    await connectDB();
    await Product.findByIdAndDelete(formData.get('id'));
    return { success: true };
  }
</script>
```

### File Uploads

```html
<loader>
  async function loadPage(request, actionResult) {
    const uploadedFiles = await getUploadedFiles();

    // Handle upload result
    const message = actionResult?.success
      ? `File uploaded: ${actionResult.url}`
      : actionResult?.error;

    return {
      data: { files: uploadedFiles },
      state: { message, uploadedUrl: actionResult?.url }
    };
  }
</loader>

<div>
  {loadPage.state.message &&
    <div class="message">{loadPage.state.message}</div>
  }

  <form onsubmit="uploadFile" enctype="multipart/form-data">
    <input type="file" name="file" required>
    <button type="submit">Upload</button>
  </form>
</div>

<script server>
  import fs from 'fs';
  import path from 'path';

  async function uploadFile(formData, request) {
    const file = request.files.file;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Save file
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const filePath = path.join(uploadDir, file.name);

    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(filePath, file.data);

    return {
      success: true,
      url: `/uploads/${file.name}`
    };
  }
</script>
```

### Pagination

```html
<loader>
  async function loadPage(request) {
    const page = parseInt(request.query.page || '1');
    const limit = 20;

    await connectDB();
    const products = await Product.find()
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments();

    return {
      data: {
        products,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
</loader>

<div>
  {loadPage.data.products.map(p => <div>{p.name}</div>)}

  <div class="pagination">
    {loadPage.data.hasPrev &&
      <a href="?page={loadPage.data.currentPage - 1}">Previous</a>
    }

    <span>Page {loadPage.data.currentPage} of {loadPage.data.totalPages}</span>

    {loadPage.data.hasNext &&
      <a href="?page={loadPage.data.currentPage + 1}">Next</a>
    }
  </div>
</div>
```

---

## 🌐 Building APIs

PureMix makes it easy to create **REST APIs** alongside your web pages. API routes use `.js`, `.ts`, or `.py` files with a handler function.

### API Route Structure

API routes use **standard JavaScript/TypeScript/Python files** (NOT `.puremix` files).

**File:** `app/routes/api/products.js`

```javascript
// API handler function
export default async function handler(request, response) {
  // Return JSON response
  return response.status(200).json({
    success: true,
    message: 'Products API',
    version: '1.0'
  });
}
```

**Access:** `GET /api/products` → Returns JSON

**Key Points:**

- Use `.js`, `.ts`, or `.py` files (NOT `.puremix`)
- Export default `handler(request, response)` function
- Use `response.status().json()` for JSON responses
- `request` and `response` are Express.js objects

---

## 🔧 **API Handler Logic - How It Works**

### **Framework Routing Process**

When a request hits an API endpoint, PureMix follows this flow:

```
1. Request received: GET /api/products/123
   ↓
2. File resolution: app/routes/api/products/[id].js
   ↓
3. Module loading: Import the file
   ↓
4. Function search: Look for handler in priority order
   ↓
5. Execution: Call handler(request, response)
   ↓
6. Response: Return JSON/XML/text to client
```

### **Handler Function Discovery**

The framework searches for handler functions in this **priority order**:

```javascript
// Priority 1: Default export
export default async function handler(request, response) {
  // Most common pattern
}

// Priority 2: Named HTTP method exports
export async function GET(request, response) { }
export async function POST(request, response) { }
export async function get(request, response) { } // Case-insensitive

// Priority 3: Generic handler names
export async function handle(request, response) { }
export async function process(request, response) { }
export async function execute(request, response) { }

// Priority 4: Python main function
def main(context):
    # Python APIs use this pattern
    pass
```

**You can use ANY of these patterns** - the framework will find and use the first match.

### **Request Object (Express.js)**

The `request` parameter gives you full access to Express.js request data:

```javascript
request.method          // "GET", "POST", "PUT", "DELETE", etc.
request.params          // Route parameters: { id: "123" }
request.query           // Query string: { page: "1", limit: "20" }
request.body            // POST/PUT body (parsed JSON)
request.headers         // HTTP headers
request.cookies         // Parsed cookies
request.url             // Full URL path
request.ip              // Client IP address
request.get('header')   // Get specific header
```

### **Response Object (Express.js)**

The `response` parameter provides Express.js response methods:

```javascript
// JSON responses (most common)
response.status(200).json({ success: true, data })
response.json({ data })  // Default 200 status

// Other response types
response.send('Plain text')
response.sendFile('/path/to/file.pdf')
response.redirect('/other-page')
response.status(204).end()  // No content

// Set headers
response.setHeader('Content-Type', 'application/xml')
response.setHeader('Cache-Control', 'no-cache')

// Set cookies
response.cookie('sessionId', 'abc123', { httpOnly: true })
```

### **Multiple HTTP Methods in One File**

You can handle multiple methods in a single handler:

```javascript
// app/routes/api/products/[id].js
export default async function handler(request, response) {
  const method = request.method;
  const productId = request.params.id;

  if (method === 'GET') {
    // Retrieve product
    const product = await getProduct(productId);
    return response.status(200).json({ success: true, data: product });
  }

  if (method === 'PUT' || method === 'PATCH') {
    // Update product
    const updated = await updateProduct(productId, request.body);
    return response.status(200).json({ success: true, data: updated });
  }

  if (method === 'DELETE') {
    // Delete product
    await deleteProduct(productId);
    return response.status(200).json({ success: true, message: 'Deleted' });
  }

  // Unsupported method
  return response.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'PUT', 'PATCH', 'DELETE']
  });
}
```

### **Separate Handlers Per Method**

Alternatively, export individual method handlers:

```javascript
// app/routes/api/products.js

export async function GET(request, response) {
  const products = await getAllProducts();
  return response.status(200).json({ success: true, data: products });
}

export async function POST(request, response) {
  const newProduct = await createProduct(request.body);
  return response.status(201).json({ success: true, data: newProduct });
}
```

**Framework automatically calls the matching method handler.**

---

## 🎨 **Beyond REST - Custom API Architectures**

### **Non-REST APIs are Fully Supported**

PureMix doesn't enforce REST principles. You can build **any API architecture**:

#### **1. RPC-Style APIs** (Remote Procedure Call)

```javascript
// app/routes/api/rpc.js
export default async function handler(request, response) {
  const { method, params } = request.body;

  // Single endpoint handles all operations
  switch (method) {
    case 'user.create':
      return response.json(await createUser(params));
    case 'user.get':
      return response.json(await getUser(params));
    case 'order.place':
      return response.json(await placeOrder(params));
    case 'payment.process':
      return response.json(await processPayment(params));
    default:
      return response.status(400).json({ error: 'Unknown method' });
  }
}
```

**Usage:**

```bash
POST /api/rpc
{
  "method": "user.create",
  "params": { "name": "Alice", "email": "alice@example.com" }
}
```

#### **2. GraphQL-Style APIs**

```javascript
// app/routes/api/graphql.js
import { graphql, buildSchema } from 'graphql';

const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    products: [Product]
  }
  type User {
    id: ID
    name: String
    email: String
  }
  type Product {
    id: ID
    name: String
    price: Float
  }
`);

const root = {
  user: ({ id }) => getUserById(id),
  products: () => getAllProducts()
};

export default async function handler(request, response) {
  const { query, variables } = request.body;

  const result = await graphql({
    schema,
    source: query,
    rootValue: root,
    variableValues: variables
  });

  return response.json(result);
}
```

#### **3. SOAP-Style APIs** (XML-based)

```javascript
// app/routes/api/soap.js
import { parseStringPromise, Builder } from 'xml2js';

export default async function handler(request, response) {
  try {
    // Parse incoming SOAP XML
    const soapEnvelope = await parseStringPromise(request.body);
    const body = soapEnvelope['soap:Envelope']['soap:Body'][0];

    // Extract operation
    const operation = Object.keys(body)[0];
    const params = body[operation][0];

    let result;
    switch (operation) {
      case 'GetUser':
        result = await getUser(params.UserId[0]);
        break;
      case 'CreateOrder':
        result = await createOrder(params);
        break;
      default:
        throw new Error('Unknown operation');
    }

    // Build SOAP response
    const builder = new Builder();
    const soapResponse = builder.buildObject({
      'soap:Envelope': {
        $: {
          'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/'
        },
        'soap:Body': {
          [`${operation}Response`]: result
        }
      }
    });

    response.setHeader('Content-Type', 'text/xml');
    return response.send(soapResponse);
  } catch (error) {
    const faultResponse = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <soap:Fault>
            <faultcode>soap:Server</faultcode>
            <faultstring>${error.message}</faultstring>
          </soap:Fault>
        </soap:Body>
      </soap:Envelope>
    `;
    response.setHeader('Content-Type', 'text/xml');
    return response.status(500).send(faultResponse);
  }
}
```

#### **4. Custom Binary Protocol APIs**

```javascript
// app/routes/api/binary.js
export default async function handler(request, response) {
  // Set binary content type
  response.setHeader('Content-Type', 'application/octet-stream');

  // Read binary data from request
  const buffer = request.body; // Express bodyParser with raw option

  // Process binary protocol
  const messageType = buffer.readUInt8(0);
  const messageLength = buffer.readUInt32BE(1);
  const payload = buffer.slice(5, 5 + messageLength);

  // Your custom binary protocol logic
  const result = await processBinaryMessage(messageType, payload);

  // Return binary response
  const responseBuffer = Buffer.alloc(result.length + 5);
  responseBuffer.writeUInt8(messageType, 0);
  responseBuffer.writeUInt32BE(result.length, 1);
  result.copy(responseBuffer, 5);

  return response.send(responseBuffer);
}
```

#### **5. Action-Based APIs** (No Resources)

```javascript
// app/routes/api/actions/send-email.js
export default async function handler(request, response) {
  const { to, subject, body } = request.body;

  await sendEmail({ to, subject, body });

  return response.json({
    success: true,
    message: 'Email sent'
  });
}

// app/routes/api/actions/generate-report.js
export default async function handler(request, response) {
  const { type, startDate, endDate } = request.body;

  const report = await generateReport(type, startDate, endDate);

  return response.json({
    success: true,
    reportUrl: report.url
  });
}
```

**URLs:** `/api/actions/send-email`, `/api/actions/generate-report`

#### **6. Event-Driven APIs** (Webhooks/Callbacks)

```javascript
// app/routes/api/events/subscribe.js
export default async function handler(request, response) {
  const { eventType, callbackUrl, secret } = request.body;

  // Register webhook
  await registerWebhook({
    eventType,
    callbackUrl,
    secret
  });

  return response.json({
    success: true,
    subscriptionId: generateId()
  });
}

// app/routes/api/events/trigger.js
export default async function handler(request, response) {
  const { event, data } = request.body;

  // Notify all subscribers
  const subscribers = await getSubscribers(event);

  for (const sub of subscribers) {
    await fetch(sub.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': sign(data, sub.secret)
      },
      body: JSON.stringify({ event, data })
    });
  }

  return response.json({ success: true, notified: subscribers.length });
}
```

---

## 🎯 **API Versioning - Multiple Strategies**

### **Strategy 1: URL Path Versioning** (Recommended)

```bash
# File structure for versioned APIs
app/routes/api/
├── v1/
│   ├── users.js          # GET /api/v1/users
│   └── products.js       # GET /api/v1/products
├── v2/
│   ├── users.js          # GET /api/v2/users (new fields)
│   └── products.js       # GET /api/v2/products (breaking changes)
└── v3/
    └── users.js          # GET /api/v3/users (major rewrite)
```

**Benefit:** Clear, explicit versioning in URL

### **Strategy 2: Header-Based Versioning**

```javascript
// app/routes/api/users.js
export default async function handler(request, response) {
  const apiVersion = request.get('API-Version') || '1';

  if (apiVersion === '1') {
    // V1 logic (old format)
    return response.json({ id, name, email });
  }

  if (apiVersion === '2') {
    // V2 logic (new format with additional fields)
    return response.json({ id, name, email, profile, settings });
  }

  return response.status(400).json({
    error: 'Unsupported API version'
  });
}
```

**Usage:** `curl -H "API-Version: 2" /api/users`

### **Strategy 3: Query Parameter Versioning**

```javascript
// app/routes/api/products.js
export default async function handler(request, response) {
  const version = request.query.version || '1';

  const data = await getProducts();

  if (version === '1') {
    return response.json(data); // Simple list
  }

  if (version === '2') {
    // V2 adds pagination and filtering
    return response.json({
      data,
      pagination: { page: 1, total: data.length }
    });
  }

  return response.status(400).json({ error: 'Invalid version' });
}
```

**Usage:** `GET /api/products?version=2`

### **Strategy 4: No Versioning** (Backward Compatibility)

```javascript
// app/routes/api/users.js
export default async function handler(request, response) {
  const user = await getUser(request.params.id);

  // Always add new fields without removing old ones
  return response.json({
    // V1 fields (always present)
    id: user.id,
    name: user.name,
    email: user.email,

    // V2 fields (added later, optional for old clients)
    profile: user.profile || null,
    settings: user.settings || {},

    // V3 fields (newest additions)
    preferences: user.preferences || {}
  });
}
```

**Benefit:** Single codebase, graceful degradation

---

## 📝 **Response Format Flexibility**

### **JSON (Default)**

```javascript
response.json({ success: true, data: { id: 1, name: "Product" } });
```

### **XML**

```javascript
response.setHeader('Content-Type', 'application/xml');
response.send(`
  <?xml version="1.0"?>
  <response>
    <success>true</success>
    <data>
      <id>1</id>
      <name>Product</name>
    </data>
  </response>
`);
```

### **Plain Text**

```javascript
response.setHeader('Content-Type', 'text/plain');
response.send('Operation completed successfully');
```

### **CSV**

```javascript
response.setHeader('Content-Type', 'text/csv');
response.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
response.send('id,name,price\n1,Product A,19.99\n2,Product B,29.99');
```

### **MessagePack (Binary)**

```javascript
import msgpack from 'msgpack-lite';

const data = { success: true, data: products };
const packed = msgpack.encode(data);

response.setHeader('Content-Type', 'application/x-msgpack');
response.send(packed);
```

### **Protocol Buffers**

```javascript
import protobuf from 'protobufjs';

const root = protobuf.loadSync('schema.proto');
const ProductList = root.lookupType('ProductList');

const message = ProductList.create({ products });
const buffer = ProductList.encode(message).finish();

response.setHeader('Content-Type', 'application/x-protobuf');
response.send(Buffer.from(buffer));
```

---

## 🎭 **Content Negotiation**

Handle multiple formats based on client preference:

```javascript
export default async function handler(request, response) {
  const data = await getProducts();

  // Check Accept header
  const accept = request.get('Accept');

  if (accept.includes('application/xml')) {
    return response
      .setHeader('Content-Type', 'application/xml')
      .send(convertToXML(data));
  }

  if (accept.includes('text/csv')) {
    return response
      .setHeader('Content-Type', 'text/csv')
      .send(convertToCSV(data));
  }

  // Default to JSON
  return response.json(data);
}
```

**Usage:**

```bash
curl -H "Accept: application/xml" /api/products  # Returns XML
curl -H "Accept: application/json" /api/products # Returns JSON
curl -H "Accept: text/csv" /api/products         # Returns CSV
```

---

## 🚀 **Key Takeaways**

✅ **PureMix is API-Architecture Agnostic** - Build REST, RPC, GraphQL, SOAP, or custom protocols
✅ **Full Express.js Access** - Use any Express middleware or pattern
✅ **Flexible Response Formats** - JSON, XML, binary, text, CSV, etc.
✅ **Multiple Versioning Strategies** - URL path, headers, query params, or backward compatibility
✅ **Handler Discovery** - Framework finds your handler automatically (default export, method names, etc.)
✅ **Single or Multiple Methods** - Handle one or all HTTP methods in a single file

**You have complete control over your API design** - the framework gets out of your way!

---

### REST API Patterns

#### **GET - List Resources**

**File:** `app/routes/api/products.js`

```javascript
import { connectDB, Product } from '../../lib/database.js';

export default async function handler(request, response) {
  // Only handle GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET']
    });
  }

  try {
    await connectDB();

    // Pagination
    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '20');
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (request.query.inStock) {
      filter.inStock = request.query.inStock === 'true';
    }
    if (request.query.minPrice) {
      filter.price = { $gte: parseFloat(request.query.minPrice) };
    }

    // Sorting
    const sort = {};
    if (request.query.sort) {
      const [field, order] = request.query.sort.split(':');
      sort[field] = order === 'desc' ? -1 : 1;
    }

    const products = await Product.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Product.countDocuments(filter);

    return response.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

**Usage:**

```bash
# Basic request
GET /api/products

# With pagination
GET /api/products?page=2&limit=10

# With filtering
GET /api/products?inStock=true&minPrice=100

# With sorting
GET /api/products?sort=price:desc
```

#### **GET - Single Resource**

**File:** `app/routes/api/products/[id].js`

```javascript
import { connectDB, Product } from '../../../lib/database.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET']
    });
  }

  try {
    await connectDB();

    const product = await Product.findById(request.params.id);

    if (!product) {
      return response.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return response.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

**Usage:**

```bash
GET /api/products/507f1f77bcf86cd799439011
```

#### **POST - Create Resource**

**File:** `app/routes/api/products.js`

```javascript
import { connectDB, Product } from '../../lib/database.js';

export default async function handler(request, response) {
  const method = request.method;

  // Handle GET (list products)
  if (method === 'GET') {
    // ... GET logic from above
  }

  // Handle POST (create product)
  if (method === 'POST') {
    try {
      const { name, price, description, inStock } = request.body;

      // Validation
      if (!name || !price) {
        return response.status(400).json({
          success: false,
          error: 'Name and price are required'
        });
      }

      if (typeof price !== 'number' || price < 0) {
        return response.status(400).json({
          success: false,
          error: 'Price must be a positive number'
        });
      }

      await connectDB();

      // Create product
      const product = await Product.create({
        name,
        price,
        description: description || '',
        inStock: inStock !== undefined ? inStock : true
      });

      return response.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Method not allowed
  return response.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'POST']
  });
}
```

**Usage:**

```bash
POST /api/products
Content-Type: application/json

{
  "name": "Wireless Mouse",
  "price": 29.99,
  "description": "Ergonomic wireless mouse",
  "inStock": true
}
```

**JavaScript fetch:**

```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Wireless Mouse',
    price: 29.99,
    description: 'Ergonomic wireless mouse',
    inStock: true
  })
});

const result = await response.json();
console.log(result);
```

#### **PUT/PATCH - Update Resource**

**File:** `app/routes/api/products/[id].js`

```javascript
import { connectDB, Product } from '../../../lib/database.js';

export default async function handler(request, response) {
  const method = request.method;
  const productId = request.params.id;

  // Handle GET
  if (method === 'GET') {
    // ... GET logic from above
  }

  // Handle PUT/PATCH (update)
  if (method === 'PUT' || method === 'PATCH') {
    try {
      await connectDB();

      // Check if product exists
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return response.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Validate updates
      const updates = request.body;
      if (updates.price !== undefined) {
        if (typeof updates.price !== 'number' || updates.price < 0) {
          return response.status(400).json({
            success: false,
            error: 'Price must be a positive number'
          });
        }
      }

      // Update product
      const product = await Product.findByIdAndUpdate(
        productId,
        updates,
        { new: true, runValidators: true }
      );

      return response.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Handle DELETE
  if (method === 'DELETE') {
    try {
      await connectDB();

      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return response.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      return response.status(200).json({
        success: true,
        data: { id: productId },
        message: 'Product deleted successfully'
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Method not allowed
  return response.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'PUT', 'PATCH', 'DELETE']
  });
}
```

**Usage:**

```bash
# Update product
PUT /api/products/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "price": 24.99,
  "inStock": false
}

# Delete product
DELETE /api/products/507f1f77bcf86cd799439011
```

### API Authentication

#### **Token-Based Authentication**

**File:** `app/lib/api-auth.js`

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function requireAPIAuth(request) {
  // Get token from header
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  return decoded;
}
```

**Protected API endpoint:**

```html
<imports>
  import { requireAPIAuth } from '../../../lib/api-auth'
  import { connectDB, Product } from '../../../lib/database'
</imports>

<loader>
  async function loadAPI(request) {
    try {
      // Require authentication
      const { userId } = requireAPIAuth(request);

      await connectDB();
      const products = await Product.find({ userId });

      return {
        json: {
          success: true,
          data: products
        }
      };
    } catch (error) {
      return {
        json: {
          success: false,
          error: error.message
        },
        status: 401
      };
    }
  }
</loader>
```

**Usage:**

```bash
GET /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JavaScript fetch:**

```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
```

### API Response Formats

#### **Standard Success Response**

```javascript
return {
  json: {
    success: true,
    data: { /* your data */ },
    message: 'Optional success message'
  },
  status: 200 // or 201 for created
};
```

#### **Standard Error Response**

```javascript
return {
  json: {
    success: false,
    error: 'Error message',
    code: 'ERROR_CODE', // Optional error code
    details: {} // Optional error details
  },
  status: 400 // 400, 401, 403, 404, 500, etc.
};
```

#### **Paginated Response**

```javascript
return {
  json: {
    success: true,
    data: [...items],
    pagination: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: false
    }
  }
};
```

### HTTP Status Codes

Use appropriate status codes:

```javascript
// Success
200 - OK (successful GET, PUT, PATCH, DELETE)
201 - Created (successful POST)
204 - No Content (successful DELETE with no response body)

// Client Errors
400 - Bad Request (validation error)
401 - Unauthorized (authentication required)
403 - Forbidden (authenticated but not authorized)
404 - Not Found (resource doesn't exist)
422 - Unprocessable Entity (validation error with details)

// Server Errors
500 - Internal Server Error (unexpected error)
503 - Service Unavailable (temporary issue)
```

### API Versioning

Create versioned API routes:

```bash
app/routes/api/v1/products.js    → /api/v1/products
app/routes/api/v2/products.js    → /api/v2/products
```

### API Rate Limiting

**File:** `app/lib/rate-limiter.js`

```javascript
const requests = new Map();

export function checkRateLimit(request, limit = 100, window = 60000) {
  const ip = request.ip || request.connection.remoteAddress;
  const now = Date.now();

  if (!requests.has(ip)) {
    requests.set(ip, []);
  }

  const userRequests = requests.get(ip);

  // Remove old requests outside the time window
  const recentRequests = userRequests.filter(time => now - time < window);

  if (recentRequests.length >= limit) {
    throw new Error('Rate limit exceeded');
  }

  recentRequests.push(now);
  requests.set(ip, recentRequests);

  return {
    remaining: limit - recentRequests.length,
    reset: now + window
  };
}
```

**Usage in API:**

```javascript
// app/routes/api/products.js
import { checkRateLimit } from '../../lib/rate-limiter.js';

export default async function handler(request, response) {
  try {
    // Check rate limit (100 requests per minute)
    const rateLimit = checkRateLimit(request, 100, 60000);

    // Your API logic here
    const data = await getData();

    return response.status(200)
      .set({
        'X-RateLimit-Remaining': rateLimit.remaining,
        'X-RateLimit-Reset': rateLimit.reset
      })
      .json({
        success: true,
        data
      });
  } catch (error) {
    if (error.message === 'Rate limit exceeded') {
      return response.status(429).json({
        success: false,
        error: 'Too many requests'
      });
    }

    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### CORS Configuration

**File:** `puremix.config.js`

```javascript
export default {
  // CORS settings
  cors: {
    enabled: true,
    origin: '*', // or ['https://yoursite.com']
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
};
```

**Manual CORS in API:**

```javascript
export default async function handler(request, response) {
  const data = await getData();

  return response.status(200)
    .set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    .json({
      success: true,
      data
    });
}
```

### Webhook Endpoints

**File:** `app/routes/api/webhooks/stripe.js`

```javascript
import crypto from 'crypto';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    // Verify webhook signature
    const signature = request.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const event = verifyStripeSignature(
      request.body,
      signature,
      webhookSecret
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.failed':
        await handlePaymentFailure(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return response.status(200).json({
      success: true,
      received: true
    });
  } catch (error) {
    return response.status(400).json({
      success: false,
      error: error.message
    });
  }
}

function verifyStripeSignature(payload, signature, secret) {
  // Stripe signature verification logic
  // ...
  return payload; // Return parsed event
}

async function handlePaymentSuccess(paymentIntent) {
  // Process successful payment
}

async function handlePaymentFailure(paymentIntent) {
  // Handle failed payment
}
```

### API Documentation Example

**File:** `app/routes/api/docs.js`

```javascript
export default async function handler(request, response) {
  return response.status(200).json({
    version: '1.0',
    endpoints: {
      products: {
        list: {
          method: 'GET',
          path: '/api/products',
          description: 'Get list of products',
          query: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 20)',
            sort: 'Sort field and order (e.g., price:desc)',
            inStock: 'Filter by stock status (true/false)'
          },
          response: {
            success: true,
            data: [],
            pagination: {}
          }
        },
        get: {
          method: 'GET',
          path: '/api/products/:id',
          description: 'Get single product',
          response: {
            success: true,
            data: {}
          }
        },
        create: {
          method: 'POST',
          path: '/api/products',
          description: 'Create new product',
          body: {
            name: 'Product name (required)',
            price: 'Product price (required)',
            description: 'Product description',
            inStock: 'Stock status (default: true)'
          },
          response: {
            success: true,
            data: {},
            message: 'Product created successfully'
          }
        }
      }
    }
  });
}
```

### Python API Example

APIs can also be built with Python! Use `.py` files with a `main(context)` function.

**File:** `app/routes/api/data.py`

```python
#!/usr/bin/env python3
import json

def main(context):
    """
    Python API handler function

    Args:
        context: Dict containing request, response, etc.

    Returns:
        Dict with status, headers, and body
    """
    request = context.get('request', {})
    method = request.get('method', 'GET').upper()

    if method != 'POST':
        return {
            'status': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': 'Method not allowed',
                'allowed': ['POST']
            })
        }

    try:
        # Process data with Python libraries
        import pandas as pd
        import numpy as np

        data = request.get('body', {})
        df = pd.DataFrame(data.get('data', []))

        result = {
            'success': True,
            'statistics': {
                'mean': float(df.mean().values[0]) if len(df) > 0 else 0,
                'count': len(df),
                'columns': list(df.columns)
            }
        }

        return {
            'status': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(result)
        }

    except Exception as error:
        return {
            'status': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': str(error)
            })
        }
```

**Usage:**

```bash
POST /api/data
Content-Type: application/json

{
  "data": [
    {"value": 10},
    {"value": 20},
    {"value": 30}
  ]
}
```

### Complete API Example

**File:** `app/routes/api/users/[id].js`

```javascript
import { connectDB, User } from '../../../lib/database.js';
import { requireJWTAuth } from '../../../lib/jwt-auth.js';
import { checkRateLimit } from '../../../lib/rate-limiter.js';

export default async function handler(request, response) {
  const method = request.method;
  const userId = request.params.id;

  try {
    // Rate limiting
    checkRateLimit(request, 100, 60000);

    // Authentication
    const auth = requireJWTAuth(request);

    await connectDB();

    // Handle GET - Get user profile
    if (method === 'GET') {
      const user = await User.findById(userId);

      if (!user) {
        return response.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Authorization (can only view own profile)
      if (user._id.toString() !== auth.userId) {
        return response.status(403).json({
          success: false,
          error: 'Forbidden'
        });
      }

      return response.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    }

    // Handle PUT - Update user
    if (method === 'PUT') {
      const user = await User.findById(userId);

      if (!user) {
        return response.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user._id.toString() !== auth.userId) {
        return response.status(403).json({
          success: false,
          error: 'Forbidden'
        });
      }

      // Update fields
      if (request.body.name) user.name = request.body.name;
      if (request.body.email) user.email = request.body.email;

      await user.save();

      return response.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        message: 'User updated successfully'
      });
    }

    // Handle DELETE - Delete user
    if (method === 'DELETE') {
      const user = await User.findById(userId);

      if (!user) {
        return response.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user._id.toString() !== auth.userId) {
        return response.status(403).json({
          success: false,
          error: 'Forbidden'
        });
      }

      await User.findByIdAndDelete(userId);

      return response.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    }

    // Method not allowed
    return response.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET', 'PUT', 'DELETE']
    });

  } catch (error) {
    const status = error.message.includes('token') ? 401 :
                   error.message.includes('Rate limit') ? 429 : 500;

    return response.status(status).json({
      success: false,
      error: error.message
    });
  }
}
```

---

## 🎯 Best Practices

### ✅ DO

- Use **loaders** for data fetching
- **Always include a loader** to handle action results
- Use **server functions** for mutations
- Keep Python modules in `app/services/`
- Use **components** for reusable UI
- Handle **errors gracefully**
- Validate **user input**
- Use **TypeScript** for type safety
- Use **sessions/cookies** for web auth
- Use **JWT tokens** for API auth
- Return **{ success, data, error }** from actions
- Return **{ json: {...}, status: 200 }** from APIs
- Use **proper HTTP status codes** (200, 201, 400, 401, 404, 500)
- Implement **rate limiting** for public APIs
- Version your APIs (`/api/v1/...`)
- Document your API endpoints
- Use **CORS** for cross-origin API access

### ❌ DON'T

- Don't fetch data in templates
- Don't use string literals in templates: `{condition ? 'yes' : 'no'}` ❌
- Don't expose secrets in client scripts
- Don't forget to validate form data
- Don't use TypeScript interfaces in loader functions (use plain JS)
- Don't mix Python and JavaScript in same function

---

## 📚 Quick Reference

### Request Object

```javascript
request.params    // Route parameters
request.query     // Query strings
request.body      // POST body
request.cookies   // Cookies
request.session   // Session
request.user      // User (if authenticated)
request.files     // Uploaded files
```

### Loader Return

```javascript
return {
  data: {},        // Required: template data
  state: {},       // Optional: UI state
  redirect: '/path' // Optional: redirect
}
```

### Action Return

```javascript
return {
  success: true,   // Status
  data: {},        // Response data
  error: 'message' // Error message
}
```

### PureMix Browser API

```javascript
PureMix.data.loaderName.data  // Access loader data
PureMix.call('functionName', data)  // Call server function
```

### API Response

```javascript
// JSON API response
return {
  json: { success: true, data: {} },
  status: 200,
  headers: { 'X-Custom': 'value' }
}
```

---

## 🆘 Troubleshooting

### Common Issues

**1. Template not rendering**

- Check if using HTML elements in expressions: `{condition ? <div>Yes</div> : <span>No</span>}`
- Avoid string literals in templates

**2. Action result not showing**

- **Add a loader** - Actions require a loader to handle results
- Check loader receives `actionResult` parameter
- Use `actionResult?.success` to check action status

**3. Server function not found**

- Check function name matches `onsubmit="functionName"`
- Ensure `<script server>` tag is present

**4. Component not found**

- Check import path: `import Component from '../components/Component.puremix'`
- Ensure `.puremix` extension in import

**5. Python function fails**

- Check Python is installed: `python3 --version`
- Check return value is a dict: `return {'success': True}`

**6. Authentication not working**

- Check cookie is being set: `request.res.cookie(...)`
- Check cookie name matches: `request.cookies.sessionId`

**7. API returns HTML instead of JSON**

- Check loader returns `{ json: {...} }` not `{ data: {...} }`
- Ensure no HTML template in API route file

**8. API CORS errors**

- Add CORS headers in response or config
- Check `Access-Control-Allow-Origin` header

**9. API rate limiting not working**

- Check rate limiter is called before API logic
- Verify IP extraction: `request.ip`
