import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
      tokenLength: process.env.REPLICATE_API_TOKEN?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const formData = await request.formData().catch(() => null);
    
    return NextResponse.json({
      status: 'POST endpoint working',
      hasBody: !!body,
      hasFormData: !!formData,
      contentType: request.headers.get('content-type'),
      method: request.method,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'POST endpoint error'
    }, { status: 500 });
  }
}