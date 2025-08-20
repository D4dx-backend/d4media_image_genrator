import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function GET() {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Test with the exact example from documentation
    const input = {
      image: "https://replicate.delivery/pbxt/NYfZuQXicUlwvUfeNmX2IgEfCz7vzuVrXitm9pgXVm1RBIJO/image.png",
      prompt: "Change the sweater to be blue with white text",
      go_fast: true,
      output_format: "webp",
      enhance_prompt: false,
      output_quality: 80
    };

    console.log('Testing qwen/qwen-image-edit with:', input);

    const output = await replicate.run("qwen/qwen-image-edit", { input });

    console.log('Raw output:', output);

    // Handle the output as shown in documentation
    let images: string[] = [];
    
    if (Array.isArray(output)) {
      images = output.map((item, index) => {
        console.log(`Item ${index}:`, typeof item, item);
        
        if (typeof item === 'string') {
          return item;
        } else if (item && typeof item === 'object' && 'url' in item) {
          // Handle file objects with url() method as shown in documentation
          return typeof item.url === 'function' ? item.url() : item.url;
        }
        
        console.log(`Item ${index} could not be processed`);
        return null;
      }).filter((item): item is string => item !== null);
    }

    return NextResponse.json({
      success: true,
      output,
      images,
      message: 'qwen/qwen-image-edit test successful'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}