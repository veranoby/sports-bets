import { Response } from 'express';
import { randomUUID } from 'crypto';

interface SseConnection {
  res: Response;
  channel?: string;
}

class SseService {
  private connections: Map<string, SseConnection> = new Map();

  addConnection(res: Response, channel?: string): string {
    const clientId = randomUUID();
    this.connections.set(clientId, { res, channel });
    return clientId;
  }

  removeConnection(clientId: string): void {
    this.connections.delete(clientId);
  }

  sendToClient(clientId: string, data: any): boolean {
    const connection = this.connections.get(clientId);
    if (connection && !connection.res.destroyed) {
      try {
        connection.res.write(`data: ${JSON.stringify(data)}\n\n`);
        return true;
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        this.removeConnection(clientId);
        return false;
      }
    }
    return false;
  }

  broadcast(data: any, channel?: string): void {
    for (const [clientId, connection] of this.connections.entries()) {
      if (!channel || connection.channel === channel) {
        this.sendToClient(clientId, data);
      }
    }
  }

  broadcastToAdmin(data: any): void {
    // Assuming admin channels might start with 'admin-'
    for (const [clientId, connection] of this.connections.entries()) {
      if (connection.channel && connection.channel.startsWith('admin')) {
        this.sendToClient(clientId, data);
      }
    }
  }

  broadcastToEvent(eventId: string, data: any): void {
    this.broadcast(data, `event-${eventId}`);
    this.broadcast(data, `stream-${eventId}`);
    this.broadcast(data, `fight-${eventId}`);
  }
}

export const sseService = new SseService();
