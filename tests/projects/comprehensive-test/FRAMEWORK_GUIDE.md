# PureMix Framework Guide

**This is a reference guide for the PureMix framework.**

## 🚀 Quick Start

PureMix is a server-side rendering framework that mixes JavaScript/TypeScript/Python in `.puremix` files.

### Basic .puremix File Structure

```html
<layout>main</layout>

<imports>
  import { getUser } from '../controllers/users'
  import UserCard from '../components/UserCard.puremix'
</imports>

<loader>
  async function loadPage(request, actionResult) {
    const user = await getUser(request.params.id);
    return { data: { user } };
  }
</loader>

<div>
  <h1>{loadPage.data.user.name}</h1>
  <UserCard user={loadPage.data.user} />
</div>

<script server>
  async function updateUser(formData, request) {
    const user = await saveUser(formData);
    return { success: true, user };
  }
</script>
```

## 🗂️ Project Structure

```
your-project/
├── app/
│   ├── routes/          # File-based routing
│   │   ├── index.puremix       # /
│   │   ├── about.puremix       # /about
│   │   ├── [id].puremix        # /:id (dynamic)
│   │   └── api/                # API routes
│   ├── components/      # Reusable .puremix components
│   ├── layouts/         # Layout templates
│   └── services/        # Business logic (Python/JS/TS)
├── public/              # Static assets
└── puremix.config.js    # Framework configuration
```

## 📘 Key Concepts

### File-Based Routing

Routes are automatically mapped from file structure:

- `routes/index.puremix` → `/`
- `routes/about.puremix` → `/about`
- `routes/users/[id].puremix` → `/users/:id`
- `routes/blog/[...slug].puremix` → `/blog/*`

### Loaders

Loaders fetch data on the server before rendering:

```html
<loader>
  async function loadPage(request, actionResult) {
    const data = await fetchData();
    return { data };
  }
</loader>
```

### Server Functions

Handle form submissions and AJAX calls:

```html
<form onsubmit="handleSubmit">
  <input name="email">
  <button type="submit">Submit</button>
</form>

<script server>
  async function handleSubmit(formData, request) {
    const email = formData.get('email');
    return { success: true };
  }
</script>
```

### Components

Reusable .puremix files with props:

```html
<!-- UserCard.puremix -->
<div class="card">
  <h3>{user.name}</h3>
  <p>{user.email}</p>
</div>

<!-- Usage -->
<UserCard user={loadPage.data.user} />
```

### Python Integration

Call Python functions directly:

```html
<script server lang="python">
def analyze_data(data, js_context=None):
    import pandas as pd
    df = pd.DataFrame(data)
    return {'result': df.describe().to_dict()}
</script>
```

## 🔐 Authentication

PureMix supports multiple authentication patterns:

- **Session-based**: `request.session.userId`
- **JWT**: Token-based authentication
- **Cookies**: Custom cookie handling
- **Hybrid**: Mix multiple strategies

## 📚 Learn More

- [Official Documentation](https://puremix.dev)
- [GitHub Repository](https://github.com/puremix/puremix)
- [Examples](https://github.com/puremix/examples)

---

*This guide was auto-generated during project setup.*
