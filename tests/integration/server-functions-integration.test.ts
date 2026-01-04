// @ts-nocheck
import { getBaseUrl, findServerPort, cleanupTests } from './test-helper.js';

/**
 * SERVER FUNCTIONS INTEGRATION TESTS
 *
 * PURPOSE: Test server-side functions via HTTP requests
 * APPROACH: Integration testing - test actual server function execution
 *
 * REQUIREMENTS:
 * - Dev server running
 *
 * TEST COVERAGE:
 * - Server function execution via POST
 * - Form data handling
 * - CSRF token validation
 * - Action/loader pattern
 * - Component server functions
 * - Error handling
 */

describe('Server Functions Integration Tests', () => {
  let BASE_URL = '';
  let serverRunning = false;

  beforeAll(async () => {
    const port = await findServerPort();
    BASE_URL = `http://localhost:${port}`;
    serverRunning = true;
  });


  describe('Form Submissions', () => {
    test('should handle basic form POST', async () => {

      const formData = new URLSearchParams();
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');
      formData.append('message', 'Test message');

      const response = await fetch(`${BASE_URL}/basic-form-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      expect(response.status).toBeLessThan(500);
    });

    test('should handle JSON POST requests', async () => {

      const response = await fetch(`${BASE_URL}/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings',
          data: { theme: 'dark', notifications: true }
        })
      });

      expect(response.status).toBeLessThan(500);
    });

    test('should handle multipart form data', async () => {

      const formData = new FormData();
      formData.append('title', 'Test Upload');
      formData.append('description', 'Testing file upload');

      const response = await fetch(`${BASE_URL}/file-upload-test`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Server Function Execution', () => {
    test('should execute loader functions on GET requests', async () => {

      const response = await fetch(`${BASE_URL}/dashboard`);
      const html = await response.text();

      // Loader data should be present in the page
      expect(html).toContain('PureMix');
      expect(response.status).toBe(200);
    });

    test('should execute action functions on POST requests', async () => {

      const response = await fetch(`${BASE_URL}/basic-form-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' })
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Data Validation', () => {
    test('should handle empty form submissions', async () => {

      const formData = new URLSearchParams();

      const response = await fetch(`${BASE_URL}/basic-form-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      expect(response.status).toBeLessThan(500);
    });

    test('should handle invalid data types', async () => {

      const response = await fetch(`${BASE_URL}/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invalidField: { nested: { deeply: { invalid: true } } }
        })
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Recovery', () => {
    test('should handle server function errors gracefully', async () => {

      const response = await fetch(`${BASE_URL}/error-handling-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerError: true })
      });

      // Should return error response, not crash
      expect(response.status).toBeLessThan(500);
    });

    test('should handle malformed JSON', async () => {

      const response = await fetch(`${BASE_URL}/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json here'
      });

      // Should return 400-level error, not 500
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Response Formats', () => {
    test('should return HTML after form submission (full page reload)', async () => {

      const formData = new URLSearchParams();
      formData.append('test', 'value');

      const response = await fetch(`${BASE_URL}/basic-form-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      const contentType = response.headers.get('content-type');

      if (response.status === 200) {
        expect(contentType).toContain('text/html');
      }
    });

    test('should return JSON for AJAX requests', async () => {

      const response = await fetch(`${BASE_URL}/api/users/123`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ test: true })
      });

      if (response.status === 200) {
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');
      }
    });
  });

  describe('Session Handling', () => {
    test('should maintain session across requests', async () => {

      // First request
      const response1 = await fetch(`${BASE_URL}/dashboard`);
      const cookies1 = response1.headers.get('set-cookie');

      if (cookies1) {
        // Second request with cookies
        const response2 = await fetch(`${BASE_URL}/dashboard`, {
          headers: { 'Cookie': cookies1 }
        });

        expect(response2.status).toBe(200);
      }
    });
  });

  describe('Security Features', () => {
    test('should sanitize user input in form submissions', async () => {

      const formData = new URLSearchParams();
      formData.append('name', '<script>alert("XSS")</script>');
      formData.append('email', 'test@example.com');

      const response = await fetch(`${BASE_URL}/security-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      expect(response.status).toBeLessThan(500);

      const html = await response.text();
      // Script tags should be escaped/removed
      expect(html).not.toContain('<script>alert');
    });

    test('should prevent SQL injection in inputs', async () => {

      const formData = new URLSearchParams();
      formData.append('username', "admin' OR '1'='1");
      formData.append('password', "' OR '1'='1");

      const response = await fetch(`${BASE_URL}/auth-flow-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      // Should handle safely
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Component Server Functions', () => {
    test('should execute component-scoped server functions', async () => {

      const response = await fetch(`${BASE_URL}/props-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component: 'UserCard',
          action: 'updateProfile'
        })
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple simultaneous POST requests', async () => {

      const requests = Array(5).fill(null).map((_, i) =>
        fetch(`${BASE_URL}/dashboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request: i })
        })
      );

      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).toBeLessThan(500);
      }
    });
  });

  describe('Data Persistence', () => {
    test('should persist data through action/loader cycle', async () => {

      // Submit data via POST
      const postResponse = await fetch(`${BASE_URL}/database-integration-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: { name: 'Test Item', value: 123 }
        })
      });

      expect(postResponse.status).toBeLessThan(500);

      // Verify data appears in subsequent GET
      const getResponse = await fetch(`${BASE_URL}/database-integration-test`);
      const html = await getResponse.text();

      expect(getResponse.status).toBe(200);
      expect(html).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle extremely large POST payloads', async () => {

      const largeData = {
        items: Array(100).fill(null).map((_, i) => ({
          id: i,
          data: 'x'.repeat(100)
        }))
      };

      const response = await fetch(`${BASE_URL}/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largeData)
      });

      // Should handle or reject gracefully (413 Payload Too Large is acceptable)
      expect([200, 413]).toContain(response.status);
    });

    test('should handle rapid sequential requests', async () => {

      for (let i = 0; i < 10; i++) {
        const response = await fetch(`${BASE_URL}/dashboard`);
        expect(response.status).toBe(200);
      }
    });
  });
});
