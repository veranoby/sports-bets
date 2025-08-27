import { Request, Response, NextFunction } from 'express';

// Feature flags configuration
interface FeatureFlags {
  betting: boolean;
  wallet: boolean;
  articles: boolean;
  ads: boolean;
  streaming: boolean;
}

// Get feature flags from environment variables
const getFeatureFlags = (): FeatureFlags => {
  return {
    betting: process.env.FEATURES_BETTING === 'true',
    wallet: process.env.FEATURES_WALLET === 'true', 
    articles: process.env.FEATURES_ARTICLES === 'true',
    ads: process.env.FEATURES_ADS === 'true',
    streaming: process.env.FEATURES_STREAMING === 'true'
  };
};

/**
 * Middleware to check if a specific feature is enabled
 */
export const requireFeature = (feature: keyof FeatureFlags) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const flags = getFeatureFlags();
    
    if (!flags[feature]) {
      return res.status(404).json({
        success: false,
        message: `Feature '${feature}' is not available`,
        code: 'FEATURE_DISABLED'
      });
    }
    
    next();
  };
};

/**
 * Middleware to add feature flags to request object
 */
export const addFeatureFlags = (req: Request, res: Response, next: NextFunction) => {
  req.featureFlags = getFeatureFlags();
  next();
};

/**
 * Route handler to get current feature flags
 */
export const getFeatureFlagsHandler = (req: Request, res: Response) => {
  const flags = getFeatureFlags();
  
  res.json({
    success: true,
    data: {
      features: flags
    }
  });
};

// Extend Request type to include feature flags
declare global {
  namespace Express {
    interface Request {
      featureFlags?: FeatureFlags;
    }
  }
}