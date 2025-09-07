// backend/src/routes/push.ts
// 📱 PUSH NOTIFICATION ENDPOINTS - PWA Integration

import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { body, validationResult } from "express-validator";
import webpush from 'web-push';

// Configure web-push (in production, use environment variables)
// Only configure VAPID if environment variables are provided
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@gallobets.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('📱 VAPID configured for push notifications');
} else {
  console.warn('📱 VAPID keys not configured - push notifications will not work');
}

const router = Router();

// Temporary in-memory storage for subscriptions (use database in production)
const subscriptions = new Map();

// Subscribe to push notifications
router.post('/subscribe', authenticate, [
  body('subscription').isObject(),
  body('userId').isString().notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { subscription, userId } = req.body;
  
  // Store subscription (in production, save to database)
  subscriptions.set(userId, subscription);
  
  console.log(`📱 Push subscription registered for user ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Subscription registered successfully'
  });
}));

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  subscriptions.delete(userId);
  
  res.status(200).json({
    success: true,
    message: 'Unsubscribed successfully'
  });
}));

// Send push notification to specific user
router.post('/send', authenticate, authorize('admin', 'operator'), [
  body('userId').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('body').isString().notEmpty(),
  body('type').isIn(['betting_window_open', 'betting_window_close', 'fight_result', 'pago_proposal']),
  body('data').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, title, body, type, data } = req.body;
  
  const subscription = subscriptions.get(userId);
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'User subscription not found'
    });
  }

  const payload = JSON.stringify({
    title,
    body,
    data: {
      type,
      ...data
    }
  });

  try {
    await webpush.sendNotification(subscription, payload);
    
    console.log(`📱 Push notification sent to user ${userId}: ${type}`);
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Push notification failed:', error);
    
    // Remove invalid subscription
    if (error.statusCode === 410) {
      subscriptions.delete(userId);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
}));

// Send notification to multiple users (broadcast)
router.post('/broadcast', authenticate, authorize('admin'), [
  body('userIds').isArray().notEmpty(),
  body('title').isString().notEmpty(),
  body('body').isString().notEmpty(),
  body('type').isIn(['betting_window_open', 'betting_window_close', 'fight_result', 'system_maintenance']),
  body('data').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userIds, title, body, type, data } = req.body;
  
  const payload = JSON.stringify({
    title,
    body,
    data: {
      type,
      ...data
    }
  });

  const results = {
    sent: 0,
    failed: 0,
    invalidSubscriptions: []
  };

  const promises = userIds.map(async (userId) => {
    const subscription = subscriptions.get(userId);
    if (!subscription) {
      results.failed++;
      return;
    }

    try {
      await webpush.sendNotification(subscription, payload);
      results.sent++;
    } catch (error) {
      results.failed++;
      
      if (error.statusCode === 410) {
        subscriptions.delete(userId);
        results.invalidSubscriptions.push(userId);
      }
    }
  });

  await Promise.all(promises);

  console.log(`📱 Broadcast notification sent: ${results.sent} success, ${results.failed} failed`);

  res.status(200).json({
    success: true,
    message: 'Broadcast completed',
    results
  });
}));

// Get subscription status
router.get('/subscription/:userId', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const hasSubscription = subscriptions.has(userId);
  
  res.status(200).json({
    success: true,
    userId,
    hasSubscription,
    subscriptionCount: subscriptions.size
  });
}));

// List all subscriptions (admin only)
router.get('/subscriptions', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const subscriptionList = Array.from(subscriptions.keys()).map(userId => ({
    userId,
    subscribed: true
  }));

  res.status(200).json({
    success: true,
    totalSubscriptions: subscriptions.size,
    subscriptions: subscriptionList
  });
}));

export default router;