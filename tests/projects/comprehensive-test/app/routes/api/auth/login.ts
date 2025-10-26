// TypeScript API endpoint for authentication
// Test: POST /api/auth/login

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  captcha?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  active: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: User;
  expiresIn?: number;
}

export default async function handler(request: any, response: any): Promise<void> {
  console.log('🔐 Auth API Request: POST /api/auth/login');
  console.log('   Headers:', Object.keys(request.headers));
  console.log('   User-Agent:', request.headers['user-agent']);
  console.log('   IP:', request.ip || 'unknown');
  
  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed: ['POST'],
      received: request.method
    });
  }
  
  try {
    const loginData: LoginRequest = request.body;
    
    // Validation
    const errors = validateLoginData(loginData);
    if (errors.length > 0) {
      return response.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }
    
    // Rate limiting simulation
    const rateLimitResult = checkRateLimit(request.ip || 'unknown');
    if (!rateLimitResult.allowed) {
      return response.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      });
    }
    
    // Authentication
    const authResult = await authenticateUser(loginData);
    
    if (!authResult.success) {
      // Log failed attempt
      console.log(`❌ Failed login attempt for ${loginData.email}`);
      
      return response.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: authResult.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate tokens
    const tokens = generateTokens(authResult.user!, loginData.rememberMe);
    
    // Log successful login
    console.log(`✅ Successful login for ${authResult.user!.email}`);
    
    // Set secure HTTP-only cookie for refresh token
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: loginData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 1 day
    });
    
    const loginResponse: LoginResponse = {
      success: true,
      message: 'Login successful',
      token: tokens.accessToken,
      user: {
        id: authResult.user!.id,
        email: authResult.user!.email,
        name: authResult.user!.name,
        role: authResult.user!.role,
        active: authResult.user!.active
      },
      expiresIn: tokens.expiresIn
    };
    
    return response.status(200).json(loginResponse);
    
  } catch (error) {
    console.error('Login API Error:', error);
    return response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during login',
      timestamp: new Date().toISOString()
    });
  }
}

function validateLoginData(data: LoginRequest): string[] {
  const errors: string[] = [];
  
  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Email format is invalid');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  // Simulate rate limiting (in real app, use Redis or in-memory store)
  // For demo, allow all requests but simulate occasional rate limit
  const shouldRateLimit = Math.random() < 0.1; // 10% chance of rate limit
  
  if (shouldRateLimit) {
    return {
      allowed: false,
      retryAfter: 60 // seconds
    };
  }
  
  return { allowed: true };
}

async function authenticateUser(loginData: LoginRequest): Promise<{ success: boolean; user?: User; message?: string }> {
  // Mock user database
  const users: User[] = [
    { id: 1, email: 'admin@example.com', name: 'Admin User', role: 'admin', active: true },
    { id: 2, email: 'user@example.com', name: 'Regular User', role: 'user', active: true },
    { id: 3, email: 'inactive@example.com', name: 'Inactive User', role: 'user', active: false }
  ];
  
  // Mock password validation (in real app, use bcrypt)
  const validCredentials: Record<string, string> = {
    'admin@example.com': 'admin123',
    'user@example.com': 'user123',
    'inactive@example.com': 'inactive123'
  };
  
  const user = users.find(u => u.email === loginData.email);
  
  if (!user) {
    return {
      success: false,
      message: 'User not found'
    };
  }
  
  if (!user.active) {
    return {
      success: false,
      message: 'Account is inactive. Please contact support.'
    };
  }
  
  const expectedPassword = validCredentials[user.email];
  if (loginData.password !== expectedPassword) {
    return {
      success: false,
      message: 'Invalid password'
    };
  }
  
  return {
    success: true,
    user
  };
}

function generateTokens(user: User, rememberMe: boolean = false): { accessToken: string; refreshToken: string; expiresIn: number } {
  // Mock JWT token generation (in real app, use proper JWT library)
  const timestamp = Date.now();
  const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day in seconds
  
  const accessToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(timestamp / 1000),
    exp: Math.floor(timestamp / 1000) + expiresIn
  }))}.mock_signature_${timestamp}`;
  
  const refreshToken = `refresh_${timestamp}_${user.id}_${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    accessToken,
    refreshToken,
    expiresIn
  };
}