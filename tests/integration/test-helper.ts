/**
 * Test helper utilities for PureMix integration tests
 *
 * The server is started by jest.global-setup.ts before any tests run.
 * These helpers just read the server port from the temp file.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let cachedPort: number | null = null;

/**
 * Get the port of the running PureMix test server
 * The server is started by jest.global-setup.ts
 */
export async function findServerPort(): Promise<number> {
  if (cachedPort) {
    return cachedPort;
  }

  // Read port from temp file written by globalSetup
  const portFile = path.join(os.tmpdir(), 'puremix-test-port.txt');

  // Try up to 10 times with 500ms delays (5 seconds total)
  for (let i = 0; i < 10; i++) {
    try {
      if (fs.existsSync(portFile)) {
        const port = parseInt(fs.readFileSync(portFile, 'utf-8').trim(), 10);
        if (port && port > 0) {
          cachedPort = port;
          console.log(`📋 Using PureMix test server on port ${port}`);
          return port;
        }
      }
    } catch {
      // File not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error(
    'PureMix test server not found. It should be started by jest.global-setup.ts. ' +
    'If this error persists, check that the global setup is running correctly.'
  );
}

export async function getBaseUrl(): Promise<string> {
  const port = await findServerPort();
  return `http://localhost:${port}`;
}

/**
 * Cleanup function - no longer needed as server is managed globally
 */
export function cleanupTests(): void {
  // Server is managed by jest.global-setup.ts and jest.global-teardown.ts
  // Nothing to clean up here
}
