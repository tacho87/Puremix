#!/usr/bin/env node

import { Command } from 'commander';
import { createProject } from './create';
import { devServer } from './dev';
import { LogManager } from '../lib/log-manager';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get package version
const packagePath: string = path.join(__dirname, '../package.json');
const packageJson: any = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const program = new Command();

program
  .name('puremix')
  .description('PureMix Framework CLI - HTML-first full-stack development with Python integration')
  .version(packageJson.version);

// Create command
program
  .command('create <project-name>')
  .description('Create a new PureMix project')
  .option('-t, --template <template>', 'Project template (auto-detected from templates/ directory)')
  .option('-p, --package-manager <manager>', 'Package manager (npm, yarn)', 'npm')
  .option('--skip-install', 'Skip dependency installation')
  .option('--typescript', 'Use TypeScript configuration')
  .option('-i, --interactive', 'Interactive template selection with descriptions')
  .action(async (projectName: string, options: any) => {
    try {
      await createProject(projectName, options);
    } catch (error) {
      console.error('❌ Project creation failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Dev command with environment support
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('-e, --env <environment>', 'Environment (development, staging, production)', 'development')
  .option('--no-hot-reload', 'Disable hot reload')
  .option('--python-timeout <ms>', 'Python execution timeout in ms', '30000')
  .action(async (options: any) => {
    try {
      // Set environment
      process.env.NODE_ENV = options.env;

      await devServer(options);
    } catch (error) {
      console.error('❌ Dev server failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Note: PureMix is a runtime framework - no build step needed!
// Templates are processed at request time with Node.js 22+ native TypeScript support
// For production deployment, use the 'start' command or run your server directly

// Start command (for production)
program
  .command('start')
  .description('Start production server')
  .option('-p, --port <port>', 'Server port', process.env.PORT || '3000')
  .option('-h, --host <host>', 'Server host', '0.0.0.0')
  .option('-e, --env <environment>', 'Environment (development, staging, production)', 'production')
  .action(async (options: any) => {
    try {
      // Set environment
      process.env.NODE_ENV = options.env;

      // Load configuration with environment-specific overrides
      const { loadConfigWithEnvironment } = await import('./config-loader');
      const config = await loadConfigWithEnvironment();

      // Import and start the PureMix engine
      const PureMixEngine = (await import('../lib/puremix-engine')).default;

      const engine = new PureMixEngine({
        ...config,
        port: parseInt(options.port) || config.port || 3000,
        host: options.host || config.host || '0.0.0.0',
        isDev: options.env !== 'production',
        hotReload: false // Always disabled for start command
      });

      await engine.start();

      // Graceful shutdown
      process.on('SIGTERM', () => engine.stop());
      process.on('SIGINT', () => engine.stop());

    } catch (error) {
      console.error('❌ Server failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Generate docs command
program
  .command('generate-docs')
  .description('Auto-generate project structure documentation')
  .option('-w, --watch', 'Watch for changes and regenerate')
  .action(async (options: any) => {
    try {
      const { generateDocs } = await import('./generate-docs');
      await generateDocs(options);
    } catch (error) {
      console.error('❌ Documentation generation failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Display environment and project information')
  .action(async () => {
    console.log('\n🚀 PureMix Framework Information\n');
    console.log(`Framework Version: ${packageJson.version}`);
    console.log(`Node.js Version: ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    console.log(`Working Directory: ${process.cwd()}`);
    
    // Check if in PureMix project
    const configExists: boolean = fs.existsSync('puremix.config.js');
    const packageExists: boolean = fs.existsSync('package.json');
    
    if (configExists || packageExists) {
      console.log('\n📁 Project Information:');
      
      if (packageExists) {
        const projectPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`  Project Name: ${projectPackage.name}`);
        console.log(`  Version: ${projectPackage.version}`);
      }
      
      if (configExists) {
        console.log('  ✓ PureMix configuration found');
      }
      
      // Check for app directory
      if (fs.existsSync('app')) {
        const routesDir = path.join('app', 'routes');
        if (fs.existsSync(routesDir)) {
          const routes = fs.readdirSync(routesDir)
            .filter(file => file.endsWith('.puremix'))
            .length;
          console.log(`  Routes: ${routes} .puremix files`);
        }
      }
    } else {
      console.log('\n📁 Not in a PureMix project directory');
    }
    
    // Python check
    try {
      const { execSync } = await import('child_process');
      const pythonVersion = execSync('python3 --version', { stdio: 'pipe' }).toString().trim();
      console.log(`\n🐍 Python: ${pythonVersion}`);
    } catch {
      console.log('\n🐍 Python: Not available (install Python 3.8+ for Python integration)');
    }
    
    console.log('\n📚 Documentation: https://puremix.dev/docs');
    console.log('🐛 Issues: https://github.com/puremix/puremix/issues\n');
  });

// Doctor command - health check
program
  .command('doctor')
  .description('Check system requirements and project health')
  .action(async () => {
    console.log('🏥 PureMix Health Check\n');
    
    let issues: number = 0;
    
    // Node.js version check
    const nodeVersion: string = process.version;
    const majorVersion: number = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 22) {
      console.log(`✅ Node.js ${nodeVersion} (OK)`);
    } else {
      console.log(`❌ Node.js ${nodeVersion} (Requires 22.0.0 or higher)`);
      issues++;
    }
    
    // Python check
    try {
      const { execSync } = await import('child_process');
      const pythonVersion = execSync('python3 --version', { stdio: 'pipe' }).toString().trim();
      const pythonMatch = pythonVersion.match(/Python (\d+)\.(\d+)/);
      
      if (pythonMatch) {
        const major = parseInt(pythonMatch[1]);
        const minor = parseInt(pythonMatch[2]);
        
        if (major >= 3 && (major > 3 || minor >= 8)) {
          console.log(`✅ ${pythonVersion} (OK)`);
        } else {
          console.log(`⚠️  ${pythonVersion} (Recommend 3.8+ for full Python support)`);
        }
      }
    } catch {
      console.log('⚠️  Python not found (Optional: install for Python integration)');
    }
    
    // Project structure check
    if (fs.existsSync('app')) {
      console.log('✅ App directory exists');
      
      if (fs.existsSync('app/routes')) {
        console.log('✅ Routes directory exists');
      } else {
        console.log('❌ Routes directory missing (required)');
        issues++;
      }
      
      if (fs.existsSync('app/public')) {
        console.log('✅ Public directory exists');
      } else {
        console.log('⚠️  Public directory missing (recommended)');
      }
    } else {
      console.log('❌ App directory missing (run puremix create <name>)');
      issues++;
    }
    
    // Package.json check
    if (fs.existsSync('package.json')) {
      console.log('✅ package.json exists');
      
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (pkg.dependencies && pkg.dependencies.puremix) {
        console.log('✅ PureMix dependency found');
      } else {
        console.log('⚠️  PureMix not found in dependencies');
      }
    }
    
    console.log(`\n🏥 Health Check Complete: ${issues === 0 ? '✅ All good!' : '❌ ' + issues + ' issue(s) found'}`);
    
    if (issues > 0) {
      process.exit(1);
    }
  });

// Log management commands
program
  .command('logs')
  .description('Log management utilities')
  .addCommand(
    new Command('flush')
      .description('Flush/rotate log files')
      .option('--days <days>', 'Flush logs older than N days', parseInt)
      .option('--before <date>', 'Flush logs before specific date (YYYY-MM-DD)')
      .option('--all', 'Flush all logs except today')
      .option('--dry-run', 'Show what would be flushed without doing it')
      .action(async (options: any) => {
        try {
          console.log('🗂️  Flushing logs...');
          const flushed = await LogManager.flushLogs(options);
          
          if (flushed.length === 0) {
            console.log('ℹ️  No log files to flush');
          } else {
            console.log(`✅ Log flush complete:`);
            flushed.forEach(msg => console.log(`   ${msg}`));
          }
        } catch (error) {
          console.error('❌ Log flush failed:', (error as Error).message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show current log status and statistics')
      .action(async () => {
        try {
          console.log('📊 Log Status\n');
          const stats = await LogManager.getLogStats();
          
          if (stats.fileCount === 0) {
            console.log('ℹ️  No log files found');
            return;
          }
          
          console.log(`📁 Total Files: ${stats.fileCount}`);
          console.log(`📏 Total Size: ${stats.totalSizeMB} MB`);
          console.log(`🗓️  Oldest File: ${stats.oldestFile}`);
          console.log(`🗓️  Newest File: ${stats.newestFile}\n`);
          
          console.log('📋 Recent Files:');
          stats.files.slice(0, 5).forEach(file => {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log(`   ${file.name} (${sizeMB} MB) - ${file.created.toISOString().split('T')[0]}`);
          });
          
          if (stats.files.length > 5) {
            console.log(`   ... and ${stats.files.length - 5} more files`);
          }
        } catch (error) {
          console.error('❌ Log status failed:', (error as Error).message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('tail')
      .description('View recent log entries')
      .option('-n, --lines <lines>', 'Number of lines to show', '50')
      .option('--level <level>', 'Filter by log level (DEBUG, INFO, WARN, ERROR)')
      .option('--search <term>', 'Search for specific term')
      .option('--since <datetime>', 'Show logs since datetime (YYYY-MM-DD HH:mm)')
      .action(async (options: any) => {
        try {
          const tailOptions = {
            lines: parseInt(options.lines),
            level: options.level,
            search: options.search,
            since: options.since
          };
          
          console.log('📜 Recent Log Entries\n');
          const logs = await LogManager.getTailLogs(tailOptions);
          
          if (logs.length === 0) {
            console.log('ℹ️  No log entries found matching criteria');
            return;
          }
          
          logs.forEach(line => {
            try {
              // Pretty print JSON log entries
              const logEntry = JSON.parse(line);
              const timestamp = new Date(logEntry.timestamp).toISOString().replace('T', ' ').slice(0, 19);
              const level = logEntry.level.padEnd(5);
              console.log(`${timestamp} ${level} ${logEntry.message}`);
            } catch {
              // Fallback for non-JSON lines
              console.log(line);
            }
          });
        } catch (error) {
          console.error('❌ Log tail failed:', (error as Error).message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('info')
      .description('Show detailed log information and health')
      .action(async () => {
        try {
          console.log('🔍 Log System Information\n');
          const stats = await LogManager.getLogStats();
          
          if (stats.fileCount === 0) {
            console.log('ℹ️  No log files found - VerboseDebug may be disabled');
            console.log('💡 Enable logging in your server.js:');
            console.log('   verboseDebug: { enabled: true, save: true, console: true }');
            return;
          }
          
          console.log(`📊 Statistics:`);
          console.log(`   Total Files: ${stats.fileCount}`);
          console.log(`   Total Size: ${stats.totalSizeMB} MB`);
          console.log(`   Average Size: ${(stats.totalSizeMB / stats.fileCount).toFixed(2)} MB per file`);
          
          // Check for potential issues
          console.log(`\n🩺 Health Check:`);
          
          if (stats.totalSizeMB > 100) {
            console.log(`   ⚠️  Large log size (${stats.totalSizeMB} MB) - consider flushing old logs`);
          } else {
            console.log(`   ✅ Log size healthy (${stats.totalSizeMB} MB)`);
          }
          
          if (stats.fileCount > 30) {
            console.log(`   ⚠️  Many log files (${stats.fileCount}) - consider automated cleanup`);
          } else {
            console.log(`   ✅ File count healthy (${stats.fileCount} files)`);
          }
          
          // Show oldest logs
          if (stats.oldestFile) {
            const oldestDate = stats.files[stats.files.length - 1]?.created;
            if (oldestDate) {
              const daysSinceOldest = (Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
              if (daysSinceOldest > 30) {
                console.log(`   ⚠️  Old logs (${Math.floor(daysSinceOldest)} days) - consider cleanup`);
              } else {
                console.log(`   ✅ Log age reasonable (${Math.floor(daysSinceOldest)} days since oldest)`);
              }
            }
          }
          
          console.log(`\n💡 Maintenance Commands:`);
          console.log(`   puremix logs flush --days 7     # Remove logs older than 7 days`);
          console.log(`   puremix logs tail --level ERROR # Show recent errors`);
          
        } catch (error) {
          console.error('❌ Log info failed:', (error as Error).message);
          process.exit(1);
        }
      })
  );

// Handle unknown commands
program.on('command:*', function (operands: string[]) {
  console.error(`❌ Unknown command: ${operands[0]}`);
  console.log('💡 Run `puremix --help` for available commands');
  process.exit(1);
});



// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();