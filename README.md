# AI Image Generator

A modern, production-ready web application for generating AI images using Replicate's API. Upload reference images, write prompts, and create stunning visuals with various AI models.

## Features

- **Image Upload**: Drag-and-drop interface for reference images
- **Model Selection**: Choose from popular AI models or use custom ones
- **Prompt Engineering**: Advanced prompt input with suggestions
- **Generation History**: Keep track of all your creations
- **Responsive Design**: Works perfectly on all devices
- **Real-time Generation**: Live progress tracking

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.local` and add your Replicate API token
   - Get your token from: https://replicate.com/account/api-tokens
   ```
   REPLICATE_API_TOKEN=your_token_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## Usage

1. **Upload a Reference Image** (optional)
   - Drag and drop or click to select
   - Supports PNG, JPG, JPEG up to 10MB

2. **Select an AI Model**
   - Choose from popular pre-configured models
   - Or enter a custom Replicate model ID

3. **Write Your Prompt**
   - Be descriptive and specific
   - Use the suggestion buttons for inspiration

4. **Generate Images**
   - Click "Generate Images" to create
   - Download results or reuse from history

## Supported Models

- **Stable Diffusion**: General purpose image generation
- **SDXL**: High resolution, better quality results
- **Playground v2**: Aesthetic-focused generation
- **Custom Models**: Any public Replicate model

## Technologies

- **Frontend**: Next.js 13, React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes
- **AI**: Replicate API integration
- **Icons**: Lucide React

## API Reference

### POST /api/generate

Generate images using AI models.

**Body (FormData):**
- `prompt` (string, required): Description of desired image
- `model` (string, required): Replicate model ID
- `image` (File, optional): Reference image

**Response:**
```json
{
  "images": ["https://...", "https://..."]
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.