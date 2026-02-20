import yaml from 'js-yaml';
import type { Board } from '../models/board.js';
import { BoardValidationError } from '../errors.js';

export function parseBoardYaml(content: string): Board {
  let raw: unknown;
  try {
    raw = yaml.load(content);
  } catch (err) {
    throw new BoardValidationError(
      `Invalid YAML: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!raw || typeof raw !== 'object') {
    throw new BoardValidationError('Board YAML must be an object');
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    throw new BoardValidationError('Board must have a non-empty "name" string');
  }

  if (obj.version !== 1) {
    throw new BoardValidationError('Board "version" must be 1');
  }

  if (!Array.isArray(obj.columns) || obj.columns.length === 0) {
    throw new BoardValidationError('Board must have at least one column');
  }

  if (!Array.isArray(obj.labels)) {
    throw new BoardValidationError('Board must have a "labels" array');
  }

  if (!obj.cardOrder || typeof obj.cardOrder !== 'object') {
    throw new BoardValidationError('Board must have a "cardOrder" object');
  }

  if (!obj.settings || typeof obj.settings !== 'object') {
    throw new BoardValidationError('Board must have a "settings" object');
  }

  return raw as Board;
}

export function serializeBoardYaml(board: Board): string {
  return yaml.dump(board, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}
