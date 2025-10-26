// @ts-nocheck
/**
 * Loader Tests
 * Tests async data loading, MongoDB integration, and loader functionality
 */

import { createMockMongoDB, testData } from './mocks/mongodb-mock';

describe('Loaders', () => {
  let mockDB;
  let mockClient;
  let mockRequest;

  beforeEach(async () => {
    // Create mock MongoDB instance
    const mock = createMockMongoDB({
      connectionDelay: 50,
      queryDelay: 30,
      insertDelay: 40
    });

    mockClient = mock.client;
    await mockClient.connect();
    mockDB = mockClient.db('test');

    // Seed test data
    const usersCollection = mockDB.collection('users');
    await usersCollection.insertMany(testData.users);

    const postsCollection = mockDB.collection('posts');
    await postsCollection.insertMany(testData.posts);

    // Mock request object
    mockRequest = {
      url: '/test',
      method: 'GET',
      params: { id: 'user1' },
      query: { filter: 'active' },
      headers: {},
      body: {},
      session: { userId: 'user1' }
    };
  });

  afterEach(async () => {
    if (mockClient) {
      await mockClient.close();
    }
  });

  describe('Basic Loader Execution', () => {
    test('should execute simple loader function', async () => {
      async function loadPage(request) {
        return {
          data: { message: 'Hello World' },
          state: {}
        };
      }

      const result = await loadPage(mockRequest);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.message).toBe('Hello World');
    });

    test('should access request params in loader', async () => {
      async function loadUserProfile(request) {
        const userId = request.params.id;

        return {
          data: { userId },
          state: {}
        };
      }

      const result = await loadUserProfile(mockRequest);

      expect(result.data.userId).toBe('user1');
    });

    test('should access request query in loader', async () => {
      async function loadFilteredData(request) {
        const filter = request.query.filter;

        return {
          data: { filter },
          state: {}
        };
      }

      const result = await loadFilteredData(mockRequest);

      expect(result.data.filter).toBe('active');
    });

    test('should access session data in loader', async () => {
      async function loadCurrentUser(request) {
        const userId = request.session.userId;

        return {
          data: { userId },
          state: { authenticated: true }
        };
      }

      const result = await loadCurrentUser(mockRequest);

      expect(result.data.userId).toBe('user1');
      expect(result.state.authenticated).toBe(true);
    });
  });

  describe('Async Data Loading with MongoDB', () => {
    test('should load user from MongoDB', async () => {
      async function loadUserProfile(request) {
        const userId = request.params.id;
        const usersCollection = mockDB.collection('users');

        const user = await usersCollection.findById(userId);

        return {
          data: { user },
          state: {}
        };
      }

      const result = await loadUserProfile(mockRequest);

      expect(result.data.user).toBeDefined();
      expect(result.data.user.name).toBe('Alice Johnson');
      expect(result.data.user.email).toBe('alice@example.com');
    });

    test('should load multiple users with filter', async () => {
      async function loadActiveUsers(request) {
        const usersCollection = mockDB.collection('users');

        const users = await usersCollection.find({ isActive: true });

        return {
          data: { users },
          state: { totalActive: users.length }
        };
      }

      const result = await loadActiveUsers(mockRequest);

      expect(result.data.users).toBeDefined();
      expect(result.data.users.length).toBe(4); // 4 active users in test data
      expect(result.state.totalActive).toBe(4);
    });

    test('should load posts for user', async () => {
      async function loadUserPosts(request) {
        const userId = request.params.id;
        const postsCollection = mockDB.collection('posts');

        const posts = await postsCollection.find({ authorId: userId });

        return {
          data: { posts },
          state: { postCount: posts.length }
        };
      }

      const result = await loadUserPosts(mockRequest);

      expect(result.data.posts).toBeDefined();
      expect(result.data.posts.length).toBe(2); // User1 has 2 posts
    });

    test('should measure async operation time', async () => {
      async function loadDataWithTiming(request) {
        const startTime = Date.now();

        const usersCollection = mockDB.collection('users');
        await usersCollection.find({ isActive: true });

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        return {
          data: { loadTime },
          state: {}
        };
      }

      const result = await loadDataWithTiming(mockRequest);

      // Should take at least the query delay (30ms in our mock)
      expect(result.data.loadTime).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Multiple Async Operations', () => {
    test('should load data from multiple sources with Promise.all', async () => {
      async function loadDashboard(request) {
        const userId = request.session.userId;
        const usersCollection = mockDB.collection('users');
        const postsCollection = mockDB.collection('posts');

        const [user, posts, allUsers] = await Promise.all([
          usersCollection.findById(userId),
          postsCollection.find({ authorId: userId }),
          usersCollection.find({ isActive: true })
        ]);

        return {
          data: {
            user,
            posts,
            stats: {
              userPostCount: posts.length,
              totalActiveUsers: allUsers.length
            }
          },
          state: { ready: true }
        };
      }

      const result = await loadDashboard(mockRequest);

      expect(result.data.user).toBeDefined();
      expect(result.data.posts).toBeDefined();
      expect(result.data.stats.userPostCount).toBe(2);
      expect(result.data.stats.totalActiveUsers).toBe(4);
      expect(result.state.ready).toBe(true);
    });

    test('should load sequential dependent data', async () => {
      async function loadRelatedData(request) {
        const usersCollection = mockDB.collection('users');
        const postsCollection = mockDB.collection('posts');

        // First, load user
        const user = await usersCollection.findById(request.params.id);

        // Then, load user's posts
        const posts = await postsCollection.find({ authorId: user._id });

        // Then, calculate stats from posts
        const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);

        return {
          data: {
            user,
            posts,
            totalLikes
          },
          state: {}
        };
      }

      const result = await loadRelatedData(mockRequest);

      expect(result.data.user).toBeDefined();
      expect(result.data.posts.length).toBe(2);
      expect(result.data.totalLikes).toBe(73); // 42 + 31 from test data
    });

    test('should handle complex data aggregation', async () => {
      async function loadAnalytics(request) {
        const usersCollection = mockDB.collection('users');
        const postsCollection = mockDB.collection('posts');

        const [users, posts] = await Promise.all([
          usersCollection.find({ isActive: true }),
          postsCollection.find({})
        ]);

        // Group posts by author
        const postsByAuthor = posts.reduce((acc, post) => {
          acc[post.authorId] = acc[post.authorId] || [];
          acc[post.authorId].push(post);
          return acc;
        }, {});

        // Calculate author with most posts
        const authorStats = Object.entries(postsByAuthor).map(([authorId, authorPosts]) => ({
          authorId,
          postCount: authorPosts.length,
          totalLikes: authorPosts.reduce((sum, p) => sum + p.likes, 0)
        }));

        return {
          data: {
            users,
            posts,
            authorStats
          },
          state: { analyzed: true }
        };
      }

      const result = await loadAnalytics(mockRequest);

      expect(result.data.users.length).toBe(4);
      expect(result.data.posts.length).toBe(3);
      expect(result.data.authorStats).toBeDefined();
      expect(result.state.analyzed).toBe(true);
    });
  });

  describe('Error Handling in Loaders', () => {
    test('should handle database errors gracefully', async () => {
      async function loadWithErrorHandling(request) {
        try {
          const usersCollection = mockDB.collection('users');
          // Simulate query that might fail
          const user = await usersCollection.findById(request.params.id);

          if (!user) {
            throw new Error('User not found');
          }

          return {
            data: { user },
            state: {}
          };
        } catch (error) {
          return {
            data: { error: error.message },
            state: { hasError: true }
          };
        }
      }

      // Test with valid ID
      const validResult = await loadWithErrorHandling(mockRequest);
      expect(validResult.data.user).toBeDefined();

      // Test with invalid ID
      mockRequest.params.id = 'nonexistent';
      const errorResult = await loadWithErrorHandling(mockRequest);
      expect(errorResult.state.hasError).toBe(true);
      expect(errorResult.data.error).toBe('User not found');
    });

    test('should handle missing data gracefully', async () => {
      async function loadOptionalData(request) {
        const usersCollection = mockDB.collection('users');

        const user = await usersCollection.findById(request.params.id);

        return {
          data: {
            user: user || null,
            hasUser: !!user
          },
          state: {}
        };
      }

      mockRequest.params.id = 'nonexistent';
      const result = await loadOptionalData(mockRequest);

      expect(result.data.user).toBeNull();
      expect(result.data.hasUser).toBe(false);
    });

    test('should handle validation errors in loader', async () => {
      async function loadWithValidation(request) {
        const userId = request.params.id;

        if (!userId) {
          return {
            data: { error: 'User ID is required' },
            state: { validationError: true }
          };
        }

        if (userId.length < 3) {
          return {
            data: { error: 'Invalid user ID format' },
            state: { validationError: true }
          };
        }

        const usersCollection = mockDB.collection('users');
        const user = await usersCollection.findById(userId);

        return {
          data: { user },
          state: { validationError: false }
        };
      }

      // Test valid case
      const validResult = await loadWithValidation(mockRequest);
      expect(validResult.state.validationError).toBe(false);

      // Test invalid case
      mockRequest.params.id = 'ab';
      const invalidResult = await loadWithValidation(mockRequest);
      expect(invalidResult.state.validationError).toBe(true);
      expect(invalidResult.data.error).toBe('Invalid user ID format');
    });

    test('should handle timeout scenarios', async () => {
      async function loadWithTimeout(request) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 200)
        );

        const dataPromise = (async () => {
          const usersCollection = mockDB.collection('users');
          return await usersCollection.find({ isActive: true });
        })();

        try {
          const users = await Promise.race([dataPromise, timeoutPromise]);
          return {
            data: { users },
            state: { timedOut: false }
          };
        } catch (error) {
          return {
            data: { error: error.message },
            state: { timedOut: true }
          };
        }
      }

      const result = await loadWithTimeout(mockRequest);

      // With our mock delays (30ms) and 200ms timeout buffer, this should complete successfully
      expect(result.state.timedOut).toBe(false);
    });
  });

  describe('Loader with ActionResult', () => {
    test('should process actionResult in loader', async () => {
      async function loadWithActionResult(request, actionResult) {
        const usersCollection = mockDB.collection('users');
        const user = await usersCollection.findById(request.params.id);

        return {
          data: {
            user,
            actionResult: actionResult || null,
            showSuccessMessage: actionResult?.success || false
          },
          state: {}
        };
      }

      const actionResult = {
        success: true,
        message: 'Profile updated successfully'
      };

      const result = await loadWithActionResult(mockRequest, actionResult);

      expect(result.data.user).toBeDefined();
      expect(result.data.actionResult).toEqual(actionResult);
      expect(result.data.showSuccessMessage).toBe(true);
    });

    test('should refresh data after action', async () => {
      const usersCollection = mockDB.collection('users');

      async function loadAfterUpdate(request, actionResult) {
        // Load fresh data after update
        const user = await usersCollection.findById(request.params.id);

        return {
          data: {
            user,
            wasUpdated: actionResult?.success || false,
            updatedFields: actionResult?.updatedFields || []
          },
          state: {}
        };
      }

      const actionResult = {
        success: true,
        updatedFields: ['name', 'email']
      };

      const result = await loadAfterUpdate(mockRequest, actionResult);

      expect(result.data.wasUpdated).toBe(true);
      expect(result.data.updatedFields).toEqual(['name', 'email']);
    });
  });

  describe('Complex Data Transformations', () => {
    test('should transform and enrich data in loader', async () => {
      async function loadEnrichedUsers(request) {
        const usersCollection = mockDB.collection('users');
        const postsCollection = mockDB.collection('posts');

        const users = await usersCollection.find({ isActive: true });

        // Enrich each user with post count
        const enrichedUsers = await Promise.all(
          users.map(async (user) => {
            const posts = await postsCollection.find({ authorId: user._id });

            return {
              ...user,
              postCount: posts.length,
              totalLikes: posts.reduce((sum, p) => sum + p.likes, 0),
              hasPublished: posts.length > 0
            };
          })
        );

        return {
          data: { users: enrichedUsers },
          state: {}
        };
      }

      const result = await loadEnrichedUsers(mockRequest);

      expect(result.data.users).toBeDefined();
      expect(result.data.users.length).toBe(4);
      expect(result.data.users[0].postCount).toBeDefined();
      expect(result.data.users[0].totalLikes).toBeDefined();
    });

    test('should paginate results in loader', async () => {
      async function loadPaginatedUsers(request) {
        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '2');
        const skip = (page - 1) * limit;

        const usersCollection = mockDB.collection('users');

        const [users, totalCount] = await Promise.all([
          usersCollection.find({ isActive: true }).then(all => all.slice(skip, skip + limit)),
          usersCollection.countDocuments({ isActive: true })
        ]);

        return {
          data: {
            users,
            pagination: {
              page,
              limit,
              totalCount,
              totalPages: Math.ceil(totalCount / limit),
              hasNext: skip + limit < totalCount,
              hasPrev: page > 1
            }
          },
          state: {}
        };
      }

      mockRequest.query = { page: '1', limit: '2' };
      const result = await loadPaginatedUsers(mockRequest);

      expect(result.data.users.length).toBe(2);
      expect(result.data.pagination.totalCount).toBe(4);
      expect(result.data.pagination.totalPages).toBe(2);
      expect(result.data.pagination.hasNext).toBe(true);
      expect(result.data.pagination.hasPrev).toBe(false);
    });

    test('should filter and sort data in loader', async () => {
      async function loadFilteredSorted(request) {
        const role = request.query.role;
        const sortBy = request.query.sortBy || 'name';
        const order = request.query.order || 'asc';

        const usersCollection = mockDB.collection('users');

        let query = { isActive: true };
        if (role) {
          query.role = role;
        }

        let users = await usersCollection.find(query);

        // Sort
        users.sort((a, b) => {
          const compareA = a[sortBy];
          const compareB = b[sortBy];

          if (order === 'asc') {
            return compareA > compareB ? 1 : -1;
          } else {
            return compareA < compareB ? 1 : -1;
          }
        });

        return {
          data: { users },
          state: { sortBy, order }
        };
      }

      mockRequest.query = { role: 'admin', sortBy: 'name', order: 'asc' };
      const result = await loadFilteredSorted(mockRequest);

      expect(result.data.users).toBeDefined();
      expect(result.data.users.every(u => u.role === 'admin')).toBe(true);
      expect(result.state.sortBy).toBe('name');
    });
  });

  describe('Real-World Loader Scenarios', () => {
    test('should load e-commerce product page data', async () => {
      const productsCollection = mockDB.collection('products');
      await productsCollection.insertMany(testData.products);

      async function loadProductPage(request) {
        const productId = request.params.id;

        const product = await productsCollection.findById(productId);

        if (!product) {
          return {
            data: { notFound: true },
            state: { statusCode: 404 }
          };
        }

        // Load related products
        const relatedProducts = await productsCollection.find({
          category: product.category,
          inStock: true
        });

        // Filter out current product
        const filtered = relatedProducts.filter(p => p._id !== productId);

        return {
          data: {
            product,
            relatedProducts: filtered.slice(0, 4),
            breadcrumbs: [
              { name: 'Home', url: '/' },
              { name: product.category, url: `/category/${product.category}` },
              { name: product.name, url: null }
            ]
          },
          state: {
            inStock: product.inStock,
            category: product.category
          }
        };
      }

      mockRequest.params.id = 'prod1';
      const result = await loadProductPage(mockRequest);

      expect(result.data.product).toBeDefined();
      expect(result.data.product.name).toBe('Laptop');
      expect(result.data.relatedProducts).toBeDefined();
      expect(result.data.breadcrumbs.length).toBe(3);
      expect(result.state.inStock).toBe(true);
    });

    test('should load admin dashboard with statistics', async () => {
      async function loadAdminDashboard(request) {
        const usersCollection = mockDB.collection('users');
        const postsCollection = mockDB.collection('posts');

        const [allUsers, activePosts, recentUsers] = await Promise.all([
          usersCollection.find({}),
          postsCollection.find({}),
          usersCollection.find({}).then(users =>
            users.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
          )
        ]);

        const stats = {
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter(u => u.isActive).length,
          inactiveUsers: allUsers.filter(u => !u.isActive).length,
          totalPosts: activePosts.length,
          totalLikes: activePosts.reduce((sum, p) => sum + p.likes, 0),
          adminCount: allUsers.filter(u => u.role === 'admin').length,
          moderatorCount: allUsers.filter(u => u.role === 'moderator').length
        };

        return {
          data: {
            stats,
            recentUsers,
            recentPosts: activePosts.slice(0, 5)
          },
          state: { period: '30d' }
        };
      }

      const result = await loadAdminDashboard(mockRequest);

      expect(result.data.stats.totalUsers).toBe(5);
      expect(result.data.stats.activeUsers).toBe(4);
      expect(result.data.stats.inactiveUsers).toBe(1);
      expect(result.data.stats.totalPosts).toBe(3);
      expect(result.data.recentUsers.length).toBeLessThanOrEqual(5);
    });

    test('should load user profile with activity feed', async () => {
      async function loadUserActivity(request) {
        const userId = request.params.id;

        const usersCollection = mockDB.collection('users');
        const postsCollection = mockDB.collection('posts');

        const user = await usersCollection.findById(userId);

        if (!user) {
          return {
            data: { notFound: true },
            state: { statusCode: 404 }
          };
        }

        const posts = await postsCollection.find({ authorId: userId });

        // Build activity feed
        const activityFeed = posts.map(post => ({
          type: 'post',
          date: post.createdAt || new Date(),
          content: post.title,
          likes: post.likes
        }));

        // Sort by date
        activityFeed.sort((a, b) => b.date - a.date);

        return {
          data: {
            user,
            activityFeed,
            stats: {
              postsCount: posts.length,
              totalLikes: posts.reduce((sum, p) => sum + p.likes, 0),
              averageLikes: posts.length > 0
                ? posts.reduce((sum, p) => sum + p.likes, 0) / posts.length
                : 0
            }
          },
          state: {
            isOwnProfile: request.session.userId === userId
          }
        };
      }

      const result = await loadUserActivity(mockRequest);

      expect(result.data.user).toBeDefined();
      expect(result.data.activityFeed).toBeDefined();
      expect(result.data.stats.postsCount).toBe(2);
      expect(result.state.isOwnProfile).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    test('should batch database queries efficiently', async () => {
      async function loadOptimized(request) {
        const startTime = Date.now();

        const usersCollection = mockDB.collection('users');
        const postsCollection = mockDB.collection('posts');

        // Parallel queries instead of sequential
        const [users, posts] = await Promise.all([
          usersCollection.find({ isActive: true }),
          postsCollection.find({})
        ]);

        const endTime = Date.now();

        return {
          data: {
            users,
            posts,
            loadTime: endTime - startTime
          },
          state: {}
        };
      }

      const result = await loadOptimized(mockRequest);

      // Parallel queries should be faster than sequential
      // With 30ms query delay, parallel should be ~30ms, sequential would be ~60ms
      // Allow 150ms buffer for system overhead
      expect(result.data.loadTime).toBeLessThan(150);
    });

    test('should cache expensive calculations', async () => {
      let cachedStats = null;

      async function loadWithCaching(request) {
        const usersCollection = mockDB.collection('users');

        if (cachedStats) {
          return {
            data: { stats: cachedStats, cached: true },
            state: {}
          };
        }

        const users = await usersCollection.find({ isActive: true });

        const stats = {
          total: users.length,
          byRole: users.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
          }, {})
        };

        cachedStats = stats;

        return {
          data: { stats, cached: false },
          state: {}
        };
      }

      // First call - not cached
      const firstResult = await loadWithCaching(mockRequest);
      expect(firstResult.data.cached).toBe(false);

      // Second call - should be cached
      const secondResult = await loadWithCaching(mockRequest);
      expect(secondResult.data.cached).toBe(true);
    });
  });
});
