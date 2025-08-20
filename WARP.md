# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Test Replicate API connection
curl http://localhost:3000/api/test-replicate
```

### Testing & Debugging
```bash
# Test API endpoint locally
curl -X POST http://localhost:3000/api/generate \
  -F "prompt=make the sky more vibrant" \
  -F "image=@test-image.jpg"

# Check API logs in development
tail -f .next/trace

# Build and test production build locally
npm run build && npm start
```

## Architecture Overview

### Application Structure
- **Next.js 13 App Router**: Modern React framework with server and client components
- **AI Image Editing Focus**: Specifically designed for editing existing images (not generation from scratch)
- **Single Model Architecture**: Uses Replicate's `qwen/qwen-image-edit` model exclusively
- **Multi-prompt Processing**: Supports up to 10 editing prompts per session

### Key Components Architecture

**Main Page (`app/page.tsx`)**:
- Single-page application managing all state
- Validates inputs client-side before API calls
- Handles image upload, prompt management, and generation history
- Uses sequential API calls for multiple prompts (not parallel to avoid rate limits)

**Core UI Components**:
- `ImageUpload`: Drag-and-drop with preview and validation
- `PromptInput`: Dynamic prompt management (1-10 prompts)
- `ModelSelector`: Currently fixed to qwen model but structured for expansion
- `GeneratedImages`: Display and download results
- `GenerationHistory`: Previous sessions with replay functionality

### API Architecture

**Single Endpoint Pattern** (`/api/generate`):
- POST-only endpoint with comprehensive security validation
- Built-in rate limiting (10 requests per minute per IP)
- File size limits (10MB) and type validation (JPEG/PNG/WebP)
- Content filtering for inappropriate prompts
- Timeout handling (60 seconds)
- Detailed error responses with appropriate HTTP status codes

**Security Features**:
- Input sanitization and validation
- Rate limiting with in-memory store
- Content filtering patterns
- File type and size restrictions
- CORS and security headers configured in `next.config.js`

### Data Flow
1. User uploads reference image (required)
2. User adds 1-10 editing prompts
3. Client validates inputs before submission
4. Sequential API calls process each prompt
5. Results aggregated and displayed
6. Session saved to generation history for replay

### State Management
- Local React state only (no external state management)
- File handling with URL.createObjectURL for previews
- Generation history stored in component state (not persisted)
- Error states managed per operation

## Key Development Patterns

### Error Handling Strategy
- Client-side validation before API calls
- Comprehensive server-side validation with specific error messages
- Timeout handling for long-running operations
- User-friendly error messages in production vs detailed errors in development

### Security Implementation
- Never expose API tokens client-side
- Input validation at multiple layers
- Rate limiting to prevent abuse
- Content filtering for inappropriate prompts
- Secure headers configuration

### Performance Considerations
- Images processed sequentially to avoid rate limits
- Base64 encoding for API transmission
- Optimized image domains in Next.js config
- Abort controllers for request cancellation

## Environment Variables

Required:
- `REPLICATE_API_TOKEN`: Replicate API authentication token

Optional:
- `NODE_ENV`: Environment mode (development/production)
- Security config can be adjusted via constants in `/api/generate/route.ts`

## Development Notes

### AI Model Integration
- Currently hardcoded to use `qwen/qwen-image-edit` model
- Model expects base64-encoded images with specific parameters
- Output format handling supports multiple Replicate response types
- Results are temporary URLs that should be downloaded or processed immediately

### UI/UX Patterns
- Drag-and-drop image upload with visual feedback
- Progressive disclosure (upload → prompts → generate → results)
- Real-time validation feedback
- Loading states during generation
- Success/error state management

### Deployment Considerations
- Supports multiple deployment targets (Vercel, Netlify, Railway, Docker)
- Environment variable configuration varies by platform
- Rate limiting uses in-memory storage (consider Redis for production)
- Image processing requires sufficient server resources

### Testing Approach
- Use `/api/test-replicate` endpoint to verify API connectivity
- Test with various image formats and sizes
- Validate prompt content filtering
- Test rate limiting behavior
- Verify error handling paths

## Troubleshooting

### Common Issues
1. **API Token Issues**: Check `/api/test-replicate` endpoint first
2. **Image Upload Failures**: Verify file size (<10MB) and format (JPEG/PNG/WebP)
3. **Generation Timeouts**: 60-second limit may need adjustment for complex edits
4. **Rate Limiting**: 10 requests per minute per IP in development
5. **Build Errors**: Ensure Node.js 18+ and all dependencies installed

### Debug Commands
```bash
# Check environment variables
printenv | grep REPLICATE

# Test API directly
curl -X GET http://localhost:3000/api/test-replicate

# Monitor server logs
npm run dev 2>&1 | grep -E "(error|Error|ERROR)"
```
