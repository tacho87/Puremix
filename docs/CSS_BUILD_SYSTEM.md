# CSS Build System Guide

PureMix includes a comprehensive CSS build system that supports Tailwind CSS, SCSS/SASS, PostCSS, and automatic minification for production builds.

## Overview

The CSS build system automatically detects and processes:

- **Tailwind CSS**: Utility-first CSS framework with JIT compilation
- **SCSS/SASS**: CSS preprocessor with variables, mixins, and nesting
- **PostCSS**: CSS transformation and optimization pipeline
- **Regular CSS**: Direct CSS file processing with minification

## Setup and Configuration

### 1. Basic Tailwind CSS Setup

#### Install Dependencies
```bash
npm install -D tailwindcss @tailwindcss/forms @tailwindcss/typography postcss autoprefixer
```

#### Configure Tailwind
Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{puremix,html,js}",
    "./app/components/**/*.{puremix,html,js}",
    "./app/routes/**/*.{puremix,html,js}",
    "./app/views/**/*.{puremix,html,js}"
  ],
  theme: {
    extend: {
      colors: {
        primary: { /* custom colors */ }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries')
  ],
  darkMode: 'class'
}
```

#### Configure PostCSS
Create `postcss.config.js`:
```javascript
export default {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true
        }]
      }
    } : {})
  }
}
```

### 2. SCSS/SASS Setup

#### Install Dependencies
```bash
npm install -D sass postcss-scss
```

#### Create SCSS Files
Create your SCSS files in `app/public/css/`:
```scss
// app/public/css/styles.scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// Import custom mixins
@import './_mixins.scss';

// Custom styles
@layer components {
  .btn {
    @apply inline-flex items-center px-4 py-2 border rounded-md;
    
    &:hover {
      @apply bg-gray-50;
    }
  }
}
```

## CSS Build Scripts

The build system integrates with PureMix build process and provides dedicated npm scripts:

### Package.json Scripts
```json
{
  "scripts": {
    "css:build": "npm run css:tailwind && npm run css:scss",
    "css:tailwind": "tailwindcss -i ./app/public/css/styles.css -o ./app/public/css/output.css --postcss",
    "css:scss": "sass ./app/public/css/styles.scss ./app/public/css/styles.css --style=expanded",
    "css:watch": "npm run css:tailwind -- --watch",
    "css:minify": "NODE_ENV=production npm run css:build",
    "css:dev": "npm run css:tailwind"
  }
}
```

### Usage Examples

```bash
# Build CSS for development
npm run css:dev

# Watch CSS files for changes (development)
npm run css:watch

# Build and minify CSS for production
npm run css:minify

# Full CSS build (SCSS + Tailwind)
npm run css:build
```

## File Structure

```
app/
└── public/
    └── css/
        ├── styles.scss          # Main SCSS entry point
        ├── _mixins.scss          # SCSS mixins and variables
        ├── _variables.scss       # SCSS variables
        ├── components.scss       # Component-specific styles
        └── output.css           # Compiled Tailwind output
```

## Build Process Integration

### Automatic CSS Processing
The CSS build system automatically runs during `puremix build`:

```bash
# Full build with CSS processing
puremix build

# Build with CSS analysis
puremix build --analyze

# Build with minification
puremix build --minify
```

### Build Pipeline

1. **SCSS Processing**: Compile `.scss` files to `.css`
2. **Tailwind Build**: Process utility classes and components
3. **PostCSS Transform**: Apply plugins (autoprefixer, cssnano)
4. **Minification**: Compress CSS for production
5. **Analysis**: Generate CSS build statistics

## Advanced Configuration

### Custom Tailwind Configuration

#### Extended Color Palette
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        900: '#1e3a8a'
      }
    }
  }
}
```

#### Custom Components
```javascript
// tailwind.config.js
plugins: [
  require('@tailwindcss/forms')({
    strategy: 'class'
  }),
  // Custom plugin
  function({ addComponents, theme }) {
    addComponents({
      '.btn-primary': {
        backgroundColor: theme('colors.primary.500'),
        color: 'white',
        padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
        borderRadius: theme('borderRadius.md'),
        
        '&:hover': {
          backgroundColor: theme('colors.primary.600')
        }
      }
    })
  }
]
```

### SCSS Mixins and Variables

#### Define Variables
```scss
// _variables.scss
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}
```

#### Create Mixins
```scss
// _mixins.scss
@mixin button-variant($bg-color, $text-color) {
  background-color: $bg-color;
  color: $text-color;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: darken($bg-color, 10%);
  }
}

@mixin card {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-md);
}
```

#### Use in Components
```scss
// components.scss
.btn-primary {
  @include button-variant(var(--color-primary), white);
}

.card {
  @include card;
  
  .card-header {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: var(--spacing-sm);
  }
}
```

## Development Workflow

### 1. Setup CSS Build
```bash
# Install dependencies
npm install

# Configure Tailwind and PostCSS
# Create tailwind.config.js and postcss.config.js

# Build CSS
npm run css:build
```

### 2. Development with Watch Mode
```bash
# Terminal 1: PureMix development server
npm run dev

# Terminal 2: CSS watch mode
npm run css:watch
```

### 3. Production Build
```bash
# Build with CSS minification
puremix build --minify

# Or use CSS script
npm run css:minify
```

## CSS Optimization Features

### PurgeCSS Integration
Tailwind CSS automatically removes unused CSS classes in production:

```javascript
// tailwind.config.js
content: [
  "./app/**/*.{puremix,html,js}",
  "./app/components/**/*.{puremix,html,js}",
  "./app/routes/**/*.{puremix,html,js}"
]
```

### CSS Minification
Production builds automatically minify CSS using cssnano:

- Remove comments
- Collapse whitespace
- Optimize selectors
- Minify values

### Browser Compatibility
Autoprefixer ensures cross-browser compatibility:

```css
/* Input */
.user-select-none {
  user-select: none;
}

/* Output */
.user-select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

## CSS Analysis and Debugging

### Build Analysis
The build system generates detailed CSS analysis:

```json
{
  "files": [
    {
      "name": "output.css",
      "size": 25600,
      "sizeKB": 25.6
    }
  ],
  "totalSize": 25600,
  "totalSizeKB": 25.6,
  "fileCount": 1
}
```

### Debug Mode
Enable verbose CSS processing:

```bash
# Debug CSS build
DEBUG=css npm run css:build
```

### Common Issues

#### Tailwind Not Processing Classes
```javascript
// Ensure content paths are correct in tailwind.config.js
content: [
  "./app/**/*.{puremix,html,js}"  // Include .puremix files
]
```

#### SCSS Import Errors
```scss
// Use relative imports
@import './variables';
@import './mixins';
```

#### PostCSS Plugin Conflicts
```javascript
// Order plugins correctly in postcss.config.js
plugins: {
  'postcss-import': {},      // First
  tailwindcss: {},           // Then Tailwind
  autoprefixer: {},          // Then autoprefixer
  'cssnano': {}              // Last (production only)
}
```

## Best Practices

### 1. Organization
- Separate concerns with multiple SCSS files
- Use meaningful file names (`_variables.scss`, `_mixins.scss`)
- Group related styles together

### 2. Performance
- Enable CSS purging in production
- Minimize CSS file size
- Use efficient selectors

### 3. Maintainability
- Document custom mixins and variables
- Follow consistent naming conventions
- Use semantic class names

### 4. Development
- Use watch mode during development
- Test in different browsers
- Validate CSS output

## Troubleshooting

### CSS Not Building
```bash
# Check if dependencies are installed
npm list tailwindcss postcss sass

# Reinstall if missing
npm install -D tailwindcss postcss sass
```

### Tailwind Classes Not Working
```bash
# Rebuild CSS with Tailwind
npm run css:tailwind

# Check content paths in tailwind.config.js
```

### SCSS Compilation Errors
```bash
# Check SCSS syntax
npx sass app/public/css/styles.scss --check

# Validate imports
```

## Next Steps

- Set up your preferred CSS framework (Tailwind, Bootstrap, etc.)
- Configure custom themes and color palettes
- Implement responsive design patterns
- Add CSS animations and transitions
- Optimize for production deployment

For more advanced configuration options, see the [Tailwind CSS Documentation](https://tailwindcss.com/docs) and [Sass Documentation](https://sass-lang.com/documentation).