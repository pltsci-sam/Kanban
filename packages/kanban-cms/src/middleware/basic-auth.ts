import { timingSafeEqual } from 'node:crypto';

export interface AuthConfig {
  username: string;
  passwordHash: string;
}

export function getAuthConfig(): AuthConfig {
  const password = process.env.KANBAN_CMS_PASSWORD;
  if (!password) {
    throw new Error('KANBAN_CMS_PASSWORD environment variable is required');
  }

  return {
    username: process.env.KANBAN_CMS_USERNAME || 'ops',
    passwordHash: password,
  };
}

export function validateBasicAuth(authHeader: string | null, config: AuthConfig): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const encoded = authHeader.slice(6);
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const separatorIdx = decoded.indexOf(':');
  if (separatorIdx === -1) return false;

  const username = decoded.slice(0, separatorIdx);
  const password = decoded.slice(separatorIdx + 1);

  const usernameMatch = constantTimeCompare(username, config.username);
  const passwordMatch = constantTimeCompare(password, config.passwordHash);

  return usernameMatch && passwordMatch;
}

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    // Compare against self to maintain constant time
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
