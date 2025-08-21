import { NextRequest, NextResponse } from 'next/server';

// Authentication helper (same as your main route)
function authenticate(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  // Extract and decode credentials
  const base64Credentials = authHeader.slice('Basic '.length);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // Check against environment variables
  const expectedUsername = process.env.USER_NAME;
  const expectedPassword = process.env.PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    console.error('USER_NAME or PASSWORD environment variables not set');
    return false;
  }

  return username === expectedUsername && password === expectedPassword;
}

export async function GET(request: NextRequest) {
  // Check authentication
  if (!authenticate(request)) {
    return NextResponse.json(
      { 
        error: 'Authentication required',
        message: 'Please provide valid username and password'
      }, 
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="API Test Access"'
        }
      }
    );
  }

  // If authentication passes, return success
  return NextResponse.json({
    success: true,
    message: 'Authentication successful! 🎉',
    timestamp: new Date().toISOString(),
    user: process.env.USER_NAME // Safe to show since they're authenticated
  });
}

export async function POST(request: NextRequest) {
  // Check authentication
  if (!authenticate(request)) {
    return NextResponse.json(
      { 
        error: 'Authentication required',
        message: 'Please provide valid username and password'
      }, 
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="API Test Access"'
        }
      }
    );
  }

  // Parse any JSON body if sent
  let body = {};
  try {
    body = await request.json();
  } catch {
    // No JSON body is fine for testing
  }

  return NextResponse.json({
    success: true,
    message: 'POST request authenticated successfully! 🎉',
    timestamp: new Date().toISOString(),
    user: process.env.USER_NAME,
    receivedData: body
  });
}