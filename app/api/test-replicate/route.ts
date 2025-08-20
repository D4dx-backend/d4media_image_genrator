import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function GET() {
  try {
    // Check if API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    if (process.env.REPLICATE_API_TOKEN === 'your_replicate_api_token_here') {
      return NextResponse.json(
        { error: 'Please set your actual Replicate API token in .env.local' },
        { status: 500 }
      );
    }

    // Initialize Replicate
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Test API connection with a simple model list
    try {
      // This is a lightweight test - just check if we can authenticate
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status} ${response.statusText}`);
      }

      return NextResponse.json({
        status: 'success',
        message: 'Replicate API connection successful',
        tokenLength: process.env.REPLICATE_API_TOKEN.length,
        tokenPrefix: process.env.REPLICATE_API_TOKEN.substring(0, 8) + '...'
      });

    } catch (apiError) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Replicate API',
        error: apiError instanceof Error ? apiError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Server configuration error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}