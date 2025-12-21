/**
 * WebSocket Service for Real-Time Linkers Updates
 *
 * Manages WebSocket connection to receive real-time updates when
 * linkers are created, updated, or deleted by any user.
 */

export interface WSMessage {
  type: 'insert' | 'update' | 'delete' | 'connected' | 'error';
  payload?: any;
}

export type WSMessageHandler = (message: WSMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private messageHandlers: Set<WSMessageHandler> = new Set();
  private isIntentionallyClosed = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private getWebSocketURL(): string {
    // Use environment variable for API base URL, replace http/https with ws/wss
    const apiBaseURL =
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const baseURL = apiBaseURL.replace('/api', ''); // Remove /api suffix
    const wsURL = baseURL.replace(/^http/, 'ws'); // Replace http/https with ws/wss
    return `${wsURL}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    const wsURL = this.getWebSocketURL();

    console.log(`🔌 Connecting to WebSocket: ${wsURL}`);

    try {
      this.ws = new WebSocket(wsURL);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket...');
    this.isIntentionallyClosed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to WebSocket messages
   */
  subscribe(handler: WSMessageHandler): () => void {
    this.messageHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Get current connection state
   */
  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Private methods

  private handleOpen(): void {
    console.log('✅ WebSocket connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000; // Reset delay
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data);
      console.log('📩 WebSocket message:', message.type, message.payload);

      // Notify all subscribers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('❌ Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
    }
  }

  private handleError(event: Event): void {
    console.error('❌ WebSocket error:', event);
  }

  private handleClose(event: CloseEvent): void {
    console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
    this.ws = null;

    // Only attempt reconnect if not intentionally closed
    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached`
      );

      // Notify subscribers about persistent connection failure
      const errorMessage: WSMessage = {
        type: 'error',
        payload: 'Failed to connect to real-time updates',
      };
      this.messageHandlers.forEach((handler) => handler(errorMessage));
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + jitter,
      this.maxReconnectDelay
    );

    console.log(
      `🔄 Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
