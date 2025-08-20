# 🚀 Deployment Guide for D4Media Image Generator

This guide covers deploying your Next.js AI image generator to various hosting platforms.

## 📋 Prerequisites

1. **Replicate API Token**: Get your token from [Replicate](https://replicate.com/account/api-tokens)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Set up your environment variables

## 🌟 Option 1: Vercel (Recommended)

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/D4dx-backend/d4media_image_genrator.git)

### Manual Deployment
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add REPLICATE_API_TOKEN production
   # Enter your Replicate API token when prompted
   ```

### Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `https://github.com/D4dx-backend/d4media_image_genrator.git`
4. Add environment variable:
   - Key: `REPLICATE_API_TOKEN`
   - Value: `your_replicate_api_token_here`
   - Environment: Production (and Preview if needed)
5. Deploy!

## 🔷 Option 2: Netlify

### Quick Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/D4dx-backend/d4media_image_genrator.git)

### Manual Deployment
1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Build and Deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=.next
   ```

4. **Set Environment Variables**:
   ```bash
   netlify env:set REPLICATE_API_TOKEN your_token_here
   ```

## 🚂 Option 3: Railway

### Quick Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?template=https://github.com/D4dx-backend/d4media_image_genrator.git)

### Manual Deployment
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add environment variables:
   - `REPLICATE_API_TOKEN`: Your Replicate API token
6. Deploy!

## 🐳 Option 4: Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Commands
```bash
# Build the image
docker build -t d4media-image-generator .

# Run the container
docker run -p 3000:3000 -e REPLICATE_API_TOKEN=your_token_here d4media-image-generator
```

## ☁️ Option 5: AWS/Google Cloud/Azure

### AWS Amplify
1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Set build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
4. Add environment variables in Amplify console

## 🔧 Environment Variables

Make sure to set these environment variables in your hosting platform:

```env
REPLICATE_API_TOKEN=your_replicate_api_token_here
NODE_ENV=production
```

## 🛡️ Security Considerations

1. **Never commit your API tokens** to the repository
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** on your hosting platform
4. **Set up proper CORS** if needed
5. **Monitor API usage** to prevent abuse

## 📊 Performance Optimization

1. **Enable caching** for static assets
2. **Use CDN** for better global performance
3. **Monitor API response times**
4. **Set up error tracking** (Sentry, LogRocket, etc.)

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version (use 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **API Errors**:
   - Verify Replicate API token is set correctly
   - Check API rate limits
   - Monitor server logs

3. **Performance Issues**:
   - Optimize image sizes
   - Enable compression
   - Use proper caching headers

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test locally first
4. Check the hosting platform's documentation

## 🎉 Success!

Once deployed, your AI image generator will be available at your hosting platform's provided URL. Users can upload images and edit them using AI-powered prompts!