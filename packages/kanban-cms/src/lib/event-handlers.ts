import type { DashboardEvent } from './websocket-client.js';

export interface DashboardState {
  pipeline: Record<string, number>;
  agents: AgentInfo[];
  blocked: BlockedCard[];
  completions: CompletionEntry[];
}

export interface AgentInfo {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'stopped';
  currentCard?: string;
  startedAt: string;
}

export interface BlockedCard {
  cardId: string;
  title: string;
  column: string;
  blockerQuestion: string;
  blockedSince: string;
}

export interface CompletionEntry {
  cardId: string;
  title: string;
  completedAt: string;
  completedBy: string;
}

export function createDashboardState(): DashboardState {
  return { pipeline: {}, agents: [], blocked: [], completions: [] };
}

export function handleDashboardEvent(state: DashboardState, event: DashboardEvent): DashboardState {
  switch (event.type) {
    case 'initial_state': {
      const payload = event.payload as DashboardState;
      return { ...payload };
    }
    case 'card_moved': {
      const { fromColumn, toColumn } = event.payload as { fromColumn: string; toColumn: string };
      const pipeline = { ...state.pipeline };
      if (pipeline[fromColumn]) pipeline[fromColumn]--;
      pipeline[toColumn] = (pipeline[toColumn] || 0) + 1;
      return { ...state, pipeline };
    }
    case 'card_created': {
      const { column } = event.payload as { column: string };
      const pipeline = { ...state.pipeline };
      pipeline[column] = (pipeline[column] || 0) + 1;
      return { ...state, pipeline };
    }
    case 'card_blocked': {
      const blocked = event.payload as BlockedCard;
      return { ...state, blocked: [...state.blocked, blocked] };
    }
    case 'card_unblocked': {
      const { cardId } = event.payload as { cardId: string };
      return { ...state, blocked: state.blocked.filter(b => b.cardId !== cardId) };
    }
    case 'agent_started': {
      const agent = event.payload as AgentInfo;
      return { ...state, agents: [...state.agents.filter(a => a.id !== agent.id), agent] };
    }
    case 'agent_stopped': {
      const { id } = event.payload as { id: string };
      return { ...state, agents: state.agents.map(a => a.id === id ? { ...a, status: 'stopped' as const } : a) };
    }
    default:
      return state;
  }
}
