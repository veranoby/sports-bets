# Galleros.Net SSE Architecture - API Specification

## Complete SSE (Server-Sent Events) Architecture for Admin Real-time Updates

This specification provides all the details needed for frontend implementation of SSE connections for real-time admin dashboard updates.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [SSE Endpoints](#sse-endpoints)
3. [Event Types](#event-types)
4. [Authentication](#authentication)
5. [Frontend Implementation Guide](#frontend-implementation-guide)
6. [WebSocket Integration](#websocket-integration)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)

---

## Architecture Overview

### Core Principles

- **SSE for Admin**: All admin real-time updates use Server-Sent Events
- **WebSocket Minimal**: Only PAGO/DOY proposals use WebSocket (3-minute timeout)
- **Channel-Based**: Admin connections subscribe to specific channels
- **Role-Based Access**: Different admin roles access different channels
- **Event-Driven**: Database changes automatically trigger SSE broadcasts

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Admin Frontend │    │   SSE Service    │    │   Database      │
│     (React)     │◄──►│   (Express)      │◄──►│  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │              ┌──────────────────┐               │
        │              │  WebSocket       │               │
        └─────────────►│  (PAGO/DOY only) │◄──────────────┘
                       └──────────────────┘
```

---

## SSE Endpoints

### Base URL: `/api/sse/admin/`

All SSE endpoints require authentication and proper admin roles.

### 1. System Monitoring Channel
```
GET /api/sse/admin/system
```
- **Roles**: `admin`, `operator`
- **Purpose**: System status, database performance, maintenance alerts
- **Events**: `SYSTEM_STATUS`, `DATABASE_PERFORMANCE`, `SYSTEM_MAINTENANCE`

### 2. Fight Management Channel
```
GET /api/sse/admin/fights
```
- **Roles**: `admin`, `operator`
- **Purpose**: Fight status changes, new fights, betting windows
- **Events**: `FIGHT_STATUS_UPDATE`, `FIGHT_CREATED`, `BETTING_WINDOW_OPENED`, `BETTING_WINDOW_CLOSED`

### 3. Bet Monitoring Channel
```
GET /api/sse/admin/bets
```
- **Roles**: `admin`, `operator`
- **Purpose**: New bets, matches, PAGO/DOY proposals
- **Events**: `NEW_BET`, `BET_MATCHED`, `PAGO_PROPOSAL`, `DOY_PROPOSAL`
- **Query Parameters**:
  - `fightIds`: Comma-separated list to filter specific fights

### 4. User Management Channel
```
GET /api/sse/admin/users
```
- **Roles**: `admin`
- **Purpose**: User registrations, verifications, bans
- **Events**: `USER_REGISTERED`, `USER_VERIFIED`, `USER_BANNED`, `ADMIN_ACTION`

### 5. Financial Monitoring Channel
```
GET /api/sse/admin/finance
```
- **Roles**: `admin`
- **Purpose**: Wallet transactions, payments, payouts
- **Events**: `WALLET_TRANSACTION`, `PAYMENT_PROCESSED`, `PAYOUT_PROCESSED`

### 6. Streaming Monitoring Channel
```
GET /api/sse/admin/streaming
```
- **Roles**: `admin`, `operator`
- **Purpose**: Stream status, viewer counts, errors
- **Events**: `STREAM_STARTED`, `STREAM_ENDED`, `STREAM_ERROR`, `VIEWER_COUNT_UPDATE`

### 7. Notifications Channel
```
GET /api/sse/admin/notifications
```
- **Roles**: `admin`, `operator`
- **Purpose**: System notifications, alerts, proposals
- **Events**: All high-priority and critical events from other channels

### 8. Global Channel
```
GET /api/sse/admin/global
```
- **Roles**: `admin`
- **Purpose**: All system events (super admin view)
- **Events**: All event types from all channels

### 9. Connection Statistics
```
GET /api/sse/admin/stats
```
- **Roles**: `admin`
- **Purpose**: SSE connection statistics and performance metrics
- **Response**: JSON object with connection counts, performance data

### 10. Test Broadcast
```
POST /api/sse/admin/test-broadcast
```
- **Roles**: `admin`
- **Purpose**: Test SSE broadcasting functionality
- **Body**:
  ```json
  {
    "channel": "admin-system",
    "eventType": "TEST_EVENT",
    "data": { "message": "Test from admin" }
  }
  ```

---

## Public SSE Endpoints

### Base URL: `/api/sse/public/`

Public SSE endpoints for authenticated users (not admin/operator).

### 1. Event-Specific Updates
```
GET /api/sse/public/events/:eventId
```
- **Authentication**: User-level (any authenticated role)
- **Purpose**: Real-time updates for specific event (fights, status, stream info)
- **Events**: `FIGHT_STATUS_UPDATE`, `FIGHT_UPDATED`, `EVENT_ACTIVATED`, `EVENT_COMPLETED`, `STREAM_STARTED`, `STREAM_STOPPED`, `NEW_BET`, `BET_MATCHED`
- **Query Parameters**:
  - `token`: JWT token for authentication (can be passed in query for SSE)
- **Response Format**: Server-Sent Events stream with JSON-formatted event data
- **Example Event**:
  ```
  event: FIGHT_STATUS_UPDATE
  data: {"id":"uuid","type":"FIGHT_STATUS_UPDATE","data":{"fightId":"...","eventId":"...","status":"live"},"timestamp":"2025-12-11T00:37:20.815Z"}
  ```
- **Implementation**: Used by LiveEvent.tsx component for real-time fight/event updates

---

## Event Types

### System Events
| Event Type | Priority | Data Structure |
|------------|----------|----------------|
| `SYSTEM_STATUS` | medium | `{ status, timestamp, uptime, environment }` |
| `DATABASE_PERFORMANCE` | high/critical | `{ query, duration, threshold, severity, table, recommendation }` |
| `SYSTEM_MAINTENANCE` | critical | `{ status, message, estimatedDuration, scheduledBy }` |

### Fight Management Events
| Event Type | Priority | Data Structure |
|------------|----------|----------------|
| `FIGHT_STATUS_UPDATE` | high | `{ fightId, oldStatus, newStatus, fightNumber, redCorner, blueCorner, eventId }` |
| `FIGHT_CREATED` | medium | `{ fightId, fightNumber, redCorner, blueCorner, weight, eventId, status }` |
| `BETTING_WINDOW_OPENED` | high | `{ fightId, fightNumber, redCorner, blueCorner, bettingStartTime, bettingEndTime }` |
| `BETTING_WINDOW_CLOSED` | high | `{ fightId, fightNumber, finalBetCount, finalAmount }` |

### Betting Events
| Event Type | Priority | Data Structure |
|------------|----------|----------------|
| `NEW_BET` | medium | `{ betId, fightId, userId, side, amount, potentialWin, betType }` |
| `BET_MATCHED` | medium | `{ bet1Id, bet2Id, fightId, totalAmount, sides }` |
| `PAGO_PROPOSAL` | critical | `{ action, proposalId, fightId, betId, userId, proposedBy, pagoAmount, originalAmount, side, expiresAt }` |
| `DOY_PROPOSAL` | critical | `{ action, proposalId, fightId, betId, userId, proposedBy, doyAmount, originalAmount, side, expiresAt }` |

### User Management Events
| Event Type | Priority | Data Structure |
|------------|----------|----------------|
| `USER_REGISTERED` | low | `{ userId, username, email, role, registrationDate, verificationLevel }` |
| `USER_VERIFIED` | medium | `{ userId, username, email, verificationLevel, verificationDate }` |
| `USER_BANNED` | high | `{ userId, username, email, role, banDate, previouslyActive }` |

### Financial Events
| Event Type | Priority | Data Structure |
|------------|----------|----------------|
| `WALLET_TRANSACTION` | medium/high | `{ transactionId, userId, type, amount, status, description }` |
| `PAYMENT_PROCESSED` | medium/high | `{ paymentId, userId, method, amount, status, provider }` |
| `PAYOUT_PROCESSED` | medium | `{ payoutId, userId, amount, status, method }` |

### Streaming Events
| Event Type | Priority | Data Structure |
|------------|----------|----------------|
| `STREAM_STARTED` | medium | `{ streamId, eventId, status, quality, viewerCount, streamUrl }` |
| `STREAM_ENDED` | medium | `{ streamId, eventId, status, duration, finalViewerCount }` |
| `STREAM_ERROR` | high | `{ streamId, eventId, error, message, timestamp }` |

### Connection Events
| Event Type | Priority | Data Structure |
|------------|----------|----------------|
| `CONNECTION_ESTABLISHED` | low | `{ connectionId, message, serverTime, heartbeatInterval }` |
| `HEARTBEAT` | low | `{ serverTime }` |
| `ERROR` | critical | `{ level, message, timestamp, details }` |

---

## Authentication

### Required Headers
```javascript
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Accept': 'text/event-stream'
}
```

### Authentication Flow
1. Obtain JWT token via `/api/auth/login`
2. Include token in Authorization header for SSE connection
3. Server validates token and user role
4. Connection established with user context

---

## Frontend Implementation Guide

### React SSE Hook Example

```typescript
// useSSE.ts
import { useEffect, useRef, useState } from 'react';

interface SSEEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

interface UseSSEOptions {
  channel: string;
  token: string;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

export const useSSE = (options: UseSSEOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      const url = `/api/sse/admin/${options.channel}`;
      const eventSource = new EventSource(url, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${options.token}`
        }
      });

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        console.log(`SSE connected to ${options.channel}`);
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        setError('Connection error');

        if (options.onError) {
          options.onError(error);
        }

        // Auto-reconnect logic
        if (options.autoReconnect && reconnectAttempts.current < (options.maxReconnectAttempts || 5)) {
          setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, Math.pow(2, reconnectAttempts.current) * 1000); // Exponential backoff
        }
      };

      // Listen to all event types
      const eventTypes = [
        'FIGHT_STATUS_UPDATE', 'NEW_BET', 'PAGO_PROPOSAL', 'DOY_PROPOSAL',
        'USER_REGISTERED', 'SYSTEM_STATUS', 'STREAM_STARTED', 'CONNECTION_ESTABLISHED',
        'HEARTBEAT', 'ERROR'
      ];

      eventTypes.forEach(eventType => {
        eventSource.addEventListener(eventType, (event: any) => {
          try {
            const eventData: SSEEvent = {
              id: event.lastEventId,
              type: eventType,
              data: JSON.parse(event.data),
              timestamp: event.data.timestamp || new Date().toISOString(),
              priority: event.data.priority || 'medium',
              metadata: event.data.metadata
            };

            setEvents(prev => [...prev.slice(-99), eventData]); // Keep last 100 events

            if (options.onEvent) {
              options.onEvent(eventData);
            }
          } catch (err) {
            console.error('Failed to parse SSE event:', err);
          }
        });
      });

      eventSourceRef.current = eventSource;
    } catch (err) {
      setError('Failed to establish connection');
      console.error('SSE connection error:', err);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connect();
    return disconnect;
  }, [options.channel, options.token]);

  return {
    isConnected,
    events,
    error,
    connect,
    disconnect
  };
};
```

### Admin Dashboard Components

```typescript
// AdminSystemMonitor.tsx
import React from 'react';
import { useSSE } from './hooks/useSSE';
import { useAuth } from './hooks/useAuth';

export const AdminSystemMonitor: React.FC = () => {
  const { token } = useAuth();
  const { isConnected, events, error } = useSSE({
    channel: 'system',
    token,
    autoReconnect: true,
    onEvent: (event) => {
      if (event.priority === 'critical') {
        // Show critical alert
        alert(`CRITICAL: ${event.data.message}`);
      }
    }
  });

  return (
    <div className="admin-system-monitor">
      <div className="connection-status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        {error && <span className="error"> - {error}</span>}
      </div>

      <div className="events-list">
        {events.map(event => (
          <div
            key={event.id}
            className={`event event-${event.priority}`}
          >
            <span className="timestamp">{event.timestamp}</span>
            <span className="type">{event.type}</span>
            <span className="data">{JSON.stringify(event.data)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// AdminBetMonitor.tsx
export const AdminBetMonitor: React.FC = () => {
  const { token } = useAuth();
  const [fightFilter, setFightFilter] = useState<string>('');

  const { isConnected, events } = useSSE({
    channel: `bets${fightFilter ? `?fightIds=${fightFilter}` : ''}`,
    token,
    autoReconnect: true,
    onEvent: (event) => {
      if (event.type === 'PAGO_PROPOSAL' && event.data.action === 'CREATED') {
        // Show PAGO proposal notification
        showNotification(`New PAGO proposal: $${event.data.pagoAmount}`);
      }
    }
  });

  return (
    <div className="admin-bet-monitor">
      <div className="filters">
        <input
          type="text"
          placeholder="Filter by fight IDs (comma-separated)"
          value={fightFilter}
          onChange={(e) => setFightFilter(e.target.value)}
        />
      </div>

      <div className="bet-events">
        {events.filter(e => ['NEW_BET', 'PAGO_PROPOSAL', 'DOY_PROPOSAL'].includes(e.type))
         .map(event => (
          <BetEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};
```

### Multi-Channel Connection Manager

```typescript
// useMultiSSE.ts
export const useMultiSSE = (channels: string[], token: string) => {
  const [connections, setConnections] = useState<Map<string, any>>(new Map());
  const [allEvents, setAllEvents] = useState<SSEEvent[]>([]);

  useEffect(() => {
    channels.forEach(channel => {
      const connection = useSSE({
        channel,
        token,
        autoReconnect: true,
        onEvent: (event) => {
          setAllEvents(prev => [...prev.slice(-499), event]); // Keep last 500 events
        }
      });

      setConnections(prev => new Map(prev.set(channel, connection)));
    });

    return () => {
      connections.forEach(conn => conn.disconnect());
    };
  }, [channels, token]);

  const getEventsForChannel = (channel: string) => {
    return allEvents.filter(event => event.metadata?.channel === channel);
  };

  const getEventsByType = (eventType: string) => {
    return allEvents.filter(event => event.type === eventType);
  };

  return {
    connections,
    allEvents,
    getEventsForChannel,
    getEventsByType
  };
};
```

---

## WebSocket Integration

### PAGO/DOY Proposal System

The WebSocket service handles only PAGO/DOY proposals with 3-minute timeout.

#### Connection
```javascript
import io from 'socket.io-client';

const socket = io('/socket.io', {
  auth: {
    token: jwtToken
  },
  transports: ['websocket', 'polling']
});
```

#### Events

**Outgoing (Client → Server)**
- `create_pago_proposal`: Create PAGO proposal
- `create_doy_proposal`: Create DOY proposal
- `respond_to_proposal`: Accept/reject proposal
- `cancel_proposal`: Cancel own proposal

**Incoming (Server → Client)**
- `proposal_received`: New proposal for user
- `proposal_created`: Confirmation of created proposal
- `proposal_result`: Proposal accepted/rejected/timeout
- `proposal_error`: Error in proposal handling
- `pending_proposals`: Proposals waiting on connection

#### Data Structures
```typescript
interface PagoProposal {
  fightId: string;
  betId: string;
  proposedTo: string;
  pagoAmount: number;
  side: 'red' | 'blue';
  amount: number;
}

interface ProposalResponse {
  proposalId: string;
  response: 'accept' | 'reject';
}
```

---

## Error Handling

### SSE Error Handling

1. **Connection Errors**: Automatic reconnection with exponential backoff
2. **Authentication Errors**: Redirect to login
3. **Authorization Errors**: Show access denied message
4. **Parse Errors**: Log and continue
5. **Network Errors**: Retry connection

### WebSocket Error Handling

1. **Proposal Timeout**: Show timeout notification
2. **Connection Lost**: Attempt reconnection
3. **Invalid Data**: Show validation errors
4. **Server Errors**: Display error message

---

## Performance Considerations

### SSE Optimization

- **Event Filtering**: Subscribe only to needed channels
- **Event History**: Limit stored events (100-500)
- **Connection Pooling**: Reuse connections when possible
- **Heartbeat Monitoring**: 30-second heartbeat for connection health

### Frontend Optimization

- **Debounced Updates**: Batch rapid events
- **Virtual Scrolling**: For large event lists
- **Memory Management**: Clear old events periodically
- **Selective Rendering**: Only render visible components

### Network Optimization

- **Compression**: gzip compression for SSE streams
- **CDN**: Serve static assets from CDN
- **Connection Limits**: Max 5 concurrent SSE connections per user

---

## Testing

### SSE Testing
```bash
# Test SSE connection
curl -H "Authorization: Bearer <token>" \
     -H "Accept: text/event-stream" \
     http://localhost:3001/api/sse/admin/system

# Test broadcast
curl -X POST http://localhost:3001/api/sse/admin/test-broadcast \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"channel":"admin-system","eventType":"TEST_EVENT","data":{"message":"test"}}'
```

### WebSocket Testing
```javascript
// Test PAGO proposal
socket.emit('create_pago_proposal', {
  fightId: 'fight_123',
  betId: 'bet_456',
  proposedTo: 'user_789',
  pagoAmount: 50,
  side: 'red',
  amount: 100
});
```

---

## Security Considerations

1. **Authentication Required**: All SSE/WebSocket connections require JWT
2. **Role-Based Access**: Different channels for different admin roles
3. **Rate Limiting**: Max 10 SSE connections per user
4. **Input Validation**: All WebSocket payloads validated
5. **CORS Configuration**: Strict origin checking
6. **Connection Timeout**: Auto-disconnect idle connections

---

This specification provides everything needed to implement the complete SSE architecture for Galleros.Net admin real-time updates. The frontend team should use this as the definitive reference for implementing SSE hooks and admin dashboard real-time features.