#!/usr/bin/env node
/**
 * generate-docs - Auto-generate project structure documentation
 *
 * Usage:
 *   puremix generate-docs              Generate docs once
 *   puremix generate-docs --watch      Watch for changes and regenerate
 */

import fs from 'fs';
import path from 'path';
import { CodeAnalyzer, AnalysisResult } from '../lib/code-analyzer.js';

interface GenerateDocsOptions {
  watch?: boolean;
  appDir?: string;
}

/**
 * Generate PROJECT_STRUCTURE.md from analysis results
 */
function generateProjectStructure(analysis: AnalysisResult): string {
  const { projectName, timestamp, routes, components, pythonModules, authentication, stats } = analysis;

  let markdown = `# Project Structure - ${projectName}\n\n`;
  markdown += `*Auto-generated on ${new Date(timestamp).toLocaleString()}*\n\n`;
  markdown += `**This file is automatically regenerated. Do not edit manually.**\n\n`;

  // Overview Statistics
  const actionResultRoutesCount = routes.filter(r => r.loaderUsesActionResult).length;

  markdown += `## 📊 Overview\n\n`;
  markdown += `- **Total Routes**: ${stats.totalRoutes} (${stats.pageRoutes} pages, ${stats.apiRoutes} API)\n`;
  markdown += `- **Components**: ${stats.components}\n`;
  markdown += `- **Python Modules**: ${stats.pythonModules} (${stats.pythonFunctions} functions)\n`;
  markdown += `- **Authentication**: ${authentication.type}\n`;
  if (actionResultRoutesCount > 0) {
    markdown += `- **Action Results Flow**: ${actionResultRoutesCount} route(s) use POST-redirect-GET pattern\n`;
  }
  markdown += `\n`;

  // Routes Map
  markdown += `## 🗺️ Routes Map (${stats.totalRoutes} routes)\n\n`;
  markdown += `| URL | Type | File | Loader | Actions | Auth | Language |\n`;
  markdown += `|-----|------|------|--------|---------|------|----------|\n`;

  for (const route of routes) {
    const authIcon = route.auth.type === 'none' ? '🔓' : '🔒';
    const authLabel = route.auth.type === 'none' ? 'Public' : route.auth.type;

    // Loader with actionResult indicator
    let loaderIcon = '—';
    if (route.loader) {
      loaderIcon = route.loaderUsesActionResult ? '✅🔄' : '✅';
    }

    const typeIcon = route.type === 'page' ? '📄' : '🔌';
    const langEmoji = route.language === 'python' ? '🐍' : route.language === 'typescript' ? '📘' : '📗';
    const actionsCount = route.actions.length > 0 ? route.actions.length.toString() : '—';

    markdown += `| \`${route.url}\` | ${typeIcon} ${route.type} | \`${route.file}\` | ${loaderIcon} | ${actionsCount} | ${authIcon} ${authLabel} | ${langEmoji} ${route.language} |\n`;
  }

  markdown += `\n**Legend:** ✅ = Has Loader, 🔄 = Uses Action Results\n\n`;

  // Route Details
  markdown += `## 📄 Route Details\n\n`;

  for (const route of routes) {
    markdown += `### \`${route.url}\` - ${route.type}\n\n`;
    markdown += `**File**: \`${route.file}\`\n\n`;

    if (route.type === 'page') {
      if (route.loader) {
        markdown += `**Loader**: \`${route.loader}\``;
        if (route.loaderUsesActionResult) {
          markdown += ` 🔄 *(accepts action results)*`;
        }
        markdown += `\n\n`;
      }

      if (route.actions.length > 0) {
        markdown += `**Server Actions**: ${route.actions.map(a => `\`${a}\``).join(', ')}`;
        if (route.loaderUsesActionResult && route.actions.length > 0) {
          markdown += ` → flows to loader`;
        }
        markdown += `\n\n`;
      }

      if (route.components.length > 0) {
        markdown += `**Components Used**: ${route.components.map(c => `\`${c}\``).join(', ')}\n\n`;
      }

      if (route.pythonFunctions.length > 0) {
        markdown += `**Python Functions**: ${route.pythonFunctions.map(f => `\`${f}\``).join(', ')}\n\n`;
      }
    } else if (route.type === 'api') {
      if (route.method && route.method.length > 0) {
        markdown += `**HTTP Methods**: ${route.method.map(m => `\`${m}\``).join(', ')}\n\n`;
      }
    }

    if (route.auth.type !== 'none') {
      markdown += `**Authentication**: ${route.auth.type} (${route.auth.detected.join(', ')})\n\n`;
    }

    markdown += `---\n\n`;
  }

  // Components
  if (stats.components > 0) {
    markdown += `## 🧩 Components (${stats.components})\n\n`;
    markdown += `| Component | File | Props | Actions | Used By |\n`;
    markdown += `|-----------|------|-------|---------|----------|\n`;

    for (const [name, component] of Object.entries(components)) {
      const propsStr = component.props.length > 0 ? component.props.join(', ') : '—';
      const actionsStr = component.actions.length > 0 ? component.actions.join(', ') : '—';
      const usedByStr = component.usedBy.length > 0 ? component.usedBy.length.toString() : '—';

      markdown += `| \`${name}\` | \`${component.file}\` | ${propsStr} | ${actionsStr} | ${usedByStr} routes |\n`;
    }

    markdown += `\n`;
  }

  // Python Modules
  if (stats.pythonModules > 0) {
    markdown += `## 🐍 Python Modules (${stats.pythonModules})\n\n`;
    markdown += `| Module | File | Functions | Used In |\n`;
    markdown += `|--------|------|-----------|----------|\n`;

    for (const [name, module] of Object.entries(pythonModules)) {
      const functionsStr = module.functions.join(', ');
      const usedInStr = module.usedIn.length > 0 ? `${module.usedIn.length} routes` : '—';

      markdown += `| \`${name}\` | \`${module.file}\` | ${functionsStr} | ${usedInStr} |\n`;
    }

    markdown += `\n`;
  }

  // Authentication Summary
  markdown += `## 🔐 Authentication\n\n`;
  markdown += `**Type**: ${authentication.type}\n\n`;

  if (authentication.sessionUsage.length > 0) {
    markdown += `**Session Usage**: ${authentication.sessionUsage.length} file(s)\n`;
    authentication.sessionUsage.slice(0, 5).forEach(file => {
      markdown += `- \`${file}\`\n`;
    });
    if (authentication.sessionUsage.length > 5) {
      markdown += `- *...and ${authentication.sessionUsage.length - 5} more*\n`;
    }
    markdown += `\n`;
  }

  if (authentication.jwtUsage.length > 0) {
    markdown += `**JWT Usage**: ${authentication.jwtUsage.length} file(s)\n`;
    authentication.jwtUsage.slice(0, 5).forEach(file => {
      markdown += `- \`${file}\`\n`;
    });
    if (authentication.jwtUsage.length > 5) {
      markdown += `- *...and ${authentication.jwtUsage.length - 5} more*\n`;
    }
    markdown += `\n`;
  }

  if (authentication.cookieUsage.length > 0) {
    markdown += `**Cookie Usage**: ${authentication.cookieUsage.length} file(s)\n`;
    authentication.cookieUsage.slice(0, 5).forEach(file => {
      markdown += `- \`${file}\`\n`;
    });
    if (authentication.cookieUsage.length > 5) {
      markdown += `- *...and ${authentication.cookieUsage.length - 5} more*\n`;
    }
    markdown += `\n`;
  }

  if (authentication.protectedRoutes.length > 0) {
    markdown += `**Protected Routes**: ${authentication.protectedRoutes.length}\n`;
    authentication.protectedRoutes.slice(0, 10).forEach(route => {
      markdown += `- \`${route}\`\n`;
    });
    if (authentication.protectedRoutes.length > 10) {
      markdown += `- *...and ${authentication.protectedRoutes.length - 10} more*\n`;
    }
    markdown += `\n`;
  }

  // Action Results Flow
  const routesWithActionResults = routes.filter(r => r.loaderUsesActionResult);
  if (routesWithActionResults.length > 0) {
    markdown += `## 🔄 Action Results Flow\n\n`;
    markdown += `**${routesWithActionResults.length} route(s)** use the action results pattern (POST-redirect-GET):\n\n`;
    markdown += `| Route | Actions | Loader |\n`;
    markdown += `|-------|---------|--------|\n`;

    routesWithActionResults.forEach((route: any) => {
      const actionsStr = route.actions.length > 0 ? route.actions.slice(0, 3).join(', ') : 'None';
      markdown += `| \`${route.url}\` | ${actionsStr} | \`${route.loader}\` |\n`;
    });

    markdown += `\n**How it works:**\n\n`;
    markdown += `1. User submits form → Server action executes\n`;
    markdown += `2. Action returns result → Framework stores it temporarily\n`;
    markdown += `3. Loader receives \`actionResult\` as second parameter\n`;
    markdown += `4. Loader can react to action success/failure\n`;
    markdown += `5. Template renders with updated data\n\n`;

    markdown += `**Example:**\n\n`;
    markdown += `\`\`\`javascript\n`;
    markdown += `<loader>\n`;
    markdown += `  async function loadPage(request, actionResult) {\n`;
    markdown += `    if (actionResult?.success) {\n`;
    markdown += `      // Handle successful form submission\n`;
    markdown += `      return { data: { message: "Success!", ...actionResult } };\n`;
    markdown += `    }\n`;
    markdown += `    return { data: { ... } };\n`;
    markdown += `  }\n`;
    markdown += `</loader>\n`;
    markdown += `\`\`\`\n\n`;
  }

  // Data Flow Diagram
  markdown += `## 🔄 Data Flow\n\n`;

  // Show two flow diagrams: regular and with action results
  if (routesWithActionResults.length > 0) {
    markdown += `### Regular Request Flow\n\n`;
  }

  markdown += `\`\`\`\n`;
  markdown += `Client Request (GET)\n`;
  markdown += `     ↓\n`;
  markdown += `Route Resolution\n`;
  markdown += `     ↓\n`;
  if (authentication.type !== 'none') {
    markdown += `Authentication Check (${authentication.type})\n`;
    markdown += `     ↓\n`;
  }
  markdown += `Loader Execution`;
  if (stats.pythonModules > 0) {
    markdown += ` (+ Python)`;
  }
  markdown += `\n`;
  markdown += `     ↓\n`;
  markdown += `Template Rendering`;
  if (stats.components > 0) {
    markdown += ` (+ Components)`;
  }
  markdown += `\n`;
  markdown += `     ↓\n`;
  markdown += `HTML Response\n`;
  markdown += `\`\`\`\n\n`;

  // Add action result flow diagram if applicable
  if (routesWithActionResults.length > 0) {
    markdown += `### Form Submission Flow (with Action Results)\n\n`;
    markdown += `\`\`\`\n`;
    markdown += `Client Form Submit (POST)\n`;
    markdown += `     ↓\n`;
    markdown += `Route Resolution\n`;
    markdown += `     ↓\n`;
    if (authentication.type !== 'none') {
      markdown += `Authentication Check (${authentication.type})\n`;
      markdown += `     ↓\n`;
    }
    markdown += `Server Action Execution`;
    if (stats.pythonModules > 0) {
      markdown += ` (+ Python)`;
    }
    markdown += `\n`;
    markdown += `     ↓\n`;
    markdown += `Action Result Stored\n`;
    markdown += `     ↓\n`;
    markdown += `Loader Execution (receives actionResult)\n`;
    markdown += `     ↓\n`;
    markdown += `Template Rendering`;
    if (stats.components > 0) {
      markdown += ` (+ Components)`;
    }
    markdown += `\n`;
    markdown += `     ↓\n`;
    markdown += `HTML Response (with action feedback)\n`;
    markdown += `\`\`\`\n\n`;
  }

  // Footer
  markdown += `---\n\n`;
  markdown += `*Generated by PureMix Documentation Generator*\n`;
  markdown += `*Regenerate with: \`npm run generate-docs\`*\n`;

  return markdown;
}

/**
 * Run the documentation generator
 */
async function generateDocs(options: GenerateDocsOptions = {}): Promise<void> {
  const appDir = options.appDir || path.join(process.cwd(), 'app');
  const projectRoot = process.cwd();

  // Check if app directory exists
  if (!fs.existsSync(appDir)) {
    console.error(`❌ App directory not found: ${appDir}`);
    console.error(`   Make sure you're in a PureMix project directory.`);
    process.exit(1);
  }

  console.log('🔍 Analyzing project structure...');

  try {
    // Initialize analyzer
    const analyzer = new CodeAnalyzer(appDir);

    // Run analysis
    const analysis = await analyzer.analyze();

    // Generate PROJECT_STRUCTURE.md
    const structureMarkdown = generateProjectStructure(analysis);
    const structurePath = path.join(projectRoot, 'PROJECT_STRUCTURE.md');
    fs.writeFileSync(structurePath, structureMarkdown, 'utf8');
    console.log(`✅ Generated: PROJECT_STRUCTURE.md`);

    // Summary
    console.log('');
    console.log('📊 Documentation Summary:');
    console.log(`   Routes: ${analysis.stats.totalRoutes}`);
    console.log(`   Components: ${analysis.stats.components}`);
    console.log(`   Python Modules: ${analysis.stats.pythonModules}`);
    console.log(`   Authentication: ${analysis.authentication.type}`);
    console.log('');

    // Watch mode
    if (options.watch) {
      console.log('👀 Watching for changes...');
      console.log('   Press Ctrl+C to stop');

      // Watch app directory for changes
      let timeout: NodeJS.Timeout;
      fs.watch(appDir, { recursive: true }, (_eventType, filename) => {
        if (filename && (filename.endsWith('.puremix') || filename.endsWith('.py') || filename.endsWith('.js') || filename.endsWith('.ts'))) {
          // Debounce regeneration
          clearTimeout(timeout);
          timeout = setTimeout(async () => {
            console.log(`\n🔄 Change detected in ${filename}, regenerating...`);
            await generateDocs({ ...options, watch: false });
          }, 1000);
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Documentation generation failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options: GenerateDocsOptions = {};

  for (const arg of args) {
    if (arg === '--watch' || arg === '-w') {
      options.watch = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('PureMix Documentation Generator\n');
      console.log('Usage:');
      console.log('  puremix generate-docs         Generate docs once');
      console.log('  puremix generate-docs --watch Watch for changes and regenerate');
      console.log('');
      console.log('Options:');
      console.log('  -w, --watch  Watch mode for auto-regeneration');
      console.log('  -h, --help   Show this help message');
      process.exit(0);
    }
  }

  await generateDocs(options);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateDocs, generateProjectStructure };
