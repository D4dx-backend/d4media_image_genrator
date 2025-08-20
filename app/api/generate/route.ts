import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PROMPT_LENGTH = 1000;
const RATE_LIMIT_REQUESTS = 10; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Initialize Replicate with error handling
let replicate: Replicate;
try {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set');
  }
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
} catch (error) {
  console.error('Failed to initialize Replicate:', error);
}

// Rate limiting function
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  clientData.count++;
  return true;
}

// Input validation functions
function validatePrompt(prompt: string): string | null {
  if (!prompt || typeof prompt !== 'string') {
    return 'Prompt is required and must be a string';
  }
  
  if (prompt.trim().length === 0) {
    return 'Prompt cannot be empty';
  }
  
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return `Prompt must be less than ${MAX_PROMPT_LENGTH} characters`;
  }
  
  // Basic content filtering (extend as needed)
  const forbiddenPatterns = [
    /\b(nude|naked|nsfw|explicit|sexual)\b/i,
    /\b(violence|violent|kill|murder|death)\b/i,
    /\b(hate|racist|discrimination)\b/i
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(prompt)) {
      return 'Prompt contains inappropriate content';
    }
  }
  
  return null;
}

function validateImageFile(file: File): string | null {
  if (!file) {
    return 'Image file is required';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `File type must be one of: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Replicate is initialized
    if (!replicate) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Rate limiting
    const clientId = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse form data with size limit
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid form data or file too large' },
        { status: 400 }
      );
    }

    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;
    const model = 'qwen/qwen-image-edit'; // Qwen image editing model

    // Validate inputs
    const promptError = validatePrompt(prompt);
    if (promptError) {
      return NextResponse.json(
        { error: promptError },
        { status: 400 }
      );
    }

    const imageError = validateImageFile(imageFile!);
    if (imageError) {
      return NextResponse.json(
        { error: imageError },
        { status: 400 }
      );
    }

    // Convert image to base64 with error handling
    let imageData: string;
    try {
      const bytes = await imageFile!.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageData = `data:${imageFile!.type};base64,${buffer.toString('base64')}`;
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to process image file' },
        { status: 400 }
      );
    }

    const input = {
      image: imageData,
      prompt: prompt.trim(),
      go_fast: true,
      aspect_ratio: "match_input_image",
      output_format: "webp",
      output_quality: 80,
      disable_safety_checker: false
    };

    // Log for monitoring (remove sensitive data)
    console.log('Generation request:', {
      model,
      promptLength: prompt.length,
      imageType: imageFile!.type,
      imageSize: imageFile!.size,
      clientId: clientId.substring(0, 8) + '...' // Partial IP for privacy
    });

    // Log the actual input being sent (without the full image data for brevity)
    console.log('Calling Replicate with:', {
      model,
      input: {
        ...input,
        image: `[${imageFile!.type} image, ${Math.round(imageFile!.size / 1024)}KB]`
      }
    });

    // Call Replicate API with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 60000) // Increased to 60s
    );

    const output = await Promise.race([
      replicate.run(model, { input }),
      timeoutPromise
    ]);

    // Validate output
    if (!output) {
      throw new Error('No output received from model');
    }

    console.log('Raw output from Replicate:', output);

    // Handle different output formats from Replicate
    let images: string[] = [];
    
    if (Array.isArray(output)) {
      // If output is an array of URLs or file objects
      images = output.map(item => {
        if (typeof item === 'string') {
          return item;
        } else if (item && typeof item === 'object' && 'url' in item) {
          return typeof item.url === 'function' ? item.url() : item.url;
        } else if (item && typeof item === 'object' && item.toString) {
          return item.toString();
        }
        return null;
      }).filter(Boolean) as string[];
    } else if (typeof output === 'string') {
      // If output is a single URL string
      images = [output];
    } else if (output && typeof output === 'object') {
      // If output is a single file object
      if ('url' in output) {
        const url = typeof output.url === 'function' ? output.url() : output.url;
        images = [url];
      } else if (output.toString) {
        images = [output.toString()];
      }
    }
    
    // Validate image URLs
    const validImages = images.filter(img => 
      typeof img === 'string' && 
      img.length > 0 &&
      (img.startsWith('https://') || img.startsWith('http://') || img.startsWith('data:'))
    );

    if (validImages.length === 0) {
      console.error('No valid images found in output:', output);
      throw new Error('No valid images generated');
    }

    console.log('Valid images found:', validImages.length);

    return NextResponse.json({
      images: validImages,
    });

  } catch (error) {
    console.error('Generation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      errorType: error?.constructor?.name,
      fullError: error
    });
    
    // More specific error messages for debugging
    let errorMessage = 'Failed to generate images. Please try again.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Include the actual error message in development for debugging
      if (process.env.NODE_ENV === 'development') {
        errorMessage = `Development error: ${error.message}`;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The image generation is taking longer than expected.';
        statusCode = 408;
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
        statusCode = 429;
      } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        errorMessage = 'API authentication failed. Please check configuration.';
        statusCode = 401;
      } else if (error.message.includes('invalid') || error.message.includes('bad request')) {
        errorMessage = 'Invalid request parameters. Please check your inputs.';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}