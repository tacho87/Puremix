// REST API endpoint for users collection
// Test: GET /api/users, POST /api/users

export default async function handler(request, response) {
  console.log(`🔗 API Request: ${request.method} /api/users`);
  console.log('   Headers:', Object.keys(request.headers));
  console.log('   Query:', request.query);
  
  const method = request.method.toLowerCase();
  
  try {
    switch (method) {
      case 'get':
        return await handleGetUsers(request, response);
      case 'post':
        return await handleCreateUser(request, response);
      default:
        return response.status(405).json({
          error: 'Method not allowed',
          allowed: ['GET', 'POST'],
          received: request.method
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleGetUsers(request, response) {
  // Simulate database query with filtering and pagination
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 10;
  const search = request.query.search || '';
  const sortBy = request.query.sortBy || 'id';
  const sortOrder = request.query.sortOrder || 'asc';
  
  // Mock user data
  let users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', active: true, created: '2024-01-15' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', active: true, created: '2024-02-10' },
    { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'user', active: false, created: '2024-02-20' },
    { id: 4, name: 'David Wilson', email: 'david@example.com', role: 'moderator', active: true, created: '2024-03-01' },
    { id: 5, name: 'Eve Brown', email: 'eve@example.com', role: 'user', active: true, created: '2024-03-15' }
  ];
  
  // Apply search filter
  if (search) {
    users = users.filter(user => 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Apply sorting
  users.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = users.slice(startIndex, endIndex);
  
  const totalUsers = users.length;
  const totalPages = Math.ceil(totalUsers / limit);
  
  return response.status(200).json({
    success: true,
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total: totalUsers,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    filters: {
      search,
      sortBy,
      sortOrder
    },
    meta: {
      timestamp: new Date().toISOString(),
      processingTime: '2.3ms',
      endpoint: 'GET /api/users'
    }
  });
}

async function handleCreateUser(request, response) {
  const userData = request.body;
  
  // Validation
  const errors = [];
  if (!userData.name) errors.push('Name is required');
  if (!userData.email) errors.push('Email is required');
  if (userData.email && !userData.email.includes('@')) errors.push('Email must be valid');
  
  if (errors.length > 0) {
    return response.status(400).json({
      success: false,
      error: 'Validation failed',
      errors,
      received: userData
    });
  }
  
  // Simulate user creation
  const newUser = {
    id: Math.floor(Math.random() * 10000),
    name: userData.name,
    email: userData.email,
    role: userData.role || 'user',
    active: userData.active !== undefined ? userData.active : true,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  
  return response.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser,
    meta: {
      timestamp: new Date().toISOString(),
      endpoint: 'POST /api/users'
    }
  });
}