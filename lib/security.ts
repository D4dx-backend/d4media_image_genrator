// Security utilities and constants

export const SECURITY_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_PROMPT_LENGTH: 1000,
  RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || '10'),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
} as const;

export const CONTENT_FILTERS = [
  /\b(nude|naked|nsfw|explicit|sexual)\b/i,
  /\b(violence|violent|kill|murder|death)\b/i,
  /\b(hate|racist|discrimination)\b/i,
  /\b(illegal|drugs|weapons)\b/i,
] as const;

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, SECURITY_CONFIG.MAX_PROMPT_LENGTH);
}

export function validateImageType(mimeType: string): boolean {
  return SECURITY_CONFIG.ALLOWED_IMAGE_TYPES.includes(mimeType as any);
}

export function checkContentPolicy(text: string): string | null {
  for (const pattern of CONTENT_FILTERS) {
    if (pattern.test(text)) {
      return 'Content violates usage policy';
    }
  }
  return null;
}