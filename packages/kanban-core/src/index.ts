// @kanban/core — shared library for kanban-dashboard
// Models, parsers, and utilities for the .kanban/ file format.

export * from './models/index.js';
export * from './parsers/index.js';
export { BoardValidationError, CardParseError } from './errors.js';
export {
  generateCardId,
  generateBlockerId,
  CardIdGenerationError,
} from './id-generator.js';
export { writeFileAtomic } from './atomic-writer.js';
export {
  readBoard,
  readCard,
  BoardNotFoundError,
} from './board-reader.js';
export type { BoardState, CardError } from './board-reader.js';
export {
  createCard,
  updateCard,
  moveCard,
  appendNote,
  deleteCard,
  archiveCard,
  CardNotFoundError,
  ColumnNotFoundError,
  CardExistsError,
} from './card-writer.js';
export type {
  CardCreateInput,
  CardUpdateInput,
  NoteInput,
} from './card-writer.js';
export { initializeBoard, BoardExistsError } from './board-initializer.js';
export {
  AdapterRegistry,
  RalphAdapter,
  SpecopsAdapter,
  SpecArtifactAdapter,
} from './adapters/index.js';
export type { KanbanAdapter, AdapterError, EnrichmentResult } from './adapters/index.js';
export { validateBoard } from './board-validator.js';
export type { ValidationIssue, ValidationSeverity } from './board-validator.js';
export * from './commands/index.js';
