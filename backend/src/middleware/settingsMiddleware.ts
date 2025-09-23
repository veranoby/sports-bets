import { Request, Response, NextFunction } from 'express';
import settingsService from '../services/settingsService';

// Extend Express Request interface to include settings
declare global {
  namespace Express {
    interface Request {
      settings?: Record<string, any>;
    }
  }
}

/**
 * Middleware to inject settings into request object
 * Makes settings available as req.settings throughout the request lifecycle
 */
export const injectSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all settings and attach to request
    const settings = await settingsService.getAllSettings();
    req.settings = settings || {};
    
    next();
  } catch (error) {
    console.error('❌ Error injecting settings:', error);
    // Continue without settings rather than blocking the request
    req.settings = {};
    next();
  }
};

// ⚡ CRITICAL OPTIMIZATION: Ultra-aggressive caching for public settings middleware
let cachedPublicSettings: Record<string, any> | null = null;
let publicSettingsCacheExpires = 0;
const PUBLIC_SETTINGS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in memory

/**
 * Middleware to inject only public settings
 * Used for endpoints accessible to non-admin users
 * ⚡ OPTIMIZED: Ultra-fast memory cache to prevent database hits on every request
 */
export const injectPublicSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ⚡ CRITICAL: Check memory cache first to avoid database hit on every request
    const now = Date.now();
    if (cachedPublicSettings && now < publicSettingsCacheExpires) {
      req.settings = cachedPublicSettings;
      next();
      return;
    }

    // Only fetch from database/cache if memory cache is expired
    const publicSettings = await settingsService.getPublicSettings();

    // ⚡ CRITICAL: Cache in memory for 5 minutes to avoid repeated DB calls
    cachedPublicSettings = publicSettings;
    publicSettingsCacheExpires = now + PUBLIC_SETTINGS_CACHE_DURATION;

    req.settings = publicSettings;

    next();
  } catch (error) {
    console.error('❌ Error injecting public settings:', error);
    // ⚡ FALLBACK: Use cached settings if available, even if expired
    req.settings = cachedPublicSettings || {};
    next();
  }
};

/**
 * Feature gate middleware - blocks requests if feature is disabled
 */
export const requireFeature = (featureKey: string, errorMessage?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isEnabled = await settingsService.isFeatureEnabled(featureKey);
      
      if (!isEnabled) {
        return res.status(503).json({
          success: false,
          message: errorMessage || `Feature '${featureKey}' is currently disabled`,
          code: 'FEATURE_DISABLED'
        });
      }
      
      next();
    } catch (error) {
      console.error(`❌ Error checking feature '${featureKey}':`, error);
      return res.status(500).json({
        success: false,
        message: 'Error checking feature availability',
        code: 'FEATURE_CHECK_ERROR'
      });
    }
  };
};

// ⚡ CRITICAL OPTIMIZATION: Ultra-aggressive caching for maintenance mode check
let cachedMaintenanceMode: boolean | null = null;
let maintenanceModeCacheExpires = 0;
const MAINTENANCE_MODE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in memory

/**
 * Maintenance mode middleware - blocks all requests during maintenance
 * ⚡ OPTIMIZED: Ultra-fast memory cache to prevent database hits on every request
 */
export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip maintenance check for health endpoint and settings management
    if (req.path === '/health' || req.path.startsWith('/api/settings')) {
      return next();
    }

    // ⚡ CRITICAL: Check memory cache first to avoid database hit on every request
    const now = Date.now();
    let isMaintenanceMode: boolean;

    if (cachedMaintenanceMode !== null && now < maintenanceModeCacheExpires) {
      isMaintenanceMode = cachedMaintenanceMode;
      console.log('🧠 Memory cache hit for key: maintenance_mode');
    } else {
      // Only fetch from database/cache if memory cache is expired
      isMaintenanceMode = await settingsService.isMaintenanceMode();

      // ⚡ CRITICAL: Cache in memory for 2 minutes to avoid repeated DB calls
      cachedMaintenanceMode = isMaintenanceMode;
      maintenanceModeCacheExpires = now + MAINTENANCE_MODE_CACHE_DURATION;
      console.log('🔍 Database fetch for key: maintenance_mode');
    }

    if (isMaintenanceMode) {
      return res.status(503).json({
        success: false,
        message: 'Platform is currently under maintenance. Please try again later.',
        code: 'MAINTENANCE_MODE'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error checking maintenance mode:', error);
    // ⚡ FALLBACK: Continue on error to avoid blocking all requests (assume not in maintenance)
    next();
  }
};

/**
 * Specific feature gate middlewares for common features
 */
export const requireWallets = requireFeature('enable_wallets', 'Wallet system is currently disabled');
export const requireBetting = requireFeature('enable_betting', 'Betting system is currently disabled');
export const requireStreaming = requireFeature('enable_streaming', 'Streaming system is currently disabled');

/**
 * Settings-aware rate limiting
 * Uses settings to dynamically adjust rate limits
 */
export const settingsAwareRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rateLimitSetting = await settingsService.getSetting('api_rate_limit');
    const rateLimit = rateLimitSetting || 100; // Default 100 requests per minute
    
    // Add rate limit info to headers
    res.set('X-RateLimit-Limit', rateLimit.toString());
    
    // Note: Actual rate limiting logic would need to be implemented
    // This is just a placeholder for settings-aware rate limiting
    next();
  } catch (error) {
    console.error('❌ Error in settings-aware rate limit:', error);
    next();
  }
};

/**
 * Business rules middleware
 * Enforces business rules based on settings
 */
export const enforceBetLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.method === 'POST' && req.body.amount) {
      const minBetAmount = await settingsService.getSetting('min_bet_amount') || 1;
      const maxBetAmount = await settingsService.getSetting('max_bet_amount') || 10000;
      
      const betAmount = parseFloat(req.body.amount);
      
      if (betAmount < minBetAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum bet amount is ${minBetAmount}`,
          code: 'BET_AMOUNT_TOO_LOW'
        });
      }
      
      if (betAmount > maxBetAmount) {
        return res.status(400).json({
          success: false,
          message: `Maximum bet amount is ${maxBetAmount}`,
          code: 'BET_AMOUNT_TOO_HIGH'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Error enforcing bet limits:', error);
    next();
  }
};

/**
 * Streaming limits middleware
 * Enforces streaming-related limits from settings
 */
export const enforceStreamingLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maxViewers = await settingsService.getSetting('max_viewers_per_stream') || 1000;
    const maxStreams = await settingsService.getSetting('max_concurrent_streams') || 10;
    
    // Add streaming limits to request for use by streaming services
    req.settings = req.settings || {};
    req.settings.maxViewersPerStream = maxViewers;
    req.settings.maxConcurrentStreams = maxStreams;
    
    next();
  } catch (error) {
    console.error('❌ Error enforcing streaming limits:', error);
    next();
  }
};

/**
 * Commission calculation middleware
 * Adds commission settings to request for payment processing
 */
export const injectCommissionSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commissionPercentage = await settingsService.getSetting('commission_percentage') || 5;
    const autoApprovalThreshold = await settingsService.getSetting('auto_approval_threshold') || 100;
    
    req.settings = req.settings || {};
    req.settings.commissionPercentage = commissionPercentage;
    req.settings.autoApprovalThreshold = autoApprovalThreshold;
    
    next();
  } catch (error) {
    console.error('❌ Error injecting commission settings:', error);
    next();
  }
};

export default {
  injectSettings,
  injectPublicSettings,
  requireFeature,
  checkMaintenanceMode,
  requireWallets,
  requireBetting,
  requireStreaming,
  settingsAwareRateLimit,
  enforceBetLimits,
  enforceStreamingLimits,
  injectCommissionSettings
};