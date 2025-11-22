"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFeatureFlags = void 0;
var react_1 = require("react");
var useFeatureFlags = function () {
    return (0, react_1.useMemo)(function () { return ({
        isBettingEnabled: import.meta.env.VITE_FEATURES_BETTING === "true",
        isWalletEnabled: import.meta.env.VITE_FEATURES_WALLET === "true",
        isArticlesEnabled: import.meta.env.VITE_FEATURES_ARTICLES === "true",
        isAdsEnabled: import.meta.env.VITE_FEATURES_ADS === "true",
    }); }, []);
};
exports.useFeatureFlags = useFeatureFlags;
