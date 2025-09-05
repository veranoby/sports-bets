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

  next();
};

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