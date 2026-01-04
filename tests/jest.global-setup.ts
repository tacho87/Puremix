/**
 * Global Jest setup - runs once before all test suites
 * Starts the PureMix test server for all integration tests
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as net from 'net';

const testProjectDir = path.join(process.cwd(), 'tests', 'projects', 'comprehensive-test');
let serverProcess: ReturnType<typeof spawn> | null = null;
let serverPort: number | null = null;

/**
 * Find an available port starting from the given port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });

    server.on('error', () => {
      // Port is in use, try next
      server.close(() => findAvailablePort(startPort + 1).then(resolve));
    });
  });
}

export default async function () {
  // Check if package.json exists in test project
  const packageJsonPath = path.join(testProjectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.warn(`⚠️  Test project not found at: ${testProjectDir}`);
    return;
  }

  // Find an available port
  serverPort = await findAvailablePort(3000);

  // Write port to temp file IMMEDIATELY so tests can read it
  const portFile = path.join(os.tmpdir(), 'puremix-test-port.txt');
  fs.writeFileSync(portFile, String(serverPort));
  console.log(`🚀 Starting PureMix test server on port ${serverPort}...`);

  // Start the server
  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: testProjectDir,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, PORT: String(serverPort), NODE_ENV: 'test' }
  });

  // Store server info for teardown
  (global as any).PUREMIX_SERVER_PROCESS = serverProcess;
  (global as any).PUREMIX_SERVER_PORT = serverPort;

  // Give server time to start (15 seconds)
  console.log(`⏳ Waiting for server to be ready...`);
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Try to ping the server
  try {
    const response = await fetch(`http://localhost:${serverPort}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      console.log(`✅ PureMix test server ready on port ${serverPort}`);
    } else {
      console.warn(`⚠️  Server responded with status ${response.status}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not ping server: ${(error as Error).message}`);
    console.warn(`   Tests will attempt to connect anyway...`);
  }

  console.log(`📝 Port ${serverPort} written to ${portFile}`);
}
