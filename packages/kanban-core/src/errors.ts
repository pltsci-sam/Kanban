export class BoardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardValidationError';
  }
}

export class CardParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardParseError';
  }
}
