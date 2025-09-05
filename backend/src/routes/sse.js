const express = require('express');
const router = express.Router();
const sseService = require('../services/sseService');

// Middleware para manejar conexiones SSE
const sseMiddleware = (req, res, next) => {
  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Enviar un comentario inicial para mantener la conexión
  res.write(': keep-alive\n\n');

  // Manejar cierre de conexión
  req.on('close', () => {
    // Aquí se removería la conexión del servicio SSE
    // Esto se manejará en cada endpoint específico
  });

  next();
};

// Endpoint para streaming de eventos
// GET /api/sse/events/:eventId/stream
router.get('/events/:eventId/stream', sseMiddleware, (req, res) => {
  const { eventId } = req.params;
  
  // Agregar conexión al servicio SSE
  sseService.addConnection(`event:${eventId}`, res);
  
  // Manejar cierre de conexión
  req.on('close', () => {
    sseService.removeConnection(`event:${eventId}`, res);
  });
});

// Endpoint para monitoreo del sistema
// GET /api/sse/system/status
router.get('/system/status', sseMiddleware, (req, res) => {
  // Agregar conexión al servicio SSE
  sseService.addConnection('system:status', res);
  
  // Enviar datos iniciales
  const initialData = {
    api: { status: 'healthy' },
    database: { status: 'healthy' }
  };
  
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);
  
  // Simular envío periódico de datos (cada 5 segundos)
  const interval = setInterval(() => {
    const statusData = {
      api: { status: 'healthy' },
      database: { status: 'healthy' }
    };
    
    res.write(`data: ${JSON.stringify(statusData)}\n\n`);
  }, 5000);
  
  // Manejar cierre de conexión
  req.on('close', () => {
    clearInterval(interval);
    sseService.removeConnection('system:status', res);
  });
});

// Endpoint para notificaciones de apuestas (feature flag)
// GET /api/sse/users/me/betting
router.get('/users/me/betting', sseMiddleware, (req, res) => {
  // Verificar feature flag
  if (process.env.FEATURES_BETTING !== 'true') {
    res.status(403).json({ error: 'Feature disabled' });
    return;
  }
  
  // Agregar conexión al servicio SSE
  sseService.addConnection('betting:notifications', res);
  
  // Manejar cierre de conexión
  req.on('close', () => {
    sseService.removeConnection('betting:notifications', res);
  });
});

module.exports = router;