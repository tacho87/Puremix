/**
 * Global Jest teardown - runs once after all test suites
 * Stops the PureMix test server
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export default async function () {
  // Get the server process from global scope
  const serverProcess = (global as any).PUREMIX_SERVER_PROCESS;

  if (serverProcess) {
    console.log('🛑 Stopping PureMix test server...');
    serverProcess.kill('SIGTERM');

    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force kill if still running
    try {
      serverProcess.kill('SIGKILL');
    } catch {
      // Already terminated
    }

    console.log('✅ PureMix test server stopped');
  }

  // Clean up port file
  const portFile = path.join(os.tmpdir(), 'puremix-test-port.txt');
  try {
    fs.unlinkSync(portFile);
  } catch {
    // File doesn't exist, that's fine
  }

  console.log('🧪 Jest global teardown complete');
}
