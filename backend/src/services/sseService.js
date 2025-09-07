"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseService = void 0;
const crypto_1 = require("crypto");
class SseService {
    constructor() {
        this.connections = new Map();
    }
    addConnection(res, channel) {
        const clientId = (0, crypto_1.randomUUID)();
        this.connections.set(clientId, { res, channel });
        return clientId;
    }
    removeConnection(clientId) {
        this.connections.delete(clientId);
    }
    sendToClient(clientId, data) {
        const connection = this.connections.get(clientId);
        if (connection && !connection.res.destroyed) {
            try {
                connection.res.write(`data: ${JSON.stringify(data)}\n\n`);
                return true;
            }
            catch (error) {
                console.error(`Failed to send to client ${clientId}:`, error);
                this.removeConnection(clientId);
                return false;
            }
        }
        return false;
    }
    broadcast(data, channel) {
        for (const [clientId, connection] of this.connections.entries()) {
            if (!channel || connection.channel === channel) {
                this.sendToClient(clientId, data);
            }
        }
    }
    broadcastToAdmin(data) {
        // Assuming admin channels might start with 'admin-'
        for (const [clientId, connection] of this.connections.entries()) {
            if (connection.channel && connection.channel.startsWith('admin')) {
                this.sendToClient(clientId, data);
            }
        }
    }
    broadcastToEvent(eventId, data) {
        this.broadcast(data, `event-${eventId}`);
        this.broadcast(data, `stream-${eventId}`);
        this.broadcast(data, `fight-${eventId}`);
    }
}
exports.sseService = new SseService();
