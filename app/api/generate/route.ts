import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configuration constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PROMPT_LENGTH = 1000;
const RATE_LIMIT_REQUESTS = 10; // per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Rate‐limiting helper
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_REQUESTS) return false;
  entry.count++;
  return true;
}

// Prompt validation
function validatePrompt(prompt: string): string | null {
  if (!prompt.trim()) return 'Prompt is required';
  if (prompt.length > MAX_PROMPT_LENGTH) return `Prompt must be under ${MAX_PROMPT_LENGTH} characters`;
  const forbidden = [/\b(nude|nsfw)\b/i, /\b(violence|kill)\b/i, /\b(hate|racism)\b/i];
  if (forbidden.some(rx => rx.test(prompt))) return 'Prompt contains disallowed content';
  return null;
}

// File validation
function validateImageFile(file: File | null): string | null {
  if (!file) return 'Image file is required';
  if (file.size > MAX_FILE_SIZE) return `File must be under ${MAX_FILE_SIZE / 1024 / 1024} MB`;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `File type must be one of: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
  }
  return null;
}

// Convert to base64 data URL
async function fileToDataURL(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

// Poll prediction until completion
async function waitForPrediction(replicate: Replicate, id: string) {
  while (true) {
    const pred = await replicate.predictions.get(id);
    if (pred.status === 'succeeded') return pred.output as string[];
    if (pred.status === 'failed') throw new Error(`Prediction failed: ${pred.error}`);
    await new Promise(r => setTimeout(r, 1000));
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 });
  }

  // In your API routes, change this:
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// To this:
const replicate = new Replicate({ 
  auth: process.env.REPLICATE_API_TOKEN,
  useFileOutput: false  // This forces URLs instead of file objects
});
  const clientId = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Parse form data
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const prompt = (form.get('prompt') as string || '').trim();
  const imageFile = form.get('image') as File | null;
  const model = (form.get('model') as string) || 'qwen/qwen-image-edit';

  // Validate
  const promptErr = validatePrompt(prompt);
  if (promptErr) return NextResponse.json({ error: promptErr }, { status: 400 });
  const fileErr = validateImageFile(imageFile);
  if (fileErr) return NextResponse.json({ error: fileErr }, { status: 400 });

  // Convert image
  const image = await fileToDataURL(imageFile!);

  // Create prediction
  let prediction;
  try {
    prediction = await replicate.predictions.create({
      model,
      input: {
        prompt,
        image,
        go_fast: true,
        output_format: 'webp',
        output_quality: 80,
        aspect_ratio: 'match_input_image'
      }
    });
  } catch (err) {
    console.error('Create error', err);
    return NextResponse.json({ error: 'Failed to start prediction' }, { status: 500 });
  }

  // Wait for it to finish
  let output: string[];
  try {
    output = await waitForPrediction(replicate, prediction.id);
  } catch (err: any) {
    console.error('Prediction error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Respond with URLs
  return NextResponse.json({
    success: true,
    model,
    prompt,
    images: output
  });
}

// Reject other methods
export async function GET()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
