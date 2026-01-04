/**
 * Test helper utilities for PureMix integration tests
 */

export async function findServerPort(): Promise<number> {
  // Try common ports that the server might be running on
  const possiblePorts = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009];

  for (const port of possiblePorts) {
    try {
      const response = await fetch(`http://localhost:${port}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000) // Quick timeout
      });

      if (response.ok) {
        // Check if this is a PureMix server
        const text = await response.text();

        // Skip DocumentMind AI explicitly
        if (text.includes('DocumentMind AI') || text.includes('Document Processing Platform')) {
          continue;
        }

        // Look for PureMix-specific indicators
        const isPureMixServer =
          text.includes('PureMix Framework') ||
          text.includes('PureMix Test Suite') ||
          text.includes('.puremix') ||
          text.includes('<loader>') ||
          (text.includes('PureMix') && text.includes('HTML-first'));

        if (isPureMixServer) {
          return port;
        }
      }
    } catch (error) {
      // Port not available, continue to next
      continue;
    }
  }

  throw new Error('PureMix server not found on any port. Please start the server with: cd tests/projects/comprehensive-test && npm run dev');
}

export function getBaseUrl(): Promise<string> {
  return findServerPort().then(port => `http://localhost:${port}`);
}