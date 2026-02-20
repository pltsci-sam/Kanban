import { randomBytes } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CARD_ID_LENGTH = 6;
const BLOCKER_ID_LENGTH = 4;
const MAX_RETRIES = 5;

export class CardIdGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardIdGenerationError';
  }
}

function randomAlphanumeric(length: number): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return result;
}

async function listExistingIds(boardDir: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const subdir of ['cards', 'archive']) {
    const dir = join(boardDir, subdir);
    try {
      const files = await readdir(dir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          ids.add(file.slice(0, -3));
        }
      }
    } catch {
      // Directory may not exist yet
    }
  }
  return ids;
}

export async function generateCardId(boardDir: string): Promise<string> {
  const existing = await listExistingIds(boardDir);
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const id = randomAlphanumeric(CARD_ID_LENGTH);
    if (!existing.has(id)) {
      return id;
    }
  }
  throw new CardIdGenerationError(
    `Failed to generate unique card ID after ${MAX_RETRIES} attempts`
  );
}

export function generateBlockerId(): string {
  return `blk-${randomAlphanumeric(BLOCKER_ID_LENGTH)}`;
}
