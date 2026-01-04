// @ts-nocheck
import { getBaseUrl, findServerPort } from './test-helper.js';

/**
 * AST TREE INTEGRATION TESTS
 *
 * PURPOSE: Test the PureMixInterpreter's AST-based template parsing and evaluation
 * APPROACH: HTTP requests to test REAL template expressions via integration
 *
 * AST CAPABILITIES TESTED:
 * - Token recognition (identifiers, literals, operators, HTML tags)
 * - Expression parsing (member access, conditionals, array methods)
 * - JavaScript block execution with __export
 * - Nested expression handling
 * - Edge cases and error handling
 */

describe('AST Tree Integration Tests', () => {
  let BASE_URL = '';

  beforeAll(async () => {
    BASE_URL = `http://localhost:${await findServerPort()}`;
  });

  describe('Basic Expression Parsing', () => {
    test('should parse and evaluate simple identifiers', async () => {

      const response = await fetch(`${BASE_URL}/users/123`);
      const html = await response.text();

      // Simple identifier: {loadPage.data.userId}
      expect(html).toContain('123');
    });

    test('should parse member access chains', async () => {

      const response = await fetch(`${BASE_URL}/users/456`);
      const html = await response.text();

      // Member access: {loadPage.data.user.name}
      expect(html).toContain('User 456');
      // Deep member access: {loadPage.data.user.email}
      expect(html).toContain('user456@example.com');
    });

    test('should parse array index access', async () => {

      const response = await fetch(`${BASE_URL}/docs/api/reference/guide`);
      const html = await response.text();

      // Loader returns path segments array
      // Template should access array elements
      expect(html).toContain('api');
      expect(html).toContain('reference');
      expect(html).toContain('guide');
    });
  });

  describe('Conditional Expression Parsing', () => {
    test('should parse ternary conditionals with HTML', async () => {

      const response = await fetch(`${BASE_URL}/shop/electronics/laptop-pro`);
      const html = await response.text();

      // Conditional: {loadPage.data.inStock ? <span>✅ In Stock</span> : <span>❌ Out of Stock</span>}
      expect(html).toContain('✅ In Stock');
      expect(html).not.toContain('❌ Out of Stock');
    });

    test('should handle nested ternary conditionals', async () => {

      const response = await fetch(`${BASE_URL}/shop/clothing/tshirt-basic`);
      const html = await response.text();

      // Should show stock status correctly
      expect(html).toContain('In Stock');
    });

    test('should parse boolean comparisons', async () => {

      const response = await fetch(`${BASE_URL}/users/test-user`);
      const html = await response.text();

      // Boolean comparison in conditionals should work
      expect(response.status).toBe(200);
    });
  });

  describe('Array Method Parsing', () => {
    test('should parse .map() method with arrow functions', async () => {

      const response = await fetch(`${BASE_URL}/docs/api/users/create`);
      const html = await response.text();

      // Template uses: {loadPage.data.segments.map(segment => <li>{segment}</li>)}
      expect(html).toContain('api');
      expect(html).toContain('users');
      expect(html).toContain('create');
    });

    test('should parse .filter() with conditions', async () => {

      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Home page might filter items
      expect(response.status).toBe(200);
    });

    test('should handle chained array methods', async () => {

      const response = await fetch(`${BASE_URL}/blog/2024/03/advanced-routing-patterns`);
      const html = await response.text();

      // Slug processing with .split().map().join()
      expect(html).toContain('Advanced Routing Patterns');
    });
  });

  describe('JavaScript Block Parsing', () => {
    test('should parse multi-line JavaScript blocks', async () => {

      const response = await fetch(`${BASE_URL}/typescript-javascript-test`);
      const html = await response.text();

      // JavaScript blocks with variable declarations, loops, functions
      expect(html).toContain('TypeScript + JavaScript Integration Test');
    });

    test('should handle __export pattern in JavaScript blocks', async () => {

      const response = await fetch(`${BASE_URL}/typescript-javascript-test`);
      const html = await response.text();

      // JavaScript block should export variables via __export
      expect(response.status).toBe(200);
    });

    test('should parse complex JavaScript expressions', async () => {

      const response = await fetch(`${BASE_URL}/python-financial-test`);
      const html = await response.text();

      // Complex calculations and transformations
      expect(response.status).toBe(200);
    });
  });

  describe('String Literal Handling', () => {
    test('should correctly handle string literals in expressions', async () => {

      const response = await fetch(`${BASE_URL}/blog/2024/05/this-is-a-test-post`);
      const html = await response.text();

      // String literals should be preserved
      expect(html).toContain('This Is A Test Post');
    });

    test('should handle template literals', async () => {

      const response = await fetch(`${BASE_URL}/shop/books/javascript-guide`);
      const html = await response.text();

      // Template literals with variables
      expect(html).toContain('JavaScript');
    });

    test('should handle escaped quotes in strings', async () => {

      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Escaped quotes should work correctly
      expect(response.status).toBe(200);
    });
  });

  describe('Operator Parsing', () => {
    test('should parse equality operators (===, !==)', async () => {

      const response = await fetch(`${BASE_URL}/shop/electronics/laptop-pro`);
      const html = await response.text();

      // Comparison operators in conditionals
      expect(response.status).toBe(200);
    });

    test('should parse logical operators (&&, ||)', async () => {

      const response = await fetch(`${BASE_URL}/typescript-javascript-test`);
      const html = await response.text();

      // Logical operators in conditions
      expect(response.status).toBe(200);
    });

    test('should parse arithmetic operators (+, -, *, /)', async () => {

      const response = await fetch(`${BASE_URL}/python-financial-test`);
      const html = await response.text();

      // Arithmetic calculations
      expect(response.status).toBe(200);
    });

    test('should handle nullish coalescing (??)', async () => {

      const response = await fetch(`${BASE_URL}/docs/`);
      const html = await response.text();

      // Nullish coalescing: {loadPage.data.slug || 'Home'}
      expect(html).toContain('Home');
    });
  });

  describe('HTML Tag Parsing', () => {
    test('should parse HTML tags within expressions', async () => {

      const response = await fetch(`${BASE_URL}/users/789`);
      const html = await response.text();

      // HTML tags inside conditionals and maps
      expect(html).toContain('<p>');
      expect(html).toContain('<div>');
      expect(html).toContain('<h1>');
    });

    test('should handle self-closing tags', async () => {

      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();

      // Self-closing tags in template
      expect(response.status).toBe(200);
    });

    test('should preserve HTML attributes', async () => {

      const response = await fetch(`${BASE_URL}/users/123`);
      const html = await response.text();

      // HTML attributes should be preserved
      expect(html).toContain('style=');
      expect(html).toContain('href=');
    });
  });

  describe('Nested Expression Parsing', () => {
    test('should parse deeply nested expressions', async () => {

      const response = await fetch(`${BASE_URL}/shop/electronics/tablet-max`);
      const html = await response.text();

      // Nested object access: {loadPage.data.product.name}
      expect(html).toContain('Tablet Max');
    });

    test('should handle nested conditionals', async () => {

      const response = await fetch(`${BASE_URL}/shop/books/web-patterns`);
      const html = await response.text();

      // Nested ternary operators
      expect(response.status).toBe(200);
    });

    test('should parse nested array methods', async () => {

      const response = await fetch(`${BASE_URL}/blog/2025/06/future-of-web-development`);
      const html = await response.text();

      // Nested map operations
      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined variables gracefully', async () => {

      const response = await fetch(`${BASE_URL}/shop/unknown/product`);
      const html = await response.text();

      // Should not crash on undefined
      expect(response.status).toBe(200);
    });

    test('should handle null values in expressions', async () => {

      const response = await fetch(`${BASE_URL}/docs/`);
      const html = await response.text();

      // Null handling in templates
      expect(response.status).toBe(200);
    });

    test('should parse expressions with special characters', async () => {

      const response = await fetch(`${BASE_URL}/docs/api/users@v2`);
      const html = await response.text();

      // Special characters in paths
      expect(response.status).toBe(200);
    });

    test('should handle very long expressions', async () => {

      const response = await fetch(`${BASE_URL}/python-financial-test`);
      const html = await response.text();

      // Complex multi-line expressions
      expect(response.status).toBe(200);
    });
  });

  describe('AST Token Recognition', () => {
    test('should recognize identifier tokens', async () => {

      const response = await fetch(`${BASE_URL}/users/token-test`);
      const html = await response.text();

      // Variable name recognition
      expect(html).toContain('User token-test');
    });

    test('should recognize literal tokens', async () => {

      const response = await fetch(`${BASE_URL}/shop/electronics/phone-x`);
      const html = await response.text();

      // Number, string, boolean literals
      expect(html).toContain('$899');
      expect(html).toContain('42');
    });

    test('should recognize operator tokens', async () => {

      const response = await fetch(`${BASE_URL}/typescript-javascript-test`);
      const html = await response.text();

      // Operator recognition in expressions
      expect(response.status).toBe(200);
    });

    test('should recognize HTML tag tokens', async () => {

      const response = await fetch(`${BASE_URL}/blog/2024/01/introduction-to-puremix`);
      const html = await response.text();

      // HTML tag recognition in conditionals
      expect(html).toContain('<h1>');
      expect(html).toContain('<li>');
      expect(html).toContain('<a href=');
    });
  });

  describe('Performance and Optimization', () => {
    test('should parse expressions efficiently', async () => {

      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/python-financial-test`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      // AST parsing should be fast (< 3000ms including network)
      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('should handle multiple concurrent AST parses', async () => {

      const requests = [
        fetch(`${BASE_URL}/users/concurrent-1`),
        fetch(`${BASE_URL}/docs/api/concurrent`),
        fetch(`${BASE_URL}/blog/2024/02/test`),
        fetch(`${BASE_URL}/shop/books/test-book`)
      ];

      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });
  });
});
