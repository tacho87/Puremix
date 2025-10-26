/**
 * MongoDB Mock for Testing Async Loaders
 * Simulates realistic database operations with configurable delays
 */

class MockCollection {
  constructor(name, data = []) {
    this.name = name;
    this.data = [...data];
  }

  async find(query = {}, delay = 100) {
    await this._simulateDelay(delay);

    if (Object.keys(query).length === 0) {
      return this.data;
    }

    return this.data.filter(doc => {
      return Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });
    });
  }

  async findOne(query = {}, delay = 100) {
    await this._simulateDelay(delay);

    const results = await this.find(query, 0);
    return results[0] || null;
  }

  async findById(id, delay = 100) {
    await this._simulateDelay(delay);

    return this.data.find(doc =>
      doc._id === id || doc.id === id
    ) || null;
  }

  async insertOne(document, delay = 150) {
    await this._simulateDelay(delay);

    const newDoc = {
      _id: this._generateId(),
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data.push(newDoc);
    return { insertedId: newDoc._id, acknowledged: true };
  }

  async insertMany(documents, delay = 200) {
    await this._simulateDelay(delay);

    const newDocs = documents.map(doc => ({
      _id: this._generateId(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    this.data.push(...newDocs);
    return {
      insertedIds: newDocs.map(d => d._id),
      insertedCount: newDocs.length,
      acknowledged: true
    };
  }

  async updateOne(query, update, delay = 150) {
    await this._simulateDelay(delay);

    const doc = await this.findOne(query, 0);
    if (!doc) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const updateData = update.$set || update;
    Object.assign(doc, updateData, { updatedAt: new Date() });

    return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
  }

  async updateMany(query, update, delay = 200) {
    await this._simulateDelay(delay);

    const docs = await this.find(query, 0);
    const updateData = update.$set || update;

    docs.forEach(doc => {
      Object.assign(doc, updateData, { updatedAt: new Date() });
    });

    return {
      matchedCount: docs.length,
      modifiedCount: docs.length,
      acknowledged: true
    };
  }

  async deleteOne(query, delay = 150) {
    await this._simulateDelay(delay);

    const index = this.data.findIndex(doc => {
      return Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });
    });

    if (index === -1) {
      return { deletedCount: 0 };
    }

    this.data.splice(index, 1);
    return { deletedCount: 1, acknowledged: true };
  }

  async deleteMany(query, delay = 200) {
    await this._simulateDelay(delay);

    const initialLength = this.data.length;

    this.data = this.data.filter(doc => {
      return !Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });
    });

    const deletedCount = initialLength - this.data.length;
    return { deletedCount, acknowledged: true };
  }

  async countDocuments(query = {}, delay = 50) {
    await this._simulateDelay(delay);

    const results = await this.find(query, 0);
    return results.length;
  }

  async aggregate(pipeline, delay = 200) {
    await this._simulateDelay(delay);

    // Simple aggregate simulation supporting common stages
    let results = [...this.data];

    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(doc => {
          return Object.entries(stage.$match).every(([key, value]) => {
            return doc[key] === value;
          });
        });
      }

      if (stage.$sort) {
        const sortKey = Object.keys(stage.$sort)[0];
        const sortOrder = stage.$sort[sortKey];
        results.sort((a, b) => {
          return sortOrder === 1
            ? (a[sortKey] > b[sortKey] ? 1 : -1)
            : (a[sortKey] < b[sortKey] ? 1 : -1);
        });
      }

      if (stage.$limit) {
        results = results.slice(0, stage.$limit);
      }

      if (stage.$skip) {
        results = results.slice(stage.$skip);
      }
    }

    return results;
  }

  // Helper methods
  _simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _generateId() {
    return Math.random().toString(36).substring(2, 11);
  }

  // Test utilities
  clear() {
    this.data = [];
  }

  seed(data) {
    this.data = [...data];
  }

  getAll() {
    return [...this.data];
  }
}

class MockDatabase {
  constructor(name = 'test-db') {
    this.name = name;
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name);
  }

  async dropCollection(name, delay = 100) {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.collections.delete(name);
    return { ok: 1 };
  }

  async dropDatabase(delay = 200) {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.collections.clear();
    return { ok: 1 };
  }

  listCollections() {
    return Array.from(this.collections.keys()).map(name => ({ name }));
  }
}

class MockMongoClient {
  constructor(uri = 'mongodb://localhost:27017', options = {}) {
    this.uri = uri;
    this.options = options;
    this.databases = new Map();
    this.connected = false;
  }

  async connect(delay = 300) {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.connected = true;
    return this;
  }

  async close(delay = 100) {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.connected = false;
  }

  db(name = 'test') {
    if (!this.databases.has(name)) {
      this.databases.set(name, new MockDatabase(name));
    }
    return this.databases.get(name);
  }

  isConnected() {
    return this.connected;
  }
}

// Factory function for creating mock MongoDB instances
export function createMockMongoDB(options = {}) {
  const {
    connectionDelay = 300,
    queryDelay = 100,
    insertDelay = 150,
    updateDelay = 150,
    deleteDelay = 150
  } = options;

  return {
    client: new MockMongoClient(),
    delays: {
      connection: connectionDelay,
      query: queryDelay,
      insert: insertDelay,
      update: updateDelay,
      delete: deleteDelay
    }
  };
}

// Sample test data generators
export const testData = {
  users: [
    { _id: 'user1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', isActive: true },
    { _id: 'user2', name: 'Bob Smith', email: 'bob@example.com', role: 'user', isActive: true },
    { _id: 'user3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', isActive: false },
    { _id: 'user4', name: 'Diana Prince', email: 'diana@example.com', role: 'moderator', isActive: true },
    { _id: 'user5', name: 'Eve Adams', email: 'eve@example.com', role: 'user', isActive: true }
  ],

  posts: [
    { _id: 'post1', title: 'First Post', content: 'Hello World', authorId: 'user1', likes: 42 },
    { _id: 'post2', title: 'Second Post', content: 'Another post', authorId: 'user2', likes: 18 },
    { _id: 'post3', title: 'Third Post', content: 'More content', authorId: 'user1', likes: 31 }
  ],

  products: [
    { _id: 'prod1', name: 'Laptop', price: 999.99, category: 'electronics', inStock: true },
    { _id: 'prod2', name: 'Mouse', price: 29.99, category: 'electronics', inStock: true },
    { _id: 'prod3', name: 'Desk', price: 299.99, category: 'furniture', inStock: false },
    { _id: 'prod4', name: 'Chair', price: 199.99, category: 'furniture', inStock: true }
  ]
};

export { MockMongoClient, MockDatabase, MockCollection };
