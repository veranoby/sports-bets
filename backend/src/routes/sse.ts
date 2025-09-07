import express from 'express';
import { sseService } from '../services/sseService';

const router = express.Router();

console.log('🔄 SSE routes loading...');

// Middleware to set SSE headers
const sseHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  next();
};

// Admin SSE endpoint for system status
router.get('/admin/system-status', sseHeaders, (req, res) => {
  const clientId = sseService.addConnection(res);
  console.log(`Client connected to system-status: ${clientId}`);

  // Send a confirmation message
  sseService.sendToClient(clientId, { type: 'SYSTEM_STATUS_CONNECTED', data: 'Connection established' });

  req.on('close', () => {
    sseService.removeConnection(clientId);
    console.log(`Client disconnected from system-status: ${clientId}`);
  });
});

// Admin SSE endpoint for event updates
router.get('/admin/events/:eventId', sseHeaders, (req, res) => {
  const { eventId } = req.params;
  const clientId = sseService.addConnection(res, `event-${eventId}`);
  console.log(`Client connected to event updates: ${clientId} for event ${eventId}`);

  req.on('close', () => {
    sseService.removeConnection(clientId);
    console.log(`Client disconnected from event updates: ${clientId}`);
  });
});

// Admin SSE endpoint for notifications
router.get('/admin/notifications', sseHeaders, (req, res) => {
  const clientId = sseService.addConnection(res, 'admin-notifications');
  console.log(`Client connected to admin notifications: ${clientId}`);

  req.on('close', () => {
    sseService.removeConnection(clientId);
    console.log(`Client disconnected from admin notifications: ${clientId}`);
  });
});

// Streaming SSE endpoint for event stream status
router.get('/events/:eventId/stream', sseHeaders, (req, res) => {
  const { eventId } = req.params;
  const clientId = sseService.addConnection(res, `stream-${eventId}`);
  console.log(`Client connected to stream status: ${clientId} for event ${eventId}`);

  req.on('close', () => {
    sseService.removeConnection(clientId);
    console.log(`Client disconnected from stream status: ${clientId}`);
  });
});

// Streaming SSE endpoint for betting updates
router.get('/fights/:fightId/bets', sseHeaders, (req, res) => {
  const { fightId } = req.params;
  const clientId = sseService.addConnection(res, `fight-${fightId}`);
  console.log(`Client connected to bet updates: ${clientId} for fight ${fightId}`);

  req.on('close', () => {
    sseService.removeConnection(clientId);
    console.log(`Client disconnected from bet updates: ${clientId}`);
  });
});


export default router;
