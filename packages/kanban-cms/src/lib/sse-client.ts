export interface ThinkingEvent {
  agentId: string;
  text: string;
  timestamp: string;
}

export type ThinkingHandler = (event: ThinkingEvent) => void;

export class SSEClient {
  private eventSource?: EventSource;
  private handlers: ThinkingHandler[] = [];

  constructor(private readonly baseUrl: string) {}

  connect(agentId: string): void {
    this.disconnect();

    const url = `${this.baseUrl}/agents/${agentId}/thinking`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ThinkingEvent;
        data.agentId = agentId;
        this.handlers.forEach(h => h(data));
      } catch {
        // ignore malformed events
      }
    };

    this.eventSource.onerror = () => {
      // EventSource auto-reconnects
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  onThinking(handler: ThinkingHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }
}
