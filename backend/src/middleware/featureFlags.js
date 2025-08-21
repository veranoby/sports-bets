"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeatureFlagsHandler = exports.addFeatureFlags = exports.requireFeature = void 0;
// Get feature flags from environment variables
const getFeatureFlags = () => {
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
const requireFeature = (feature) => {
    return (req, res, next) => {
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
exports.requireFeature = requireFeature;
/**
 * Middleware to add feature flags to request object
 */
const addFeatureFlags = (req, res, next) => {
    req.featureFlags = getFeatureFlags();
    next();
};
exports.addFeatureFlags = addFeatureFlags;
/**
 * Route handler to get current feature flags
 */
const getFeatureFlagsHandler = (req, res) => {
    const flags = getFeatureFlags();
    res.json({
        success: true,
        data: {
            features: flags
        }
    });
};
exports.getFeatureFlagsHandler = getFeatureFlagsHandler;
