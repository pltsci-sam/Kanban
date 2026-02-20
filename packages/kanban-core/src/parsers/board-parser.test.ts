import { describe, it, expect } from 'vitest';
import { parseBoardYaml, serializeBoardYaml } from './board-parser.js';
import { BoardValidationError } from '../errors.js';

const VALID_BOARD_YAML = `
name: "Test Board"
version: 1
columns:
  - name: Backlog
  - name: Done
    done: true
labels:
  - name: bug
    color: "#e74c3c"
cardOrder:
  Backlog: []
  Done: []
settings:
  autoArchiveDays: 30
  defaultPriority: medium
  defaultColumn: Backlog
  idFormat: alphanumeric6
`;

describe('parseBoardYaml', () => {
  it('parses valid board YAML', () => {
    const board = parseBoardYaml(VALID_BOARD_YAML);
    expect(board.name).toBe('Test Board');
    expect(board.version).toBe(1);
    expect(board.columns).toHaveLength(2);
    expect(board.columns[1].done).toBe(true);
    expect(board.labels[0].name).toBe('bug');
    expect(board.settings.defaultColumn).toBe('Backlog');
  });

  it('throws on empty input', () => {
    expect(() => parseBoardYaml('')).toThrow(BoardValidationError);
  });

  it('throws on missing name', () => {
    expect(() =>
      parseBoardYaml('version: 1\ncolumns: []\nlabels: []\ncardOrder: {}\nsettings: {}')
    ).toThrow('non-empty "name"');
  });

  it('throws on wrong version', () => {
    expect(() =>
      parseBoardYaml('name: X\nversion: 2\ncolumns: [{name: A}]\nlabels: []\ncardOrder: {}\nsettings: {}')
    ).toThrow('version');
  });

  it('throws on missing columns', () => {
    expect(() =>
      parseBoardYaml('name: X\nversion: 1\nlabels: []\ncardOrder: {}\nsettings: {}')
    ).toThrow('column');
  });
});

describe('serializeBoardYaml', () => {
  it('round-trips a board', () => {
    const board = parseBoardYaml(VALID_BOARD_YAML);
    const serialized = serializeBoardYaml(board);
    const reparsed = parseBoardYaml(serialized);
    expect(reparsed.name).toBe(board.name);
    expect(reparsed.columns).toHaveLength(board.columns.length);
  });
});
