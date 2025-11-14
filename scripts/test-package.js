#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🧪 Starting npm package test workflow...\n');

// Clean and create .tmp folder
console.log('1️⃣  Setting up test environment...');
const tmpDir = path.join(process.cwd(), '.tmp');
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
fs.mkdirSync(tmpDir, { recursive: true });

// Copy dist to .tmp/npm-package
console.log('2️⃣  Copying dist package...');
const packageDir = path.join(tmpDir, 'npm-package');
fs.mkdirSync(packageDir, { recursive: true });
const distDir = path.join(process.cwd(), 'dist');
fs.cpSync(distDir, packageDir, { recursive: true });

// Package the npm
console.log('3️⃣  Creating npm package...');
process.chdir(packageDir);
execSync('npm pack', { stdio: 'inherit' });
const packageFile = 'puremix-0.1.0-alpha.1.tgz';

// Create test project directory
console.log('4️⃣  Creating test project...');
const testProjectDir = path.join(tmpDir, 'test-app');
fs.mkdirSync(testProjectDir, { recursive: true });
process.chdir(testProjectDir);

// Initialize npm project
execSync('npm init -y', { stdio: 'inherit' });

// Install the local package
console.log('5️⃣  Installing npm package...');
execSync(`npm install ${path.join('..', 'npm-package', packageFile)}`, { stdio: 'inherit' });

// Create PureMix project
console.log('6️⃣  Creating PureMix application...');
execSync('npx puremix create test-app --template basic', { stdio: 'inherit' });

// Install dependencies (fix version issue)
console.log('7️⃣  Installing application dependencies...');
const appPackageJson = path.join(testProjectDir, 'test-app', 'package.json');
if (fs.existsSync(appPackageJson)) {
  const packageContent = fs.readFileSync(appPackageJson, 'utf8');
  const fixedPackage = packageContent.replace(
    '"puremix": "^0.0.1"',
    '"puremix": "^0.1.0-alpha.1"'
  );
  fs.writeFileSync(appPackageJson, fixedPackage);
}

process.chdir(path.join(testProjectDir, 'test-app'));
execSync('npm install', { stdio: 'inherit' });

console.log('\n✅ Package test workflow completed successfully!');
console.log('\n🚀 Ready for MCP Playwright testing:');
console.log(`   cd ${testProjectDir}/test-app`);
console.log('   npm run dev');
console.log('\n📁 Test app located at:', path.join(testProjectDir, 'test-app'));