import { readBoard } from '../board-reader.js';
import type { BoardState } from '../board-reader.js';
import type { Card } from '../models/card.js';

export interface HeartbeatBoardResult {
  repoPath: string;
  status: 'ok' | 'not-found' | 'error';
  unassignedBacklog: Card[];
  recentlyUnblocked: Card[];
  error?: string;
}

export async function readBoardForHeartbeat(repoPath: string): Promise<HeartbeatBoardResult> {
  let state: BoardState;

  try {
    state = await readBoard(repoPath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('not found') || message.includes('ENOENT')) {
      return { repoPath, status: 'not-found', unassignedBacklog: [], recentlyUnblocked: [] };
    }
    return { repoPath, status: 'error', unassignedBacklog: [], recentlyUnblocked: [], error: message };
  }

  const backlogCol = state.board.columns.find(c => c.name.toLowerCase() === 'backlog');
  const backlogIds = backlogCol ? (state.board.cardOrder[backlogCol.name] || []) : [];

  const cardsById = new Map(state.cards.map(c => [c.id, c]));

  const unassignedBacklog = backlogIds
    .map(id => cardsById.get(id))
    .filter((c): c is Card => c !== undefined && !c.assignee);

  const recentlyUnblocked = state.cards.filter(
    c => c.blockers && c.blockers.length === 0 && c.notes?.some(n => n.type === 'unblock'),
  );

  return {
    repoPath,
    status: 'ok',
    unassignedBacklog,
    recentlyUnblocked,
  };
}

export async function readAllBoardsForHeartbeat(repoPaths: string[]): Promise<HeartbeatBoardResult[]> {
  return Promise.all(repoPaths.map(readBoardForHeartbeat));
}
