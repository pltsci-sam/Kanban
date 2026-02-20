import { readBoard } from './board-reader.js';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
}

const CARD_ID_RE = /^[a-z0-9]{6}$/;
const SPEC_REF_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PATH_TRAVERSAL_RE = /\.\./;

export async function validateBoard(
  boardDir: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const { board, cards, errors } = await readBoard(boardDir);

  // Report parse errors
  for (const err of errors) {
    issues.push({
      severity: 'error',
      code: 'CARD_PARSE_ERROR',
      message: `Failed to parse card ${err.cardId}: ${err.message}`,
      path: err.path,
    });
  }

  // Collect all card IDs from files
  const cardFileIds = new Set(cards.map((c) => c.id));

  // Collect all card IDs referenced in cardOrder
  const orderedIds = new Set<string>();
  for (const [col, ids] of Object.entries(board.cardOrder)) {
    // Validate column exists
    if (!board.columns.some((c) => c.name === col)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_COLUMN_IN_ORDER',
        message: `cardOrder references unknown column: "${col}"`,
      });
    }

    for (const id of ids) {
      if (!CARD_ID_RE.test(id)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_CARD_ID_FORMAT',
          message: `cardOrder contains invalid card ID: "${id}"`,
        });
      }

      if (orderedIds.has(id)) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_CARD_IN_ORDER',
          message: `Card "${id}" appears in cardOrder more than once`,
        });
      }
      orderedIds.add(id);

      // Ghost reference: in cardOrder but no file
      if (!cardFileIds.has(id)) {
        issues.push({
          severity: 'error',
          code: 'GHOST_CARD_REFERENCE',
          message: `cardOrder references card "${id}" but no file exists`,
        });
      }
    }
  }

  // Orphan detection: card file exists but not in any cardOrder
  for (const card of cards) {
    if (!orderedIds.has(card.id)) {
      issues.push({
        severity: 'warning',
        code: 'ORPHAN_CARD',
        message: `Card "${card.id}" exists as a file but is not in any column's cardOrder`,
      });
    }

    // Validate card.column matches where it appears in cardOrder
    const expectedCol = Object.entries(board.cardOrder).find(([, ids]) =>
      ids.includes(card.id)
    );
    if (expectedCol && expectedCol[0] !== card.column) {
      issues.push({
        severity: 'warning',
        code: 'COLUMN_MISMATCH',
        message: `Card "${card.id}" has column="${card.column}" but is in cardOrder under "${expectedCol[0]}"`,
      });
    }

    // SEC-B-003: Path traversal in specRef/ralphFeature
    if (card.specRef) {
      if (PATH_TRAVERSAL_RE.test(card.specRef)) {
        issues.push({
          severity: 'error',
          code: 'PATH_TRAVERSAL_SPECREF',
          message: `Card "${card.id}" specRef contains path traversal: "${card.specRef}"`,
        });
      } else if (!SPEC_REF_RE.test(card.specRef)) {
        issues.push({
          severity: 'warning',
          code: 'INVALID_SPECREF_FORMAT',
          message: `Card "${card.id}" specRef does not match expected kebab-case: "${card.specRef}"`,
        });
      }
    }

    if (card.ralphFeature) {
      if (PATH_TRAVERSAL_RE.test(card.ralphFeature)) {
        issues.push({
          severity: 'error',
          code: 'PATH_TRAVERSAL_RALPH',
          message: `Card "${card.id}" ralphFeature contains path traversal: "${card.ralphFeature}"`,
        });
      }
    }

    // Validate labels exist in board palette
    for (const label of card.labels) {
      if (!board.labels.some((l) => l.name === label)) {
        issues.push({
          severity: 'warning',
          code: 'UNKNOWN_LABEL',
          message: `Card "${card.id}" uses label "${label}" not in board palette`,
        });
      }
    }
  }

  return issues;
}
