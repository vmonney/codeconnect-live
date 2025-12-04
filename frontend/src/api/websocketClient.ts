import { getToken } from './httpClient';
import { WebSocketMessage, WebSocketEventType } from './types';

// Determine WebSocket base URL based on environment
function getWsBaseUrl(): string {
  // Check if running in GitHub Codespaces
  if (typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev')) {
    // In Codespaces, use wss:// and replace the frontend port with backend port
    const hostname = window.location.hostname.replace('-8080.', '-8000.');
    return `wss://${hostname}/api`;
  }
  // Default for local development
  return 'ws://localhost:8000/api';
}

const WS_BASE = getWsBaseUrl();

export interface WebSocketHandlers {
  onMessage: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function createInterviewWebSocket(
  interviewId: string,
  handlers: WebSocketHandlers
): WebSocket | null {
  const token = getToken();
  if (!token) {
    console.error('Cannot create WebSocket: no auth token');
    return null;
  }

  const wsUrl = `${WS_BASE}/interviews/${interviewId}/ws?token=${token}`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected to interview:', interviewId);
    handlers.onConnect?.();
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      handlers.onMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    handlers.onDisconnect?.();
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    handlers.onError?.(error);
  };

  return ws;
}

// Helper to send typed messages
export function sendWebSocketMessage(
  ws: WebSocket | null,
  type: WebSocketEventType,
  data: Record<string, unknown>
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('Cannot send message: WebSocket not connected');
    return;
  }

  ws.send(JSON.stringify({ type, ...data }));
}
