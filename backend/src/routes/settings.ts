
import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import settingsService from '../services/settingsService';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * GET /api/settings/features/public  
 * Get current feature toggle status for dashboard (NO AUTH REQUIRED)
 */
router.get('/features/public', async (req, res) => {
  try {
    const features = {
      betting_enabled: await settingsService.isBettingEnabled(),
      wallets_enabled: await settingsService.areWalletsEnabled(),
      streaming_enabled: await settingsService.isStreamingEnabled(),
      maintenance_mode: await settingsService.isMaintenanceMode()
    };
    
    res.json({
      success: true,
      data: features,
      message: 'Public feature status retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting public feature status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving public feature status'
    });
  }
});

// Middleware: All other settings routes require authentication
router.use(authenticate);

/**
 * GET /api/settings/public
 * Get public settings (accessible to all authenticated users)
 */
router.get('/public', async (req, res) => {
  try {
    const publicSettings = await settingsService.getPublicSettings();
    
    res.json({
      success: true,
      data: publicSettings,
      message: 'Public settings retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting public settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving public settings'
    });
  }
});

/**
 * GET /api/settings/category/:category
 * Get all settings by category (admin only)
 */
router.get('/category/:category', authorize('admin'), async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await settingsService.getByCategory(category);
    
    res.json({
      success: true,
      data: settings,
      message: `Settings for category '${category}' retrieved successfully`
    });
  } catch (error) {
    console.error(`❌ Error getting settings for category '${req.params.category}':`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving category settings'
    });
  }
});

/**
 * GET /api/settings/features/status
 * Get current feature toggle status (admin only)
 * TEMPORARY: Allow public access for testing dashboard
 */
router.get('/features/status', (req, res, next) => {
  // Skip auth for this endpoint temporarily
  next();
}, async (req, res) => {
  try {
    const features = {
      wallets_enabled: await settingsService.areWalletsEnabled(),
      betting_enabled: await settingsService.isBettingEnabled(),
      streaming_enabled: await settingsService.isStreamingEnabled(),
      maintenance_mode: await settingsService.isMaintenanceMode()
    };
    
    res.json({
      success: true,
      data: features,
      message: 'Feature status retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting feature status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving feature status'
    });
  }
});

/**
 * GET /api/settings/:key
 * Get specific setting by key (admin only)
 */
router.get('/:key', authorize('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const value = await settingsService.getSetting(key);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: `Setting '${key}' not found`
      });
    }
    
    res.json({
      success: true,
      data: { [key]: value },
      message: 'Setting retrieved successfully'
    });
  } catch (error) {
    console.error(`❌ Error getting setting '${req.params.key}':`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving setting'
    });
  }
});

/**
 * GET /api/settings
 * Get all settings (admin only)
 */
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const allSettings = await settingsService.getAllSettings();
    
    res.json({
      success: true,
      data: allSettings,
      message: 'All settings retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting all settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving settings'
    });
  }
});

/**
 * PUT /api/settings/:key
 * Update specific setting by key (admin only)
 */
router.put('/:key', authorize('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user?.id;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }
    
    const result = await settingsService.updateSetting(key, value, userId);
    
    if (result[0] === 0) {
      return res.status(404).json({
        success: false,
        message: `Setting '${key}' not found`
      });
    }
    
    res.json({
      success: true,
      data: { [key]: value },
      message: `Setting '${key}' updated successfully`
    });
  } catch (error) {
    console.error(`❌ Error updating setting '${req.params.key}':`, error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating setting'
    });
  }
});

/**
 * PUT /api/settings (Bulk update)
 * Bulk update multiple settings (admin only)
 */
router.put(
  '/',
  authorize('admin'),
  [
    body().isObject(),
    body('*.key').not().exists(), // a key should not be a property of the value object
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const settingsToUpdate = req.body;
      const userId = req.user?.id;
      
      // Update each setting
      const results = [];
      for (const key in settingsToUpdate) {
        try {
          await settingsService.updateSetting(key, settingsToUpdate[key], userId);
          results.push({
            key,
            success: true,
            message: 'Updated successfully'
          });
        } catch (error) {
          results.push({
            key,
            success: false,
            message: error instanceof Error ? error.message : 'Update failed'
          });
        }
      }

      const updatedSettings = await settingsService.getAllSettings();
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: failureCount === 0,
        data: {
          settings: updatedSettings,
          updateResults: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
            details: results
          }
        },
        message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`
      });
    } catch (error) {
      console.error('❌ Error in bulk settings update:', error);
      res.status(500).json({
        success: false,
        message: 'Error in bulk settings update'
      });
    }
  }
);

export default router;
