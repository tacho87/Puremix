#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Load puremix.config.js with environment-specific overrides
 * This is a shared utility used by both dev.ts and the CLI commands
 */
export async function loadConfigWithEnvironment(): Promise<any> {
  const cwd = process.cwd();

  // Determine environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  const environment = nodeEnv === 'production' ? 'prod' :
                     nodeEnv === 'staging' ? 'staging' : 'dev';

  console.log(`🔧 Environment: ${nodeEnv} (${environment})`);

  // Load base configuration
  let baseConfig = {};
  const baseConfigPath = path.resolve(cwd, 'puremix.config.js');

  if (fs.existsSync(baseConfigPath)) {
    try {
      const config = await import(`file://${baseConfigPath}?t=${Date.now()}`);
      baseConfig = config.default || config;
      console.log('📋 Loaded base configuration from puremix.config.js');
    } catch (error) {
      console.warn('⚠️  Failed to load puremix.config.js:', error instanceof Error ? error.message : String(error));
      console.warn('    Using default configuration');
    }
  }

  // Load environment-specific configuration
  let envConfig = {};
  const envConfigPath = path.resolve(cwd, `puremix.config.${environment}.js`);

  if (fs.existsSync(envConfigPath)) {
    try {
      const config = await import(`file://${envConfigPath}?t=${Date.now()}`);
      envConfig = config.default || config;
      console.log(`📋 Loaded ${environment} configuration from puremix.config.${environment}.js`);
    } catch (error) {
      console.warn(`⚠️  Failed to load puremix.config.${environment}.js:`, error instanceof Error ? error.message : String(error));
      console.warn('    Continuing with base configuration only');
    }
  } else if (environment !== 'dev') {
    console.log(`ℹ️  No puremix.config.${environment}.js found, using base configuration`);
  }

  // Merge configurations (environment overrides base)
  const mergedConfig = {
    ...baseConfig,
    ...envConfig,
    // Explicitly set environment detection
    isDev: nodeEnv !== 'production',
    environment: nodeEnv
  };

  return mergedConfig;
}