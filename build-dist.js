#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Building PureMix for npm distribution...');

// Create dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist', { recursive: true });

// Compile TypeScript with proper options
console.log('📝 Compiling TypeScript files...');
execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });

// Copy required files
console.log('📋 Copying additional files...');
const filesToCopy = [
  { src: 'templates', dest: 'dist/templates' },
  { src: 'puremix', dest: 'dist/puremix' },
  { src: 'README.md', dest: 'dist/README.md' },
  { src: 'LICENSE', dest: 'dist/LICENSE' },
  { src: 'FRAMEWORK_GUIDE.md', dest: 'dist/FRAMEWORK_GUIDE.md' },
  { src: 'scripts', dest: 'dist/scripts' }
];

filesToCopy.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`✅ Copied ${src}`);
  } else {
    console.log(`⚠️  Skipped ${src} (not found)`);
  }
});

// Create package.json for distribution
console.log('📦 Creating distribution package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const distPackageJson = {
  ...packageJson,
  main: 'dist/lib/puremix-engine.js',
  bin: {
    puremix: './dist/puremix'
  },
  files: [
    'dist/',
    'README.md',
    'LICENSE',
    'FRAMEWORK_GUIDE.md'
  ],
  scripts: {
    ...packageJson.scripts,
    prepublishOnly: 'npm run build'
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));
console.log('✅ Build completed successfully!');
console.log('\n🚀 Ready for npm publishing!');
console.log('Run: npm publish --from-package ./dist');