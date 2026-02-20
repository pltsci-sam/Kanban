export class BoardValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BoardValidationError';
    }
}
export class CardParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CardParseError';
    }
}
//# sourceMappingURL=errors.js.map