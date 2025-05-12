Guía de Referencia: Sistemas en Tiempo Real para Sports Bets
Arquitectura de Comunicación en Tiempo Real
Componentes del Sistema
[Servidor Socket.io] <---> [Redis PubSub] <---> [Múltiples Instancias de API]
↑ ↑
↓ ↓
[Clientes Frontend] [Eventos del Sistema]
(WebSockets) (Apuestas, Resultados)
Flujos de Datos Principales

Actualización de Apuestas:

Nueva apuesta → API → Redis PubSub → Socket.io → Clientes interesados

Resultados de Eventos:

Resultado registrado → API → Redis PubSub → Socket.io → Todos los clientes

Estado de Billetera:

Cambio de balance → API → Redis PubSub → Socket.io → Cliente específico

Implementación del Servidor
Configuración Socket.io con Express
javascript// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

// Inicializar Express y Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
cors: {
origin: process.env.NODE_ENV === 'production'
? ['https://yourdomain.com']
: ['http://localhost:3000'],
methods: ['GET', 'POST'],
credentials: true
},
pingTimeout: 60000, // 60 segundos
pingInterval: 25000, // 25 segundos
transports: ['websocket', 'polling']
});

// Configurar Redis para sesiones y PubSub
const redisClient = new Redis({
host: process.env.REDIS_HOST || 'localhost',
port: process.env.REDIS_PORT || 6379,
password: process.env.REDIS_PASSWORD || '',
retryStrategy: (times) => {
return Math.min(times \* 50, 2000); // Reintentos exponenciales con máximo 2s
}
});

const redisPubSub = new Redis({
host: process.env.REDIS_HOST || 'localhost',
port: process.env.REDIS_PORT || 6379,
password: process.env.REDIS_PASSWORD || ''
});

// Middleware de autenticación para Socket.io
io.use((socket, next) => {
const token = socket.handshake.auth.token;

if (!token) {
return next(new Error('Authentication error: Token required'));
}

try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);
socket.user = decoded;
next();
} catch (err) {
return next(new Error('Authentication error: Invalid token'));
}
});

// Configurar canales y conexiones
io.on('connection', (socket) => {
console.log('User connected:', socket.user.id);

// Unir a sala personal para notificaciones específicas
socket.join(`user:${socket.user.id}`);

// Unir a canal principal
socket.join('global');

// Manejar suscripción a eventos específicos
socket.on('join-event', (eventId) => {
socket.join(`event:${eventId}`);
console.log(`User ${socket.user.id} joined event ${eventId}`);
});

// Manejar desuscripción de eventos
socket.on('leave-event', (eventId) => {
socket.leave(`event:${eventId}`);
console.log(`User ${socket.user.id} left event ${eventId}`);
});

// Manejar desconexión
socket.on('disconnect', () => {
console.log('User disconnected:', socket.user.id);
});
});

// Suscribirse a mensajes de Redis
redisPubSub.subscribe('bet-updates', 'event-results', 'wallet-updates');
redisPubSub.on('message', (channel, message) => {
try {
const data = JSON.parse(message);

    switch (channel) {
      case 'bet-updates':
        // Enviar actualizaciones a todos los clientes interesados en este evento
        io.to(`event:${data.eventId}`).emit('new-bet', data);
        break;

      case 'event-results':
        // Enviar resultados a todos los clientes interesados
        io.to(`event:${data.eventId}`).emit('event-result', data);

        // Notificar individualmente a afectados
        if (data.affectedUsers) {
          data.affectedUsers.forEach(userId => {
            io.to(`user:${userId}`).emit('bet-resolved', {
              eventId: data.eventId,
              betId: data.betId,
              isWinner: data.winnerIds.includes(userId),
              amount: data.userResults[userId] || 0
            });
          });
        }
        break;

      case 'wallet-updates':
        // Notificar cambios de billetera al usuario específico
        io.to(`user:${data.userId}`).emit('wallet-update', {
          balance: data.balance,
          availableBalance: data.availableBalance,
          frozenBalance: data.frozenBalance,
          delta: data.delta,
          reason: data.reason
        });
        break;
    }

} catch (error) {
console.error('Error processing Redis message:', error);
}
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
Publicación de Eventos desde API
javascript// services/realTimeService.js
const Redis = require('ioredis');

// Cliente Redis para publicación
const redisPublisher = new Redis({
host: process.env.REDIS_HOST || 'localhost',
port: process.env.REDIS_PORT || 6379,
password: process.env.REDIS_PASSWORD || ''
});

/\*\*

- Publica una nueva apuesta
  \*/
  async function publishNewBet(bet) {
  try {
  const betData = {
  id: bet.id,
  eventId: bet.event_id,
  creatorId: bet.creator_id,
  creatorUsername: bet.creator_username,
  creatorChoice: bet.creator_choice,
  creatorAmount: parseFloat(bet.creator_amount),
  acceptorAmount: parseFloat(bet.acceptor_amount),
  status: bet.status,
  timestamp: new Date().toISOString()
  };
      await redisPublisher.publish('bet-updates', JSON.stringify(betData));
      return true;
  } catch (error) {
  console.error('Error publishing new bet:', error);
  return false;
  }
  }

/\*\*

- Publica una actualización de apuesta (aceptada o cancelada)
  \*/
  async function publishBetUpdate(bet, action) {
  try {
  const betData = {
  id: bet.id,
  eventId: bet.event_id,
  status: bet.status,
  action: action, // 'accepted', 'cancelled'
  timestamp: new Date().toISOString()
  };
      // Si fue aceptada, incluir información del aceptante
      if (action === 'accepted') {
        betData.acceptorId = bet.acceptor_id;
        betData.acceptorUsername = bet.acceptor_username;
      }

      await redisPublisher.publish('bet-updates', JSON.stringify(betData));
      return true;
  } catch (error) {
  console.error('Error publishing bet update:', error);
  return false;
  }
  }

/\*\*

- Publica un resultado de evento
  \*/
  async function publishEventResult(eventId, result, affectedBets) {
  try {
  // Recopilar IDs de usuarios afectados
  const affectedUsers = new Set();
  const userResults = {};
  const winnerIds = [];
      affectedBets.forEach(bet => {
        affectedUsers.add(bet.creator_id);
        affectedUsers.add(bet.acceptor_id);

        if (bet.winner_id) {
          winnerIds.push(bet.winner_id);
          userResults[bet.winner_id] = (userResults[bet.winner_id] || 0) +
            parseFloat(bet.winner_id === bet.creator_id ? bet.acceptor_amount : bet.creator_amount);
        }
      });

      const resultData = {
        eventId,
        result,
        affectedBets: affectedBets.map(bet => bet.id),
        affectedUsers: Array.from(affectedUsers),
        winnerIds,
        userResults,
        timestamp: new Date().toISOString()
      };

      await redisPublisher.publish('event-results', JSON.stringify(resultData));
      return true;
  } catch (error) {
  console.error('Error publishing event result:', error);
  return false;
  }
  }

/\*\*

- Publica actualización de billetera
  \*/
  async function publishWalletUpdate(userId, walletData) {
  try {
  const walletUpdate = {
  userId,
  balance: parseFloat(walletData.balance),
  availableBalance: parseFloat(walletData.availableBalance),
  frozenBalance: parseFloat(walletData.frozenBalance),
  delta: parseFloat(walletData.delta || 0),
  reason: walletData.reason || 'transaction',
  timestamp: new Date().toISOString()
  };
      await redisPublisher.publish('wallet-updates', JSON.stringify(walletUpdate));
      return true;
  } catch (error) {
  console.error('Error publishing wallet update:', error);
  return false;
  }
  }

module.exports = {
publishNewBet,
publishBetUpdate,
publishEventResult,
publishWalletUpdate
};
Implementación del Cliente
Hook de React para WebSockets
javascript// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export function useSocket(namespace = '') {
const { token, isAuthenticated } = useAuth();
const socketRef = useRef(null);
const [isConnected, setIsConnected] = useState(false);
const [error, setError] = useState(null);
const [socketEvents, setSocketEvents] = useState({});

// Memorizar URL base del socket
const socketUrl = useMemo(() => {
const baseUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
return namespace ? `${baseUrl}/${namespace}` : baseUrl;
}, [namespace]);

// Inicializar socket
useEffect(() => {
if (!isAuthenticated || !token) return;

    // Limpiar errores previos
    setError(null);

    // Configurar socket
    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Manejar eventos de conexión
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    socketRef.current.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'Error de conexión');
      setIsConnected(false);
    });

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        // Eliminar todos los listeners
        Object.keys(socketEvents).forEach(event => {
          socketRef.current.off(event);
        });

        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketEvents({});
      }
    };

}, [isAuthenticated, token, socketUrl]);

// Función para unirse a una sala (ej. event:123)
const joinRoom = useCallback((room) => {
if (!socketRef.current || !isConnected) return;

    console.log(`Joining room: ${room}`);
    socketRef.current.emit('join-event', room);

}, [isConnected]);

// Función para abandonar una sala
const leaveRoom = useCallback((room) => {
if (!socketRef.current || !isConnected) return;

    console.log(`Leaving room: ${room}`);
    socketRef.current.emit('leave-event', room);

}, [isConnected]);

// Función para escuchar eventos
const on = useCallback((event, callback) => {
if (!socketRef.current) return;

    // Eliminar listener anterior si existe
    if (socketEvents[event]) {
      socketRef.current.off(event, socketEvents[event]);
    }

    // Agregar nuevo listener
    socketRef.current.on(event, callback);

    // Guardar referencia
    setSocketEvents(prev => ({
      ...prev,
      [event]: callback
    }));

}, [socketEvents]);

// Función para dejar de escuchar eventos
const off = useCallback((event) => {
if (!socketRef.current) return;

    socketRef.current.off(event);

    setSocketEvents(prev => {
      const updated = { ...prev };
      delete updated[event];
      return updated;
    });

}, []);

// Función para emitir eventos
const emit = useCallback((event, data, callback) => {
if (!socketRef.current || !isConnected) return;

    if (callback) {
      socketRef.current.emit(event, data, callback);
    } else {
      socketRef.current.emit(event, data);
    }

}, [isConnected]);

return {
socket: socketRef.current,
isConnected,
error,
on,
off,
emit,
joinRoom,
leaveRoom
};
}
Componente para Transmisión de Eventos
jsx// components/EventLiveStream.jsx
import React, { useState, useEffect, useCallback } from 'react';
import StreamPlayer from './StreamPlayer';
import BetList from './BetList';
import UserWallet from './UserWallet';
import NewBetForm from './NewBetForm';
import LiveEventInfo from './LiveEventInfo';
import { useSocket } from '../hooks/useSocket';
import { useWallet } from '../hooks/useWallet';
import { useBets } from '../hooks/useBets';
import { toast } from 'react-hot-toast';

Guía de Referencia: Sistemas en Tiempo Real para Sports Bets
Arquitectura de Comunicación en Tiempo Real
Componentes del Sistema
[Servidor Socket.io] <---> [Redis PubSub] <---> [Múltiples Instancias de API]
↑ ↑
↓ ↓
[Clientes Frontend] [Eventos del Sistema]
(WebSockets) (Apuestas, Resultados)
Flujos de Datos Principales

Actualización de Apuestas:

Nueva apuesta → API → Redis PubSub → Socket.io → Clientes interesados

Resultados de Eventos:

Resultado registrado → API → Redis PubSub → Socket.io → Todos los clientes

Estado de Billetera:

Cambio de balance → API → Redis PubSub → Socket.io → Cliente específico

Implementación del Servidor
Configuración Socket.io con Express
javascript// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

// Inicializar Express y Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
cors: {
origin: process.env.NODE_ENV === 'production'
? ['https://yourdomain.com']
: ['http://localhost:3000'],
methods: ['GET', 'POST'],
credentials: true
},
pingTimeout: 60000, // 60 segundos
pingInterval: 25000, // 25 segundos
transports: ['websocket', 'polling']
});

// Configurar Redis para sesiones y PubSub
const redisClient = new Redis({
host: process.env.REDIS_HOST || 'localhost',
port: process.env.REDIS_PORT || 6379,
password: process.env.REDIS_PASSWORD || '',
retryStrategy: (times) => {
return Math.min(times \* 50, 2000); // Reintentos exponenciales con máximo 2s
}
});

const redisPubSub = new Redis({
host: process.env.REDIS_HOST || 'localhost',
port: process.env.REDIS_PORT || 6379,
password: process.env.REDIS_PASSWORD || ''
});

// Middleware de autenticación para Socket.io
io.use((socket, next) => {
const token = socket.handshake.auth.token;

if (!token) {
return next(new Error('Authentication error: Token required'));
}

try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);
socket.user = decoded;
next();
} catch (err) {
return next(new Error('Authentication error: Invalid token'));
}
});

// Configurar canales y conexiones
io.on('connection', (socket) => {
console.log('User connected:', socket.user.id);

// Unir a sala personal para notificaciones específicas
socket.join(`user:${socket.user.id}`);

// Unir a canal principal
socket.join('global');

// Manejar suscripción a eventos específicos
socket.on('join-event', (eventId) => {
socket.join(`event:${eventId}`);
console.log(`User ${socket.user.id} joined event ${eventId}`);
});

// Manejar desuscripción de eventos
socket.on('leave-event', (eventId) => {
socket.leave(`event:${eventId}`);
console.log(`User ${socket.user.id} left event ${eventId}`);
});

// Manejar desconexión
socket.on('disconnect', () => {
console.log('User disconnected:', socket.user.id);
});
});

// Suscribirse a mensajes de Redis
redisPubSub.subscribe('bet-updates', 'event-results', 'wallet-updates');
redisPubSub.on('message', (channel, message) => {
try {
const data = JSON.parse(message);

    switch (channel) {
      case 'bet-updates':
        // Enviar actualizaciones a todos los clientes interesados en este evento
        io.to(`event:${data.eventId}`).emit('new-bet', data);
        break;

      case 'event-results':
        // Enviar resultados a todos los clientes interesados
        io.to(`event:${data.eventId}`).emit('event-result', data);

        // Notificar individualmente a afectados
        if (data.affectedUsers) {
          data.affectedUsers.forEach(userId => {
            io.to(`user:${userId}`).emit('bet-resolved', {
              eventId: data.eventId,
              betId: data.betId,
              isWinner: data.winnerIds.includes(userId),
              amount: data.userResults[userId] || 0
            });
          });
        }
        break;

      case 'wallet-updates':
        // Notificar cambios de billetera al usuario específico
        io.to(`user:${data.userId}`).emit('wallet-update', {
          balance: data.balance,
          availableBalance: data.availableBalance,
          frozenBalance: data.frozenBalance,
          delta: data.delta,
          reason: data.reason
        });
        break;
    }

} catch (error) {
console.error('Error processing Redis message:', error);
}
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
Publicación de Eventos desde API
javascript// services/realTimeService.js
const Redis = require('ioredis');

// Cliente Redis para publicación
const redisPublisher = new Redis({
host: process.env.REDIS_HOST || 'localhost',
port: process.env.REDIS_PORT || 6379,
password: process.env.REDIS_PASSWORD || ''
});

/\*\*

- Publica una nueva apuesta
  \*/
  async function publishNewBet(bet) {
  try {
  const betData = {
  id: bet.id,
  eventId: bet.event_id,
  creatorId: bet.creator_id,
  creatorUsername: bet.creator_username,
  creatorChoice: bet.creator_choice,
  creatorAmount: parseFloat(bet.creator_amount),
  acceptorAmount: parseFloat(bet.acceptor_amount),
  status: bet.status,
  timestamp: new Date().toISOString()
  };
      await redisPublisher.publish('bet-updates', JSON.stringify(betData));
      return true;
  } catch (error) {
  console.error('Error publishing new bet:', error);
  return false;
  }
  }

/\*\*

- Publica una actualización de apuesta (aceptada o cancelada)
  \*/
  async function publishBetUpdate(bet, action) {
  try {
  const betData = {
  id: bet.id,
  eventId: bet.event_id,
  status: bet.status,
  action: action, // 'accepted', 'cancelled'
  timestamp: new Date().toISOString()
  };
      // Si fue aceptada, incluir información del aceptante
      if (action === 'accepted') {
        betData.acceptorId = bet.acceptor_id;
        betData.acceptorUsername = bet.acceptor_username;
      }

      await redisPublisher.publish('bet-updates', JSON.stringify(betData));
      return true;
  } catch (error) {
  console.error('Error publishing bet update:', error);
  return false;
  }
  }

/\*\*

- Publica un resultado de evento
  \*/
  async function publishEventResult(eventId, result, affectedBets) {
  try {
  // Recopilar IDs de usuarios afectados
  const affectedUsers = new Set();
  const userResults = {};
  const winnerIds = [];
      affectedBets.forEach(bet => {
        affectedUsers.add(bet.creator_id);
        affectedUsers.add(bet.acceptor_id);

        if (bet.winner_id) {
          winnerIds.push(bet.winner_id);
          userResults[bet.winner_id] = (userResults[bet.winner_id] || 0) +
            parseFloat(bet.winner_id === bet.creator_id ? bet.acceptor_amount : bet.creator_amount);
        }
      });

      const resultData = {
        eventId,
        result,
        affectedBets: affectedBets.map(bet => bet.id),
        affectedUsers: Array.from(affectedUsers),
        winnerIds,
        userResults,
        timestamp: new Date().toISOString()
      };

      await redisPublisher.publish('event-results', JSON.stringify(resultData));
      return true;
  } catch (error) {
  console.error('Error publishing event result:', error);
  return false;
  }
  }

/\*\*

- Publica actualización de billetera
  \*/
  async function publishWalletUpdate(userId, walletData) {
  try {
  const walletUpdate = {
  userId,
  balance: parseFloat(walletData.balance),
  availableBalance: parseFloat(walletData.availableBalance),
  frozenBalance: parseFloat(walletData.frozenBalance),
  delta: parseFloat(walletData.delta || 0),
  reason: walletData.reason || 'transaction',
  timestamp: new Date().toISOString()
  };
      await redisPublisher.publish('wallet-updates', JSON.stringify(walletUpdate));
      return true;
  } catch (error) {
  console.error('Error publishing wallet update:', error);
  return false;
  }
  }

module.exports = {
publishNewBet,
publishBetUpdate,
publishEventResult,
publishWalletUpdate
};
Implementación del Cliente
Hook de React para WebSockets
javascript// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export function useSocket(namespace = '') {
const { token, isAuthenticated } = useAuth();
const socketRef = useRef(null);
const [isConnected, setIsConnected] = useState(false);
const [error, setError] = useState(null);
const [socketEvents, setSocketEvents] = useState({});

// Memorizar URL base del socket
const socketUrl = useMemo(() => {
const baseUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
return namespace ? `${baseUrl}/${namespace}` : baseUrl;
}, [namespace]);

// Inicializar socket
useEffect(() => {
if (!isAuthenticated || !token) return;

    // Limpiar errores previos
    setError(null);

    // Configurar socket
    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Manejar eventos de conexión
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    socketRef.current.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'Error de conexión');
      setIsConnected(false);
    });

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        // Eliminar todos los listeners
        Object.keys(socketEvents).forEach(event => {
          socketRef.current.off(event);
        });

        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketEvents({});
      }
    };

}, [isAuthenticated, token, socketUrl]);

// Función para unirse a una sala (ej. event:123)
const joinRoom = useCallback((room) => {
if (!socketRef.current || !isConnected) return;

    console.log(`Joining room: ${room}`);
    socketRef.current.emit('join-event', room);

}, [isConnected]);

// Función para abandonar una sala
const leaveRoom = useCallback((room) => {
if (!socketRef.current || !isConnected) return;

    console.log(`Leaving room: ${room}`);
    socketRef.current.emit('leave-event', room);

}, [isConnected]);

// Función para escuchar eventos
const on = useCallback((event, callback) => {
if (!socketRef.current) return;

    // Eliminar listener anterior si existe
    if (socketEvents[event]) {
      socketRef.current.off(event, socketEvents[event]);
    }

    // Agregar nuevo listener
    socketRef.current.on(event, callback);

    // Guardar referencia
    setSocketEvents(prev => ({
      ...prev,
      [event]: callback
    }));

}, [socketEvents]);

// Función para dejar de escuchar eventos
const off = useCallback((event) => {
if (!socketRef.current) return;

    socketRef.current.off(event);

    setSocketEvents(prev => {
      const updated = { ...prev };
      delete updated[event];
      return updated;
    });

}, []);

// Función para emitir eventos
const emit = useCallback((event, data, callback) => {
if (!socketRef.current || !isConnected) return;

    if (callback) {
      socketRef.current.emit(event, data, callback);
    } else {
      socketRef.current.emit(event, data);
    }

}, [isConnected]);

return {
socket: socketRef.current,
isConnected,
error,
on,
off,
emit,
joinRoom,
leaveRoom
};
}
Componente para Transmisión de Eventos
jsx// components/EventLiveStream.jsx
import React, { useState, useEffect, useCallback } from 'react';
import StreamPlayer from './StreamPlayer';
import BetList from './BetList';
import UserWallet from './UserWallet';
import NewBetForm from './NewBetForm';
import LiveEventInfo from './LiveEventInfo';
import { useSocket } from '../hooks/useSocket';
import { useWallet } from '../hooks/useWallet';
import { useBets } from '../hooks/useBets';
import { toast } from 'react-hot-toast';
