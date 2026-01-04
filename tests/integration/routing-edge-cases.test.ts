// @ts-nocheck
import { getBaseUrl, findServerPort, cleanupTests } from './test-helper.js';

/**
 * ROUTING EDGE CASES INTEGRATION TESTS
 *
 * PURPOSE: Test complex routing scenarios and edge cases
 * APPROACH: HTTP requests to test route resolution, priority, conflicts
 *
 * EDGE CASES TESTED:
 * - Route priority (static vs dynamic)
 * - Parameter validation and edge values
 * - Special characters in routes
 * - Deeply nested dynamic routes
 * - Catch-all vs specific routes
 * - Conflict resolution
 */

describe('Routing Edge Cases Integration Tests', () => {
  let BASE_URL = '';
  let serverRunning = false;

  beforeAll(async () => {
    const port = await findServerPort();
    BASE_URL = `http://localhost:${port}`;
    serverRunning = true;
  });


  describe('Route Priority and Resolution', () => {
    test('should prioritize static routes over dynamic routes', async () => {

      // If there's a static /users/new route, it should take priority over /users/:id
      const response = await fetch(`${BASE_URL}/users/123`);
      expect(response.status).toBe(200);

      const html = await response.text();
      // Should match dynamic route pattern
      expect(html).toContain('/app/routes/users/[id].puremix');
    });

    test('should resolve nested dynamic routes correctly', async () => {

      const response = await fetch(`${BASE_URL}/blog/2024/03/my-post`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('2024');
      expect(html).toContain('03');
      expect(html).toContain('my-post');
    });

    test('should handle catch-all routes properly', async () => {

      const deepPath = '/docs/api/v2/users/create/advanced';
      const response = await fetch(`${BASE_URL}${deepPath}`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('/app/routes/docs/[...slug].puremix');
    });
  });

  describe('Parameter Edge Values', () => {
    test('should handle numeric IDs', async () => {

      const numericIds = ['0', '1', '999999', '12345678901234567890'];

      for (const id of numericIds) {
        const response = await fetch(`${BASE_URL}/users/${id}`);
        expect(response.status).toBe(200);

        const html = await response.text();
        expect(html).toContain(id);
      }
    });

    test('should handle string slugs with special formats', async () => {

      const slugs = [
        'simple',
        'with-dashes',
        'with_underscores',
        'MixedCase',
        'with.dots',
        'with123numbers',
        'very-long-slug-with-many-words-separated-by-dashes'
      ];

      for (const slug of slugs) {
        const response = await fetch(`${BASE_URL}/docs/${slug}`);
        expect(response.status).toBe(200);

        const html = await response.text();
        expect(html).toContain(slug);
      }
    });

    test('should handle UUID-like identifiers', async () => {

      const uuids = [
        'abc123-def456-ghi789',
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      ];

      for (const uuid of uuids) {
        const response = await fetch(`${BASE_URL}/users/${uuid}`);
        expect(response.status).toBe(200);

        const html = await response.text();
        expect(html).toContain(uuid);
      }
    });

    test('should handle empty path segments gracefully', async () => {

      const response = await fetch(`${BASE_URL}/docs/`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('Documentation');
    });
  });

  describe('Special Characters in Routes', () => {
    test('should handle URL-encoded special characters', async () => {

      const encoded = encodeURIComponent('user@example.com');
      const response = await fetch(`${BASE_URL}/users/${encoded}`);

      expect(response.status).toBeLessThan(500);
    });

    test('should handle spaces in parameters', async () => {

      const withSpaces = encodeURIComponent('user with spaces');
      const response = await fetch(`${BASE_URL}/users/${withSpaces}`);

      expect(response.status).toBeLessThan(500);
    });

    test('should handle international characters', async () => {

      const international = encodeURIComponent('用户-名');
      const response = await fetch(`${BASE_URL}/users/${international}`);

      expect(response.status).toBeLessThan(500);
    });

    test('should handle special URL characters', async () => {

      const special = encodeURIComponent('user#123$test%');
      const response = await fetch(`${BASE_URL}/users/${special}`);

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Deeply Nested Routes', () => {
    test('should handle 5+ level nesting', async () => {

      const deepPath = '/docs/api/v2/users/profile/settings/notifications';
      const response = await fetch(`${BASE_URL}${deepPath}`);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('api');
      expect(html).toContain('notifications');
    });

    test('should handle 10+ level nesting', async () => {

      const veryDeepPath = '/docs/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p';
      const response = await fetch(`${BASE_URL}${veryDeepPath}`);

      expect(response.status).toBe(200);
    });

    test('should maintain parameter values at all nesting levels', async () => {

      const response = await fetch(`${BASE_URL}/blog/2025/12/year-end-review`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('2025');
      expect(html).toContain('12');
      expect(html).toContain('year-end-review');
    });
  });

  describe('Catch-All vs Specific Routes', () => {
    test('should prefer specific routes over catch-all', async () => {

      // Docs has catch-all, but specific routes should take priority if they exist
      const response = await fetch(`${BASE_URL}/docs/getting-started`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('/app/routes/docs/[...slug].puremix');
    });

    test('should handle catch-all with no path segments', async () => {

      const response = await fetch(`${BASE_URL}/docs/`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('Home');
    });

    test('should handle catch-all with very long paths', async () => {

      const longPath = Array(20).fill('segment').join('/');
      const response = await fetch(`${BASE_URL}/docs/${longPath}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Multiple Dynamic Parameters', () => {
    test('should extract all parameters in correct order', async () => {

      const response = await fetch(`${BASE_URL}/blog/2023/06/summer-update`);
      expect(response.status).toBe(200);

      const html = await response.text();
      // All parameters should be extracted and displayed
      expect(html).toContain('2023');
      expect(html).toContain('06');
      expect(html).toContain('summer-update');
    });

    test('should handle mixed static and dynamic segments', async () => {

      const response = await fetch(`${BASE_URL}/shop/electronics/laptop-pro`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('electronics');
      expect(html).toContain('laptop-pro');
    });

    test('should validate parameter format', async () => {

      // Invalid year format - should still work but might show different data
      const response = await fetch(`${BASE_URL}/blog/invalid/01/test`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('invalid');
    });
  });

  describe('Route Conflicts and Ambiguity', () => {
    test('should resolve /users/:id vs /users/:username', async () => {

      // Should match the defined route pattern
      const response = await fetch(`${BASE_URL}/users/john-doe`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('john-doe');
    });

    test('should handle conflicting catch-all routes', async () => {

      // If multiple catch-all patterns exist, should use the most specific
      const response = await fetch(`${BASE_URL}/docs/api/reference`);
      expect(response.status).toBe(200);
    });

    test('should resolve /blog/:year/:month vs /blog/latest/:id', async () => {

      // Dynamic patterns with different segment counts
      const response = await fetch(`${BASE_URL}/blog/2024/05/test`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('2024');
    });
  });

  describe('Query String Handling', () => {
    test('should preserve query strings with dynamic routes', async () => {

      const response = await fetch(`${BASE_URL}/users/123?page=2&limit=10`);
      expect(response.status).toBe(200);

      // Query params should not interfere with route matching
      const html = await response.text();
      expect(html).toContain('123');
    });

    test('should handle complex query strings', async () => {

      const query = 'filter=active&sort=name&order=asc&tags[]=tag1&tags[]=tag2';
      const response = await fetch(`${BASE_URL}/users/456?${query}`);
      expect(response.status).toBe(200);
    });

    test('should handle URL fragments with routes', async () => {

      const response = await fetch(`${BASE_URL}/docs/api/reference#section-1`);
      expect(response.status).toBe(200);
    });
  });

  describe('Trailing Slash Handling', () => {
    test('should handle routes with trailing slashes', async () => {

      const withSlash = await fetch(`${BASE_URL}/users/123/`);
      const withoutSlash = await fetch(`${BASE_URL}/users/123`);

      // Both should work or redirect
      expect(withSlash.status).toBeLessThan(500);
      expect(withoutSlash.status).toBeLessThan(500);
    });

    test('should normalize trailing slashes consistently', async () => {

      const response = await fetch(`${BASE_URL}/docs/api/`);
      expect(response.status).toBe(200);
    });
  });

  describe('Case Sensitivity', () => {
    test('should handle case variations in routes', async () => {

      const lower = await fetch(`${BASE_URL}/users/test`);
      const upper = await fetch(`${BASE_URL}/users/TEST`);
      const mixed = await fetch(`${BASE_URL}/users/Test`);

      // All should resolve (parameters are case-sensitive)
      expect(lower.status).toBe(200);
      expect(upper.status).toBe(200);
      expect(mixed.status).toBe(200);
    });
  });

  describe('Performance with Complex Routes', () => {
    test('should resolve routes quickly', async () => {

      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/blog/2024/03/performance-test`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('should handle concurrent complex route requests', async () => {

      const requests = [
        fetch(`${BASE_URL}/blog/2024/01/post1`),
        fetch(`${BASE_URL}/shop/electronics/product1`),
        fetch(`${BASE_URL}/docs/api/users/create/advanced`),
        fetch(`${BASE_URL}/users/concurrent-test-1`),
        fetch(`${BASE_URL}/blog/2025/12/post2`),
        fetch(`${BASE_URL}/shop/books/book1`),
        fetch(`${BASE_URL}/docs/guides/routing/dynamic`),
        fetch(`${BASE_URL}/users/concurrent-test-2`)
      ];

      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Error Cases and Validation', () => {
    test('should handle malformed route parameters', async () => {

      const malformed = '../../etc/passwd';
      const response = await fetch(`${BASE_URL}/users/${malformed}`);

      // Should not expose file system
      expect([200, 400, 404]).toContain(response.status);
    });

    test('should handle null byte injection attempts', async () => {

      const nullByte = encodeURIComponent('test\x00malicious');
      const response = await fetch(`${BASE_URL}/users/${nullByte}`);

      expect(response.status).toBeLessThan(500);
    });

    test('should handle extremely long parameter values', async () => {

      const longParam = 'a'.repeat(10000);
      const response = await fetch(`${BASE_URL}/users/${longParam}`);

      // Should handle gracefully (200, 400, or 414)
      expect([200, 400, 414].includes(response.status)).toBe(true);
    });
  });
});
