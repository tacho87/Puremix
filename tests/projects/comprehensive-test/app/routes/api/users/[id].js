// REST API endpoint for individual user resource
// Test: GET /api/users/123, PUT /api/users/123, DELETE /api/users/123, PATCH /api/users/123

export default async function handler(request, response) {
  console.log(`🔗 API Request: ${request.method} /api/users/${request.params.id}`);
  console.log('   User ID:', request.params.id);
  console.log('   Headers:', Object.keys(request.headers));
  
  const method = request.method.toLowerCase();
  const userId = request.params.id;
  
  // Validate user ID
  if (!userId || isNaN(parseInt(userId))) {
    return response.status(400).json({
      error: 'Invalid user ID',
      received: userId,
      expected: 'numeric ID'
    });
  }
  
  try {
    switch (method) {
      case 'get':
        return await handleGetUser(request, response, userId);
      case 'put':
        return await handleUpdateUser(request, response, userId);
      case 'patch':
        return await handlePatchUser(request, response, userId);
      case 'delete':
        return await handleDeleteUser(request, response, userId);
      default:
        return response.status(405).json({
          error: 'Method not allowed',
          allowed: ['GET', 'PUT', 'PATCH', 'DELETE'],
          received: request.method
        });
    }
  } catch (error) {
    console.error(`API Error for user ${userId}:`, error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
      userId,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleGetUser(request, response, userId) {
  // Mock user data lookup
  const users = {
    '1': { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', active: true, created: '2024-01-15', lastLogin: '2024-09-04T02:30:00Z' },
    '2': { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', active: true, created: '2024-02-10', lastLogin: '2024-09-03T15:20:00Z' },
    '3': { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'user', active: false, created: '2024-02-20', lastLogin: '2024-08-15T09:10:00Z' }
  };
  
  const user = users[userId];
  
  if (!user) {
    return response.status(404).json({
      success: false,
      error: 'User not found',
      userId: userId,
      message: `User with ID ${userId} does not exist`
    });
  }
  
  // Add additional computed fields for GET requests
  const enrichedUser = {
    ...user,
    fullProfile: true,
    accountAge: calculateAccountAge(user.created),
    status: user.active ? 'active' : 'inactive',
    permissions: getUserPermissions(user.role)
  };
  
  return response.status(200).json({
    success: true,
    data: enrichedUser,
    meta: {
      timestamp: new Date().toISOString(),
      endpoint: `GET /api/users/${userId}`,
      enriched: true
    }
  });
}

async function handleUpdateUser(request, response, userId) {
  const updateData = request.body;
  
  // Simulate user lookup
  if (userId === '999') {
    return response.status(404).json({
      success: false,
      error: 'User not found',
      userId: userId
    });
  }
  
  // Validation for PUT (full update)
  const errors = [];
  if (!updateData.name) errors.push('Name is required for full update');
  if (!updateData.email) errors.push('Email is required for full update');
  if (updateData.email && !updateData.email.includes('@')) errors.push('Email must be valid');
  
  if (errors.length > 0) {
    return response.status(400).json({
      success: false,
      error: 'Validation failed for full update',
      errors,
      received: updateData
    });
  }
  
  // Simulate full user update
  const updatedUser = {
    id: parseInt(userId),
    name: updateData.name,
    email: updateData.email,
    role: updateData.role || 'user',
    active: updateData.active !== undefined ? updateData.active : true,
    created: '2024-01-15', // Keep original creation date
    updated: new Date().toISOString()
  };
  
  return response.status(200).json({
    success: true,
    message: 'User updated successfully (full update)',
    data: updatedUser,
    operation: 'PUT',
    meta: {
      timestamp: new Date().toISOString(),
      endpoint: `PUT /api/users/${userId}`
    }
  });
}

async function handlePatchUser(request, response, userId) {
  const patchData = request.body;
  
  // Simulate user lookup
  if (userId === '999') {
    return response.status(404).json({
      success: false,
      error: 'User not found',
      userId: userId
    });
  }
  
  // Validation for PATCH (partial update) - only validate provided fields
  const errors = [];
  if (patchData.email && !patchData.email.includes('@')) {
    errors.push('Email must be valid');
  }
  
  if (errors.length > 0) {
    return response.status(400).json({
      success: false,
      error: 'Validation failed for partial update',
      errors,
      received: patchData
    });
  }
  
  // Simulate partial user update (only update provided fields)
  const existingUser = {
    id: parseInt(userId),
    name: 'Existing User',
    email: 'existing@example.com',
    role: 'user',
    active: true,
    created: '2024-01-15'
  };
  
  const updatedUser = {
    ...existingUser,
    ...patchData, // Only override provided fields
    id: parseInt(userId), // Ensure ID doesn't change
    updated: new Date().toISOString()
  };
  
  return response.status(200).json({
    success: true,
    message: 'User updated successfully (partial update)',
    data: updatedUser,
    operation: 'PATCH',
    changes: Object.keys(patchData),
    meta: {
      timestamp: new Date().toISOString(),
      endpoint: `PATCH /api/users/${userId}`
    }
  });
}

async function handleDeleteUser(request, response, userId) {
  // Simulate user lookup
  if (userId === '999') {
    return response.status(404).json({
      success: false,
      error: 'User not found',
      userId: userId
    });
  }
  
  // Check for protected users (admin protection)
  if (userId === '1') {
    return response.status(403).json({
      success: false,
      error: 'Cannot delete admin user',
      userId: userId,
      message: 'Admin users cannot be deleted for security reasons'
    });
  }
  
  // Simulate soft delete
  const deletedUser = {
    id: parseInt(userId),
    name: '[DELETED]',
    email: '[DELETED]',
    deleted: true,
    deletedAt: new Date().toISOString()
  };
  
  return response.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: deletedUser,
    operation: 'DELETE',
    meta: {
      timestamp: new Date().toISOString(),
      endpoint: `DELETE /api/users/${userId}`,
      softDelete: true
    }
  });
}

// Helper functions
function calculateAccountAge(createdDate) {
  const created = new Date(createdDate);
  const now = new Date();
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}

function getUserPermissions(role) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage'],
    moderator: ['read', 'write', 'moderate'],
    user: ['read']
  };
  
  return permissions[role] || permissions.user;
}