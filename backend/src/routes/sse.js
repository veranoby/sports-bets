const express = require('express');
const router = express.Router();
const sseService = require('../services/sseService');

/**
 * Endpoint para stream de estado de eventos
 * GET /api/sse/events/:eventId/stream
 */
router.get('/events/:eventId/stream', (req, res) => {
  const { eventId } = req.params;
  const clientId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Registrar la conexión
  sseService.addConnection(clientId, 'event', eventId, res);
  
  // Enviar mensaje inicial
  res.write(`data: ${JSON.stringify({ type: 'stream_connected', eventId, clientId })}\n\n`);
  
  // Manejar cierre de conexión
  req.on('close', () => {
    sseService.removeConnection(clientId, 'event', eventId);
  });
  
  // Manejar errores
  req.on('error', () => {
    sseService.removeConnection(clientId, 'event', eventId);
  });
});

/**
 * Endpoint para monitoreo del sistema
 * GET /api/sse/system/status
 */
router.get('/system/status', (req, res) => {
  const clientId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Registrar la conexión
  sseService.addConnection(clientId, 'system', null, res);
  
  // Enviar mensaje inicial
  res.write(`data: ${JSON.stringify({ type: 'system_connected', clientId })}\n\n`);
  
  // Manejar cierre de conexión
  req.on('close', () => {
    sseService.removeConnection(clientId, 'system');
  });
  
  // Manejar errores
  req.on('error', () => {
    sseService.removeConnection(clientId, 'system');
  });
});

/**
 * Endpoint para cambios de estado de peleas
 * GET /api/sse/events/:eventId/fights
 */
router.get('/events/:eventId/fights', (req, res) => {
  const { eventId } = req.params;
  const clientId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Registrar la conexión
  sseService.addConnection(clientId, 'event', eventId, res);
  
  // Enviar mensaje inicial
  res.write(`data: ${JSON.stringify({ type: 'fights_connected', eventId, clientId })}\n\n`);
  
  // Manejar cierre de conexión
  req.on('close', () => {
    sseService.removeConnection(clientId, 'event', eventId);
  });
  
  // Manejar errores
  req.on('error', () => {
    sseService.removeConnection(clientId, 'event', eventId);
  });
});

module.exports = router;