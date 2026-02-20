import type { ConnectionState } from '../lib/websocket-client.js';

export function renderConnectionStatus(state: ConnectionState, nextRetryIn?: number): string {
  switch (state) {
    case 'connecting':
      return `<div class="connection-banner connecting">
        <span class="spinner"></span> Connecting to AgentDispatch…
      </div>`;

    case 'connected':
      return '';

    case 'disconnected': {
      const retry = nextRetryIn != null
        ? `<span class="retry-timer">Retrying in ${nextRetryIn}s</span>`
        : '';
      return `<div class="connection-banner offline">
        <span class="offline-icon">⚠</span> AgentDispatch offline ${retry}
      </div>`;
    }

    case 'error': {
      const retry = nextRetryIn != null
        ? `<span class="retry-timer">Retrying in ${nextRetryIn}s</span>`
        : '';
      return `<div class="connection-banner error">
        <span class="error-icon">✕</span> Connection error ${retry}
      </div>`;
    }

    default:
      return '';
  }
}

export function connectionStatusStyles(): string {
  return `
    .connection-banner {
      padding: 8px 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
    }
    .connection-banner.connecting {
      background: #3498db;
      color: #fff;
    }
    .connection-banner.offline {
      background: #e67e22;
      color: #fff;
    }
    .connection-banner.error {
      background: #e74c3c;
      color: #fff;
    }
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .retry-timer {
      margin-left: 8px;
      opacity: 0.85;
      font-size: 12px;
    }
  `;
}
