export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface DashboardEvent {
  type: 'initial_state' | 'card_moved' | 'card_created' | 'card_blocked' | 'card_unblocked' | 'agent_started' | 'agent_stopped';
  payload: unknown;
  timestamp: string;
}

export type EventHandler = (event: DashboardEvent) => void;
export type StateHandler = (state: ConnectionState) => void;

export class WebSocketClient {
  private ws?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private eventHandlers: EventHandler[] = [];
  private stateHandlers: StateHandler[] = [];
  private state: ConnectionState = 'disconnected';
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  constructor(private readonly url: string) {}

  connect(): void {
    this.setState('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setState('connected');
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as DashboardEvent;
          this.eventHandlers.forEach(h => h(data));
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this.setState('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setState('error');
      };
    } catch {
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = undefined;
    }
    this.setState('disconnected');
  }

  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  onStateChange(handler: StateHandler): () => void {
    this.stateHandlers.push(handler);
    return () => {
      this.stateHandlers = this.stateHandlers.filter(h => h !== handler);
    };
  }

  getState(): ConnectionState {
    return this.state;
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.stateHandlers.forEach(h => h(state));
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, this.reconnectDelay);

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
