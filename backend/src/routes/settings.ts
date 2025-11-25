// backend/src/routes/settings.ts
// API routes for system settings management
// Implements admin-only access with proper validation

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { body, validationResult, query } from 'express-validator';
import { Op } from 'sequelize';
import SystemSettingsService, { SystemSettingValue } from '../services/systemSettingsService';
import { SystemSetting as Setting } from '../models';

const router = Router();

// GET /api/settings - Get all settings (admin only)
router.get('/', 
  authenticate, 
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const settings = await SystemSettingsService.getAllSettings();
    res.json({
      success: true,
      data: settings
    });
  })
);

// GET /api/settings/category/:category - Get settings by category (admin only)
router.get('/category/:category',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { category } = req.params;
    
    // Validate category exists
    const categorySettings = await Setting.findAll({ where: { category } });
    if (categorySettings.length === 0) {
      throw errors.notFound(`No settings found for category: ${category}`);
    }
    
    const settings = await SystemSettingsService.getSettingsByCategory(category);
    res.json({
      success: true,
      data: settings
    });
  })
);

// GET /api/settings/public - Get public settings (authenticated users only)
router.get('/public',
  authenticate,
  asyncHandler(async (req, res) => {
    // Only return settings that are safe to expose to users
    const publicSettingsKeys = [
      'betting.active', // Whether betting is enabled
      'betting.min_amount', // Minimum bet amount
      'betting.max_amount', // Maximum bet amount
      'site.maintenance_mode', // Whether site is in maintenance
      'limits.deposit_min', // Minimum deposit amount
      'limits.deposit_max', // Maximum deposit amount
      'limits.deposit_max_daily', // Maximum daily deposits
      'limits.withdrawal_min', // Minimum withdrawal amount
      'limits.withdrawal_max', // Maximum withdrawal amount
      'limits.withdrawal_max_daily', // Maximum daily withdrawals
      'limits.require_proof_over' // Amount requiring proof
    ];
    
    const settings = await SystemSettingsService.getSpecificSettings(publicSettingsKeys);
    res.json({
      success: true,
      data: settings
    });
  })
);

// GET /api/settings/:key - Get specific setting by key (admin only)
router.get('/:key',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const value = await SystemSettingsService.getSettingValue(key);
    
    if (value === null) {
      throw errors.notFound(`Setting not found: ${key}`);
    }
    
    res.json({
      success: true,
      data: { [key]: value }
    });
  })
);

// PUT /api/settings/:key - Update specific setting (admin only)
router.put('/:key',
  authenticate,
  authorize('admin'),
  [
    body('value').notEmpty().withMessage('Setting value is required'),
    body('value').custom((value, { req }) => {
      // Validate value type based on key pattern
      const { key } = req.params;

      if (key.includes('.min') || key.includes('.max') || key.includes('.amount')) {
        if (typeof value !== 'number' || value < 0) {
          throw new Error('Amount settings must be positive numbers');
        }
      } else if (key.includes('.active') || key.includes('maintenance_mode')) {
        if (typeof value !== 'boolean') {
          throw new Error('Boolean settings must be true/false');
        }
      }

      return true;
    })
  ],
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    const updatedBy = req.user?.id;

    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    // Check if setting exists first
    const existingSetting = await Setting.findOne({ where: { key } });
    if (!existingSetting) {
      // If it doesn't exist, create it with a default category
      const category = key.split('.')[0] || 'general';
      await Setting.create({
        key,
        value,
        category,
        updated_by: updatedBy
      });
    } else {
      // Update existing setting
      await SystemSettingsService.updateSettingValue(key, value, updatedBy);
    }

    res.json({
      success: true,
      message: `Setting ${key} updated successfully`,
      data: { key, value }
    });
  })
);

// POST /api/settings/bulk-update - Update multiple settings at once (admin only)
router.post('/bulk-update',
  authenticate,
  authorize('admin'),
  [
    body('settings').isArray().withMessage('Settings must be an array'),
    body('settings.*.key').notEmpty().withMessage('Each setting must have a key'),
    body('settings.*.value').exists().withMessage('Each setting must have a value')
  ],
  asyncHandler(async (req, res) => {
    const { settings } = req.body;
    const updatedBy = req.user?.id;

    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    // Validate each setting's value based on its key
    for (const setting of settings) {
      const { key, value } = setting;
      
      if (key.includes('.min') || key.includes('.max') || key.includes('.amount')) {
        if (typeof value !== 'number' || value < 0) {
          throw errors.badRequest(`Setting ${key} must be a positive number`);
        }
      } else if (key.includes('.active') || key.includes('maintenance_mode')) {
        if (typeof value !== 'boolean') {
          throw errors.badRequest(`Setting ${key} must be a boolean`);
        }
      }
    }

    const settingsToUpdate = settings.map((setting: any) => ({
      key: setting.key,
      value: setting.value,
      updatedBy
    }));

    await SystemSettingsService.bulkUpdateSettings(settingsToUpdate);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  })
);

// GET /api/settings/search - Search settings (admin only)
router.get('/search',
  authenticate,
  authorize('admin'),
  [
    query('q').optional().isString().withMessage('Search query must be a string'),
    query('category').optional().isString().withMessage('Category must be a string')
  ],
  asyncHandler(async (req, res) => {
    const { q, category } = req.query;

    let where: any = {};
    if (category) {
      where.category = category;
    }
    
    if (q) {
      where.key = { [Op.iLike]: `%${q}%` };
    }

    const settings = await Setting.findAll({ where, order: [['category', 'ASC'], ['key', 'ASC']] });

    res.json({
      success: true,
      data: settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        description: setting.description,
        createdAt: setting.created_at,
        updatedAt: setting.updated_at,
        updatedBy: setting.updated_by
      }))
    });
  })
);

export default router;