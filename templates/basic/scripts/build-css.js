#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🎨 Starting CSS build process...');

try {
  // Check if we're in a project created from this template
  const hasScssFile = fs.existsSync('./app/public/css/styles.scss');
  const hasTailwindConfig = fs.existsSync('./tailwind.config.js');
  const hasMixinsFile = fs.existsSync('./app/public/css/_mixins.scss');

  console.log(`📁 SCSS file exists: ${hasScssFile ? '✅' : '❌'}`);
  console.log(`📁 Tailwind config exists: ${hasTailwindConfig ? '✅' : '❌'}`);
  console.log(`📁 SCSS mixins exists: ${hasMixinsFile ? '✅' : '❌'}`);

  // Step 1: Compile SCSS to CSS if SCSS file exists
  if (hasScssFile) {
    try {
      console.log('🔧 Compiling SCSS to CSS...');
      execSync('sass ./app/public/css/styles.scss ./app/public/css/style.css --style=expanded', { stdio: 'inherit' });
      console.log('✅ SCSS compilation completed');
    } catch (scssError) {
      console.warn('⚠️  SCSS compilation failed:', scssError.message);
      console.warn('   This might be due to missing dependencies or invalid SCSS syntax');
      console.warn('   Continuing with CSS build...');
    }
  } else {
    console.log('ℹ️  No SCSS file found, skipping SCSS compilation');
  }

  // Step 2: Run Tailwind CSS if we have input CSS
  const inputCssFile = fs.existsSync('./app/public/css/style.css') ? './app/public/css/style.css' : null;
  
  if (inputCssFile && hasTailwindConfig) {
    try {
      console.log('🔧 Running Tailwind CSS compilation...');
      execSync(`tailwindcss -i ${inputCssFile} -o ./app/public/css/output.css --postcss`, { stdio: 'inherit' });
      console.log('✅ Tailwind CSS compilation completed');
    } catch (tailwindError) {
      console.warn('⚠️  Tailwind CSS compilation failed:', tailwindError.message);
      console.warn('   This might be due to missing PostCSS or Tailwind dependencies');
      console.warn('   Falling back to using the compiled CSS directly...');
      
      // If Tailwind fails, just copy the style.css to output.css as fallback
      if (fs.existsSync('./app/public/css/style.css')) {
        fs.copyFileSync('./app/public/css/style.css', './app/public/css/output.css');
        console.log('✅ Used style.css as fallback output');
      }
    }
  } else {
    if (!inputCssFile) {
      console.log('ℹ️  No input CSS file found, skipping Tailwind compilation');
    }
    if (!hasTailwindConfig) {
      console.log('ℹ️  No Tailwind config found, skipping Tailwind compilation');
    }
  }

  // Step 3: Verify output file exists
  if (fs.existsSync('./app/public/css/output.css')) {
    const stats = fs.statSync('./app/public/css/output.css');
    console.log(`✅ CSS build completed successfully! (${stats.size} bytes)`);
  } else {
    console.warn('⚠️  CSS output file was not created');
    console.warn('   The application will still work without compiled CSS');
  }

} catch (error) {
  console.error('❌ CSS build failed:', error.message);
  console.warn('⚠️  The application will still start without CSS compilation');
}

console.log('🎨 CSS build process finished');
console.log('💡 You can run "npm run dev" to start the development server');