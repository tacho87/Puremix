#!/usr/bin/env node

/**
 * Documentation Build Script
 * Generates versioned documentation and syncs with package.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read package.json to get current version
function getCurrentVersion() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

// Read version config
function getVersionConfig() {
  const configPath = path.join(rootDir, 'docs', 'version-config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {
    current: '',
    versions: []
  };
}

// Update version config with current package.json version
function updateVersionConfig(config, currentVersion) {
  const existingVersion = config.versions.find(v => v.version === currentVersion);
  
  if (!existingVersion) {
    // Add new version
    const newVersion = {
      version: currentVersion,
      releaseDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      status: 'current',
      documentation: '/',
      changelog: `# ${currentVersion} (${new Date().toLocaleDateString()})\n\n## 🚀 Release\n\nSee the full changelog in [CHANGELOG.md](../CHANGELOG.md).`
    };
    
    // Mark previous current version as previous
    config.versions.forEach(v => {
      if (v.status === 'current') {
        v.status = 'previous';
        v.documentation = `/v${v.version.replace(/^v/, '')}`;
      }
    });
    
    config.versions.unshift(newVersion);
    config.current = currentVersion;
  } else {
    // Update existing version to current
    config.versions.forEach(v => {
      v.status = v.version === currentVersion ? 'current' : 'previous';
      if (v.version !== currentVersion && v.status === 'previous') {
        v.documentation = `/v${v.version.replace(/^v/, '')}`;
      }
    });
    config.current = currentVersion;
  }
  
  return config;
}

// Create versioned documentation directory
function createVersionedDocs(version) {
  const versionDir = path.join(rootDir, 'docs', `v${version}`);
  
  // Skip if version directory already exists
  if (fs.existsSync(versionDir)) {
    console.log(`📁 Version directory already exists: v${version}`);
    return;
  }
  
  // Create version directory
  fs.mkdirSync(versionDir, { recursive: true });
  
  // Copy current documentation files
  const docFiles = ['documentation.html', 'styles.css', 'script.js'];
  docFiles.forEach(file => {
    const srcPath = path.join(rootDir, 'docs', file);
    const destPath = path.join(versionDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`📄 Copied ${file} to v${version}`);
    }
  });
  
  // Create version-specific index.html that redirects to documentation
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PureMix v${version} Documentation</title>
  <script>
    // Redirect to documentation
    window.location.href = './documentation.html';
  </script>
</head>
<body>
  <p>Redirecting to PureMix v${version} documentation...</p>
</body>
</html>`;
  
  fs.writeFileSync(path.join(versionDir, 'index.html'), indexHtml);
  console.log(`📄 Created index.html for v${version}`);
}

// Update documentation.html with current version
function updateDocumentationVersion(version) {
  const docPath = path.join(rootDir, 'docs', 'documentation.html');
  let content = fs.readFileSync(docPath, 'utf8');
  
  // Update version badges
  content = content.replace(
    /v\d+\.\d+\.\d+(-[\w.]+)?/g,
    version
  );
  
  fs.writeFileSync(docPath, content);
  console.log(`🔄 Updated documentation.html to version ${version}`);
}

// Main build function
function buildDocumentation() {
  console.log('🚀 Building versioned documentation...\n');
  
  try {
    // Get current version from package.json
    const currentVersion = getCurrentVersion();
    console.log(`📦 Current version from package.json: ${currentVersion}`);
    
    // Get existing version config
    const config = getVersionConfig();
    console.log(`📋 Existing versions: ${config.versions.length}`);
    
    // Update version config
    const updatedConfig = updateVersionConfig(config, currentVersion);
    
    // Save updated version config
    const configPath = path.join(rootDir, 'docs', 'version-config.json');
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    console.log(`💾 Updated version-config.json`);
    
    // Create versioned documentation directory
    createVersionedDocs(currentVersion);
    
    // Update current documentation with version
    updateDocumentationVersion(currentVersion);
    
    console.log(`\n✅ Documentation build complete!`);
    console.log(`📌 Current version: ${currentVersion}`);
    console.log(`📚 Total versions: ${updatedConfig.versions.length}`);
    
    // Update .gitignore for versioned docs
    updateGitignore();
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Update .gitignore to include versioned docs pattern
function updateGitignore() {
  const gitignorePath = path.join(rootDir, '.gitignore');
  
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  const docsIgnorePattern = '\n# Documentation version folders\ndocs/v*/\n';
  
  if (!gitignoreContent.includes('docs/v*/')) {
    fs.appendFileSync(gitignorePath, docsIgnorePattern);
    console.log('📝 Added versioned docs pattern to .gitignore');
  }
}

// Run build
buildDocumentation();