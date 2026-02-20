import type { ValidationIssue } from '../board-validator.js';
export interface ValidateResult {
    issues: ValidationIssue[];
    errorCount: number;
    warningCount: number;
    passed: boolean;
}
export declare function kanbanValidate(boardDir: string): Promise<ValidateResult>;
//# sourceMappingURL=validate.d.ts.map