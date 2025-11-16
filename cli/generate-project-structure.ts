#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProjectStructureOptions {
  includeCounts?: boolean;
  sortByType?: boolean;
}

/**
 * Generate PROJECT_STRUCTURE.md dynamically based on actual project structure
 */
export function generateDynamicProjectStructure(
  projectPath: string,
  options: ProjectStructureOptions = {}
): string {
  const { includeCounts = true, sortByType = false } = options;

  // Detect if this is a PureMix project
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('Not a valid project - package.json not found');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const isPureMixProject = packageJson.dependencies?.puremix || packageJson.devDependencies?.puremix;

  if (!isPureMixProject) {
    throw new Error('Not a PureMix project - puremix dependency not found');
  }

  // Analyze actual project structure
  const appDir = path.join(projectPath, 'app');
  const structure = analyzeProjectStructure(projectPath, appDir);

  // Generate content
  const content = generateProjectStructureContent(structure, packageJson.name, options);

  return content;
}

interface ProjectStructure {
  name: string;
  directories: DirectoryStructure[];
  files: FileInfo[];
  configFiles: FileInfo[];
  hasRoutes: boolean;
  hasComponents: boolean;
  hasControllers: boolean;
  hasPython: boolean;
  environmentConfigs: string[];
}

interface DirectoryStructure {
  name: string;
  path: string;
  description: string;
  files: FileInfo[];
  subdirectories: DirectoryStructure[];
  fileCount: number;
}

interface FileInfo {
  name: string;
  path: string;
  type: string;
  size?: string;
}

function analyzeProjectStructure(projectPath: string, appDir: string): ProjectStructure {
  const structure: ProjectStructure = {
    name: path.basename(projectPath),
    directories: [],
    files: [],
    configFiles: [],
    hasRoutes: false,
    hasComponents: false,
    hasControllers: false,
    hasPython: false,
    environmentConfigs: []
  };

  // Analyze app directory if it exists
  if (fs.existsSync(appDir)) {
    const appStructure = analyzeDirectory(appDir, 'app');
    structure.directories = appStructure.subdirectories;

    // Check for specific directories
    structure.hasRoutes = appStructure.subdirectories.some(dir => dir.name === 'routes');
    structure.hasComponents = appStructure.subdirectories.some(dir => dir.name === 'components');
    structure.hasControllers = appStructure.subdirectories.some(dir => dir.name === 'controllers');
    structure.hasPython = appStructure.subdirectories.some(dir =>
      dir.files.some(file => file.name.endsWith('.py'))
    );
  }

  // Analyze root configuration files
  const rootFiles = fs.readdirSync(projectPath);

  // Check for environment-specific config files
  structure.environmentConfigs = rootFiles.filter(file =>
    file.startsWith('puremix.config.') && file !== 'puremix.config.js'
  );

  // Collect configuration files
  const configExtensions = ['.js', '.json', '.md', '.yml', '.yaml', '.env'];
  rootFiles.forEach(file => {
    const filePath = path.join(projectPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      const extension = path.extname(file);
      let type = 'config';

      if (file === 'package.json') type = 'package';
      else if (file.startsWith('puremix.config')) type = 'puremix-config';
      else if (configExtensions.includes(extension)) type = 'config';
      else if (extension === '.lock') type = 'lock';

      structure.configFiles.push({
        name: file,
        path: filePath,
        type,
        size: formatFileSize(stat.size)
      });
    }
  });

  return structure;
}

function analyzeDirectory(dirPath: string, relativePath: string): DirectoryStructure {
  const stat = fs.statSync(dirPath);
  const result: DirectoryStructure = {
    name: path.basename(dirPath),
    path: relativePath,
    description: getDirectoryDescription(path.basename(dirPath)),
    files: [],
    subdirectories: [],
    fileCount: 0
  };

  if (stat.isDirectory()) {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const itemStat = fs.statSync(itemPath);

      if (itemStat.isFile()) {
        const extension = path.extname(item);
        const type = getFileType(item, extension);

        result.files.push({
          name: item,
          path: path.join(relativePath, item),
          type,
          size: formatFileSize(itemStat.size)
        });
        result.fileCount++;
      } else if (itemStat.isDirectory() && !item.startsWith('.')) {
        const subDir = analyzeDirectory(itemPath, path.join(relativePath, item));
        result.subdirectories.push(subDir);
        result.fileCount += subDir.fileCount;
      }
    });
  }

  return result;
}

function getDirectoryDescription(dirName: string): string {
  const descriptions: Record<string, string> = {
    'routes': 'Route files (.puremix) - File-based routing',
    'components': 'Reusable components (.puremix)',
    'controllers': 'Business logic and data processing (.js, .ts, .py)',
    'models': 'Database schemas and data models',
    'services': 'External API integrations and third-party services',
    'utils': 'Shared utility functions and helpers',
    'public': 'Static assets served at /public/',
    'views': 'HTML layout templates',
    'layouts': 'Layout wrapper templates',
    'css': 'Stylesheets',
    'js': 'Client-side JavaScript files',
    'images': 'Image assets',
    'lib': 'Library files and dependencies',
    'scripts': 'Build and deployment scripts',
    'config': 'Configuration files',
    'test': 'Test files and test utilities',
    'tests': 'Test files and test utilities',
    'docs': 'Documentation files'
  };

  return descriptions[dirName] || `${dirName} directory`;
}

function getFileType(filename: string, extension: string): string {
  const name = filename.toLowerCase();

  if (extension === '.puremix') return 'puremix-route';
  if (extension === '.py') return 'python';
  if (extension === '.js') return name.includes('test') ? 'test' : 'javascript';
  if (extension === '.ts') return name.includes('test') ? 'test' : 'typescript';
  if (extension === '.json') return 'json';
  if (extension === '.md') return 'markdown';
  if (extension === '.html') return 'html';
  if (extension === '.css') return 'stylesheet';
  if (extension === '.yml' || extension === '.yaml') return 'yaml';
  if (extension === '.env') return 'environment';

  return extension.substring(1) || 'file';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function generateProjectStructureContent(
  structure: ProjectStructure,
  projectName: string,
  options: ProjectStructureOptions
): string {
  const { includeCounts, sortByType } = options;

  let content = `# Project Structure

This document is automatically generated based on the actual project structure.

## Project Overview

**Name:** ${projectName}
**Type:** PureMix Full-Stack Application
**Last Updated:** ${new Date().toISOString().split('T')[0]}

## Directory Layout

\`\`\`
${structure.name}/
`;

  // Generate ASCII tree structure
  content += generateDirectoryTree(structure);

  content += `\`\`\`\n\n`;

  // Add detailed sections
  if (structure.hasRoutes) {
    content += generateRoutesSection(structure);
  }

  if (structure.hasComponents) {
    content += generateComponentsSection(structure);
  }

  if (structure.hasControllers) {
    content += generateControllersSection(structure);
  }

  if (structure.hasPython) {
    content += generatePythonSection(structure);
  }

  // Configuration section
  content += generateConfigurationSection(structure);

  // Add commands section
  content += generateCommandsSection();

  content += `\n---

*This document is automatically generated. Run \`npm run generate-docs\` to update it.*\n`;

  return content;
}

function generateDirectoryTree(structure: ProjectStructure): string {
  let tree = '';

  // Add configuration files first
  const configFiles = structure.configFiles.filter(f =>
    f.name.startsWith('puremix.config') ||
    f.name === 'package.json' ||
    f.name.startsWith('.npm') ||
    f.name === '.gitignore'
  );

  configFiles.forEach(file => {
    tree += `├── ${file.name}`;
    if (file.size && file.size !== '0 B') {
      tree += `                 # ${file.type} (${file.size})`;
    }
    tree += '\n';
  });

  // Add app directory structure
  if (structure.directories.length > 0) {
    tree += '├── app/                   # Main application directory\n';
    structure.directories.forEach(dir => {
      tree += generateDirectoryTreeLine(dir, '│   ├── ', '│   │   ');
    });
  }

  // Add remaining config files
  const remainingFiles = structure.configFiles.filter(f =>
    !configFiles.includes(f)
  );

  remainingFiles.forEach((file, index) => {
    const isLast = index === remainingFiles.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    tree += `${prefix}${file.name}`;
    if (file.size && file.size !== '0 B') {
      tree += `                    # ${file.type} (${file.size})`;
    }
    tree += '\n';
  });

  return tree;
}

function generateDirectoryTreeLine(
  dir: DirectoryStructure,
  currentPrefix: string,
  childPrefix: string
): string {
  let lines = `${currentPrefix}${dir.name}/`;

  if (dir.description && dir.description !== `${dir.name} directory`) {
    lines += `           # ${dir.description}`;
  }
  lines += '\n';

  // Add files in this directory
  const sortedFiles = dir.files.sort((a, b) => {
    // Sort .puremix files first, then by type
    if (a.type === 'puremix-route' && b.type !== 'puremix-route') return -1;
    if (b.type === 'puremix-route' && a.type !== 'puremix-route') return 1;
    return a.name.localeCompare(b.name);
  });

  sortedFiles.forEach((file, index) => {
    const isLastFile = index === sortedFiles.length - 1 && dir.subdirectories.length === 0;
    const prefix = isLastFile ? '└── ' : '├── ';
    lines += `${childPrefix}${prefix}${file.name}`;

    // Add file type description
    const typeDesc = getFileTypeDescription(file);
    if (typeDesc) {
      lines += `      # ${typeDesc}`;
    }
    lines += '\n';
  });

  // Add subdirectories
  dir.subdirectories.forEach((subDir, index) => {
    const isLast = index === dir.subdirectories.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const subChildPrefix = childPrefix + (isLast ? '    ' : '│   ');
    lines += generateDirectoryTreeLine(subDir, childPrefix + prefix, subChildPrefix);
  });

  return lines;
}

function getFileTypeDescription(file: FileInfo): string {
  const descriptions: Record<string, string> = {
    'puremix-route': 'PureMix route page',
    'python': 'Python module',
    'javascript': 'JavaScript module',
    'typescript': 'TypeScript module',
    'test': 'Test file',
    'html': 'HTML template',
    'stylesheet': 'CSS stylesheet',
    'markdown': 'Documentation',
    'json': 'JSON data',
    'yaml': 'YAML configuration',
    'environment': 'Environment variables'
  };

  return descriptions[file.type] || '';
}

function generateRoutesSection(structure: ProjectStructure): string {
  const routesDir = structure.directories.find(dir => dir.name === 'routes');
  if (!routesDir) return '';

  let section = '## Routes\n\n';
  section += 'Routes are automatically generated based on files in `app/routes/`:\n\n';

  const routeFiles = routesDir.files.filter(f => f.type === 'puremix-route');
  routeFiles.forEach(file => {
    const routePath = getRoutePath(file.name);
    section += `- **${file.name}** → \`${routePath}\`\n`;
  });

  section += '\n**Route Patterns:**\n';
  section += '- `index.puremix` → `/` (home page)\n';
  section += '- `about.puremix` → `/about`\n';
  section += '- `[id].puremix` → `/:id` (dynamic parameter)\n';
  section += '- `[...slug].puremix` → `/*` (catch-all route)\n\n';

  return section;
}

function generateComponentsSection(structure: ProjectStructure): string {
  const componentsDir = structure.directories.find(dir => dir.name === 'components');
  if (!componentsDir) return '';

  let section = '## Components\n\n';
  section += `Found ${componentsDir.fileCount} component(s) in \`app/components/\`:\n\n`;

  componentsDir.files.forEach(file => {
    section += `- **${file.name}** (${file.type})\n`;
  });

  section += '\n**Usage Example:**\n';
  section += '```html\n';
  section += '<imports>\n';
  section += '  import MyComponent from "../components/MyComponent.puremix"\n';
  section += '</imports>\n\n';
  section += '<MyComponent prop="value" />\n';
  section += '```\n\n';

  return section;
}

function generateControllersSection(structure: ProjectStructure): string {
  const controllersDir = structure.directories.find(dir => dir.name === 'controllers');
  if (!controllersDir) return '';

  let section = '## Controllers\n\n';
  section += `Business logic files in \`app/controllers/\`:\n\n`;

  controllersDir.files.forEach(file => {
    section += `- **${file.name}** (${file.type})\n`;
  });

  section += '\n**Import Example:**\n';
  section += '```javascript\n';
  section += 'import { getUserById } from "../controllers/users.js"\n';
  section += '```\n\n';

  return section;
}

function generatePythonSection(structure: ProjectStructure): string {
  let section = '## Python Integration\n\n';
  section += 'This project includes Python files for ML/AI features:\n\n';

  let pythonFiles = 0;
  structure.directories.forEach(dir => {
    const pythonFilesInDir = dir.files.filter(f => f.type === 'python');
    if (pythonFilesInDir.length > 0) {
      section += `### ${dir.name}/\n`;
      pythonFilesInDir.forEach(file => {
        section += `- **${file.name}**\n`;
        pythonFiles++;
      });
      section += '\n';
    }
  });

  if (pythonFiles === 0) {
    section += '*No Python files found in this project*\n\n';
  }

  section += '**Python Features:**\n';
  section += '- Automatic process pool management\n';
  section += '- Seamless JavaScript/Python interop\n';
  section += '- ML library support (pandas, numpy, scikit-learn)\n\n';

  return section;
}

function generateConfigurationSection(structure: ProjectStructure): string {
  let section = '## Configuration Files\n\n';

  // Main config files
  const mainConfigs = structure.configFiles.filter(f =>
    f.name.startsWith('puremix.config')
  );

  section += '### PureMix Configuration\n';
  mainConfigs.forEach(file => {
    section += `- **${file.name}** (${file.type})`;
    if (file.size) section += ` - ${file.size}`;
    section += '\n';
  });

  // Environment configs
  if (structure.environmentConfigs.length > 0) {
    section += '\n### Environment-Specific Configurations\n';
    section += 'The following environment configurations are available:\n\n';

    structure.environmentConfigs.forEach(config => {
      const env = config.replace('puremix.config.', '').replace('.js', '');
      section += `- **${config}** → \`NODE_ENV=${env}\`\n`;
    });

    section += '\n**Usage:**\n';
    section += '```bash\n';
    section += '# Development with staging config\n';
    section += 'npm run dev -- --env staging\n\n';
    section += '# Production with specific config\n';
    section += 'npm run start -- --env production\n';
    section += '```\n\n';
  }

  // Other config files
  const otherConfigs = structure.configFiles.filter(f =>
    !f.name.startsWith('puremix.config')
  );

  if (otherConfigs.length > 0) {
    section += '### Other Configuration Files\n';
    otherConfigs.forEach(file => {
      section += `- **${file.name}** (${file.type})`;
      if (file.size) section += ` - ${file.size}`;
      section += '\n';
    });
  }

  return section + '\n';
}

function generateCommandsSection(): string {
  return `## Commands

### Development
\`\`\`bash
npm run dev              # Start development server
npm run dev -- --env staging    # Development with staging config
npm run dev -- --env production # Development with production config
\`\`\`

### Build & Deploy
\`\`\`bash
npm run build            # Build for production
npm run start            # Start production server
npm run start -- --env staging   # Production with staging config
\`\`\`

### Documentation
\`\`\`bash
npm run generate-docs    # Regenerate this PROJECT_STRUCTURE.md
\`\`\`

### Framework Commands
\`\`\`bash
puremix dev              # Framework development server
puremix build            # Build project
puremix start            # Start production server
puremix doctor           # Health check
puremix info             # Project information
\`\`\`

`;
}

function getRoutePath(filename: string): string {
  if (filename === 'index.puremix') return '/';
  if (filename.startsWith('[') && filename.endsWith('].puremix')) {
    const param = filename.slice(1, -9); // Remove [ ] and .puremix
    if (param.startsWith('...')) {
      return '/* (catch-all)';
    }
    return `/:${param}`;
  }
  return `/${filename.replace('.puremix', '')}`;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();

  try {
    const content = generateDynamicProjectStructure(projectPath);
    const outputPath = path.join(projectPath, 'PROJECT_STRUCTURE.md');

    fs.writeFileSync(outputPath, content);
    console.log('✅ PROJECT_STRUCTURE.md generated successfully');
    console.log(`📁 Location: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating PROJECT_STRUCTURE.md:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}