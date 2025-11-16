#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CreateOptions {
  template?: string;
  packageManager?: string;
  skipInstall?: boolean;
  typescript?: boolean;
  interactive?: boolean;
}

// Template descriptions for interactive selection
const TEMPLATE_DESCRIPTIONS = {
  basic: {
    name: 'Basic Template',
    description: 'Modern template with Tailwind CSS, animations, and interactive components',
    features: [
      '🎨 Tailwind CSS with custom animations',
      '⚡ Interactive components and forms',
      '📱 Mobile-responsive design',
      '🔧 SCSS mixins and utilities',
      '📊 Contact forms with validation'
    ],
    recommended: 'For most projects, rapid prototyping, and production applications'
  },
  default: {
    name: 'Default Template',
    description: 'Clean, minimal template with essential PureMix features',
    features: [
      '🏗️ Basic PureMix structure',
      '📝 Essential layouts and components',
      '⚙️ Production-ready configuration',
      '🔧 Tailwind CSS integration',
      '📦 Minimal dependencies'
    ],
    recommended: 'For developers who want to start from a clean foundation'
  },
  minimal: {
    name: 'Minimal Template',
    description: 'Ultra-lightweight template with zero dependencies',
    features: [
      '🚀 Zero external dependencies',
      '📦 Pure CSS without frameworks',
      '⚡ Blazing fast setup',
      '🎯 Simple and clean structure',
      '🔧 Basic component system'
    ],
    recommended: 'For learning, simple projects, or maximum performance'
  }
};

// Interactive prompt function
function askQuestion(query: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Display template selection menu
async function selectTemplateInteractively(availableTemplates: string[]): Promise<string> {
  console.log('\n🎨 Available PureMix Templates:\n');
  
  availableTemplates.forEach((template, index) => {
    const desc = TEMPLATE_DESCRIPTIONS[template as keyof typeof TEMPLATE_DESCRIPTIONS];
    if (desc) {
      console.log(`${index + 1}. ${desc.name}`);
      console.log(`   ${desc.description}`);
      console.log('   Features:');
      desc.features.forEach(feature => {
        console.log(`     ${feature}`);
      });
      console.log(`   💡 ${desc.recommended}\n`);
    } else {
      console.log(`${index + 1}. ${template}\n`);
    }
  });

  const answer = await askQuestion('Select a template (enter number or name): ');
  
  // Check if answer is a number
  const numAnswer = parseInt(answer);
  if (!isNaN(numAnswer) && numAnswer > 0 && numAnswer <= availableTemplates.length) {
    return availableTemplates[numAnswer - 1];
  }
  
  // Check if answer is a template name
  if (availableTemplates.includes(answer)) {
    return answer;
  }
  
  // Default to first template if invalid input
  console.log(`❌ Invalid selection. Using default template: ${availableTemplates[0]}`);
  return availableTemplates[0];
}

export async function createProject(projectName: string, options: CreateOptions = {}) {
  const {
    template = null,
    packageManager = 'npm',
    skipInstall = false,
    typescript = false,
    interactive = true  // Default to interactive for better UX
  } = options;

  const projectPath = path.resolve(projectName);
  
  console.log('🚀 Creating PureMix project...');
  console.log(`📁 Project: ${projectName}`);
  
  // Check if directory exists (allow current directory if it's empty)
  if (fs.existsSync(projectPath)) {
    // Allow creating in current directory if it's empty
    if (projectName === '.') {
      const files = fs.readdirSync(projectPath);
      if (files.length > 0) {
        throw new Error(`Current directory is not empty. Cannot create project here.`);
      }
    } else {
      throw new Error(`Directory '${projectName}' already exists`);
    }
  }
  
  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });
  
  // Copy template files - use dynamic template discovery
  const templatesDir = path.join(__dirname, '..', 'templates');
  
  // Dynamically discover available templates
  const availableTemplates = getAvailableTemplates(templatesDir);
  
  // Interactive template selection if no template specified or interactive mode
  let selectedTemplate: string | null = template;
  if (!template || interactive) {
    selectedTemplate = await selectTemplateInteractively(availableTemplates);
  }
  
  if (!selectedTemplate) {
    throw new Error('No template selected');
  }
  
  const templatePath = path.join(templatesDir, selectedTemplate);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template '${selectedTemplate}' not found. Available templates: ${availableTemplates.join(', ')}`);
  }
  
  console.log(`🎨 Template: ${selectedTemplate}`);
  console.log('📋 Copying template files...');
  copyDirectory(templatePath, projectPath);
  
  // Copy ecosystem.config.js from templates root
  const ecosystemSrc = path.join(templatesDir, 'ecosystem.config.js');
  const ecosystemDest = path.join(projectPath, 'ecosystem.config.js');
  if (fs.existsSync(ecosystemSrc)) {
    fs.copyFileSync(ecosystemSrc, ecosystemDest);
    console.log('📦 Added PM2 ecosystem configuration');
  }
  
  // Copy .gitignore from templates root if it doesn't exist in template
  const gitignoreDest = path.join(projectPath, '.gitignore');
  if (!fs.existsSync(gitignoreDest)) {
    const gitignoreSrc = path.join(templatesDir, '.gitignore');
    if (fs.existsSync(gitignoreSrc)) {
      fs.copyFileSync(gitignoreSrc, gitignoreDest);
      console.log('📋 Added .gitignore with logs directory ignored');
    }
  }

  // Copy FRAMEWORK_GUIDE.md from framework root
  const frameworkGuideSrc = path.join(__dirname, '..', 'FRAMEWORK_GUIDE.md');
  const frameworkGuideDest = path.join(projectPath, 'FRAMEWORK_GUIDE.md');
  if (fs.existsSync(frameworkGuideSrc)) {
    fs.copyFileSync(frameworkGuideSrc, frameworkGuideDest);
    console.log('📚 Added PureMix Framework Guide');
  }

  // Generate PROJECT_STRUCTURE.md
  generateProjectStructure(projectPath, selectedTemplate!);

  // Update package.json for config-only approach
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.name = projectName;
    
    // Update scripts to use CLI commands directly (no server.js needed)
    packageJson.scripts = {
      'dev': 'puremix dev',
      'build': 'puremix build',
      'start': 'puremix start',
      'doctor': 'puremix doctor',
      'generate-docs': 'puremix generate-docs',
      ...packageJson.scripts
    };
    
    // Add TypeScript support if requested
    if (typescript) {
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        'typescript': '^5.6.3',
        '@types/node': '^22.0.0'
      };
      packageJson.scripts = {
        ...packageJson.scripts,
        'type-check': 'tsc --noEmit'
      };
    }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  
  // Remove server.js if it exists (config-only approach)
  const serverJsPath = path.join(projectPath, 'server.js');
  if (fs.existsSync(serverJsPath)) {
    fs.unlinkSync(serverJsPath);
    console.log('🗑️  Removed server.js (using config-only approach)');
  }
  
  // Create TypeScript config if requested
  if (typescript) {
    createTypeScriptConfig(projectPath);
  }
  
  // Install dependencies
  if (!skipInstall) {
    console.log('📦 Installing dependencies...');
    try {
      const installCommand = packageManager === 'yarn' ? 'yarn install' : 'npm install';
      execSync(installCommand, { 
        cwd: projectPath, 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes
      });
    } catch (error) {
      console.warn('⚠️  Dependency installation failed. You can install manually later.');
      console.warn(`   cd ${projectName} && ${packageManager === 'yarn' ? 'yarn' : 'npm install'}`);
    }
  }

  // Success message
  console.log('\\n✅ Project created successfully!\\n');
  console.log('🚀 Next steps:');
  console.log(`   cd ${projectName}`);
  
  if (skipInstall) {
    console.log(`   ${packageManager === 'yarn' ? 'yarn' : 'npm install'}`);
  }
  
  console.log(`   ${packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'}`);
  console.log('\\n📖 Your app will be available at http://localhost:3000');
  
  // Template-specific instructions
  showTemplateInstructions(template);
}

/**
 * getAvailableTemplates - Dynamically discover templates
 * 
 * INPUT: templatesDir (path to templates directory)
 * OUTPUT: Array of template names (folder names)
 * GOAL: Auto-detect available templates instead of hardcoding
 * DEPENDENCIES: File system
 */
function getAvailableTemplates(templatesDir: string): string[] {
  if (!fs.existsSync(templatesDir)) {
    console.warn(`Templates directory not found: ${templatesDir}`);
    return [];
  }
  
  try {
    return fs.readdirSync(templatesDir)
      .filter(item => {
        const itemPath = path.join(templatesDir, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .sort(); // Alphabetical order
  } catch (error) {
    console.warn(`Failed to read templates directory: ${(error as Error).message}`);
    return [];
  }
}

function copyDirectory(src, dest) {
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createTypeScriptConfig(projectPath) {
  const tsconfigContent = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      allowJs: true,
      checkJs: false,
      strict: true,
      noImplicitAny: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      exactOptionalPropertyTypes: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: false,
      declarationMap: false,
      sourceMap: true,
      outDir: './dist',
      rootDir: './app',
      baseUrl: '.',
      paths: {
        '@/*': ['./app/*'],
        '@/controllers/*': ['./app/controllers/*'],
        '@/models/*': ['./app/models/*'],
        '@/services/*': ['./app/services/*'],
        '@/utils/*': ['./app/utils/*']
      }
    },
    include: [
      'app/**/*',
      '*.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      '**/*.puremix'
    ]
  };
  
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));
  
  console.log('📝 Created TypeScript configuration');
}



function generateProjectStructure(projectPath: string, template: string) {
  const projectStructureContent = `# Project Structure

This document outlines the organization of your PureMix project.

## Directory Layout

\`\`\`
${template === 'default' ? `app/
├── routes/              # Route files (.puremix)
│   └── index.puremix    # Home page (/)
├── components/          # Reusable components (.puremix)
├── public/              # Static assets
│   └── css/
│       └── style.css    # Stylesheets
└── views/               # Layout templates
    └── layouts/
        └── main.html    # Main layout` : template === 'minimal' ? `app/
├── routes/              # Route files (.puremix)
│   ├── index.puremix    # Home page (/)
│   ├── about.puremix    # /about route
│   └── contact.puremix  # /contact route
├── components/          # Reusable components (.puremix)
│   └── SimpleCard.puremix
├── public/              # Static assets
│   ├── css/
│   │   └── style.css
│   ├── images/
│   └── js/
└── views/               # Layout templates
    └── layouts/
        └── main.html` : `app/
├── routes/              # Route files (.puremix)
│   └── index.puremix    # Home page (/)
├── components/          # Reusable components (.puremix)
├── controllers/         # Business logic (.js, .ts, .py)
├── models/              # Database schemas
├── services/            # External API integrations
├── utils/               # Utility functions
├── public/              # Static assets
│   ├── css/
│   ├── images/
│   └── js/
└── views/               # Layout templates
    └── layouts/
        └── main.puremix`}

puremix.config.js       # Framework configuration
package.json            # Dependencies and scripts
FRAMEWORK_GUIDE.md      # PureMix framework documentation
README.md               # Project documentation
\`\`\`

## Key Directories

### \`app/routes/\`
Contains all route files using the \`.puremix\` extension. File names determine the URL structure:

- \`index.puremix\` → \`/\`
- \`about.puremix\` → \`/about\`
- \`[id].puremix\` → \`/:id\` (dynamic route)
- \`[...slug].puremix\` → \`/*\` (catch-all route)

### \`app/components/\`
Reusable \`.puremix\` components that can be imported into routes or other components.

**Example:**
\`\`\`html
<!-- components/Card.puremix -->
<div class="card">
  <h3>{title}</h3>
  <p>{description}</p>
</div>
\`\`\`

**Usage:**
\`\`\`html
<imports>
  import Card from '../components/Card.puremix'
</imports>

<Card title="Hello" description="World" />
\`\`\`

${template !== 'default' ? `### \`app/controllers/\`
Business logic and data processing functions. Can be JavaScript, TypeScript, or Python.

### \`app/models/\`
Database schemas and data models.

### \`app/services/\`
External API integrations and third-party service wrappers.

### \`app/utils/\`
Shared utility functions and helpers.
` : ''}
### \`app/public/\`
Static assets served at \`/public/\` URL path:

- CSS files → \`/public/css/style.css\`
- Images → \`/public/images/logo.png\`
- JavaScript → \`/public/js/script.js\`

### \`app/views/layouts/\`
HTML layout templates for wrapping page content. Referenced using \`<layout>main</layout>\` in routes.

## Configuration Files

### \`puremix.config.js\`
Main framework configuration (port, session, Python timeout, etc.)

### \`package.json\`
Project dependencies and npm scripts

### \`FRAMEWORK_GUIDE.md\`
Complete framework documentation (copied from node_modules/puremix after installation).



## File Types

### \`.puremix\` Files
PureMix template files containing:
- HTML content
- Server-side loaders (\`<loader>\`)
- Server functions (\`<script server>\`)
- Client scripts (\`<script>\`)
- Component imports (\`<imports>\`)

### Standard Files
- \`.js\` / \`.ts\` - JavaScript/TypeScript modules
- \`.py\` - Python modules (for ML/AI features)
- \`.html\` - Layout templates
- \`.css\` - Stylesheets

## Adding New Routes

1. Create a \`.puremix\` file in \`app/routes/\`
2. Add layout reference: \`<layout>main</layout>\`
3. Add loader if needed: \`<loader>async function loadPage(request) {...}</loader>\`
4. Add HTML content with template expressions: \`{data.value}\`

Route is automatically available based on filename!

## Adding New Components

1. Create a \`.puremix\` file in \`app/components/\`
2. Define props usage in template: \`{title}\`, \`{description}\`
3. Import in routes: \`import MyComponent from '../components/MyComponent.puremix'\`
4. Use in HTML: \`<MyComponent title="..." description="..." />\`

## Learn More

- 📚 **FRAMEWORK_GUIDE.md** - Complete PureMix framework guide
- 📖 **README.md** - Project-specific documentation

---

Generated by PureMix CLI
`;

  const structurePath = path.join(projectPath, 'PROJECT_STRUCTURE.md');
  fs.writeFileSync(structurePath, projectStructureContent);
  console.log('📖 Generated PROJECT_STRUCTURE.md');
}

function showTemplateInstructions(template) {
  switch (template) {
    case 'ecommerce':
      console.log('\\n🛍️ E-commerce template includes:');
      console.log('   • User authentication with magic links');
      console.log('   • Product management');
      console.log('   • Shopping cart');
      console.log('   • Admin panel');
      console.log('\\n⚙️  Next steps:');
      console.log('   1. Set up MongoDB connection in .env');
      console.log('   2. Configure email service (optional)');
      console.log('   3. Customize your products and styling');
      break;
      
    case 'portfolio':
      console.log('\\n🎨 Portfolio template includes:');
      console.log('   • Modern design');
      console.log('   • Project showcase');
      console.log('   • Contact form');
      console.log('   • Responsive layout');
      break;
      
    case 'landing-page':
      console.log('\\n🚀 Landing page template includes:');
      console.log('   • Hero section');
      console.log('   • Features showcase');
      console.log('   • Call-to-action buttons');
      console.log('   • Contact form');
      break;
      
    case 'default':
      console.log('\\n✨ Default template includes:');
      console.log('   • Minimal setup with index route only');
      console.log('   • Clean file structure');
      console.log('   • Framework guide and project documentation');
      console.log('   • Components folder ready for use');
      break;

    default:
      console.log('\\n💡 Tip: Explore other templates:');
      console.log('   puremix create my-app --template default');
      console.log('   puremix create my-app --template minimal');
      console.log('   puremix create my-app --template basic');
      console.log('   puremix create my-store --template ecommerce');
      console.log('   puremix create my-portfolio --template portfolio');
      console.log('   puremix create my-landing --template landing-page');
  }
}

export default createProject;