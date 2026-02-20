import { validateBoard } from '../board-validator.js';
import type { ValidationIssue } from '../board-validator.js';

export interface ValidateResult {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  passed: boolean;
}

export async function kanbanValidate(
  boardDir: string
): Promise<ValidateResult> {
  const issues = await validateBoard(boardDir);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    issues,
    errorCount,
    warningCount,
    passed: errorCount === 0,
  };
}
