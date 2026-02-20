import { validateBoard } from '../board-validator.js';
export async function kanbanValidate(boardDir) {
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
//# sourceMappingURL=validate.js.map