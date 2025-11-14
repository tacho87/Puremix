#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing import extensions in built files...');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Special handling for package.json
  if (filePath.endsWith('package.json')) {
    // Fix the "main" field
    content = content.replace(/"main":\s*"[^"]*\.ts"/, '"main": "lib/puremix-engine.js"');
    // Fix script commands
    content = content.replace(/("dev":\s*")[^"]*\.ts(")/g, '$1cli/dev.js$2');
    content = content.replace(/("create":\s*")[^"]*\.ts(")/g, '$1cli/create.js$2');
  }

  // Special handling for puremix binary
  if (filePath.endsWith('puremix')) {
    // Fix CLI_FILE path
    content = content.replace(/CLI_FILE="\$PACKAGE_DIR\/cli\/puremix\.ts"/, 'CLI_FILE="$PACKAGE_DIR/cli/puremix.js"');
  }

  // Fix JavaScript files - handle import statements precisely
  if (filePath.endsWith('.js')) {
    // Replace .ts extensions in import statements ONLY
    content = content.replace(/(from\s+['"][^'"]*)\.js(['"])/g, '$1.js$2');

    // Handle esbuild output which might have .ts imports
    content = content.replace(/(from\s+['"][^'"]*)\.ts(['"])/g, '$1.js$2');

    // Add .js extension to relative imports that don't have extensions
    content = content.replace(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g, (match, prefix, importPath, suffix) => {
      // Skip if already has an extension
      if (importPath.match(/\.[a-zA-Z]+$/)) return match;
      // Add .js for relative imports
      return `${prefix}${importPath}.js${suffix}`;
    });
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed imports in ${path.relative(process.cwd(), filePath)}`);
}

function fixDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixDirectory(filePath);
    } else if (file.endsWith('.js') || file === 'package.json' || file === 'puremix') {
      fixImportsInFile(filePath);
    }
  }
}

// Fix imports in the dist folder
if (fs.existsSync('dist')) {
  fixDirectory('dist');
  console.log('✅ All import extensions fixed!');
} else {
  console.log('❌ dist folder not found');
}