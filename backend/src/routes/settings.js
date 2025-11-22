"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var auth_1 = require("../middleware/auth");
var settingsService_1 = __importDefault(require("../services/settingsService"));
var express_validator_1 = require("express-validator");
var router = express_1.default.Router();
/**
 * GET /api/settings/features/public
 * Get current feature toggle status for dashboard (NO AUTH REQUIRED)
 */
router.get('/features/public', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var features, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = {};
                return [4 /*yield*/, settingsService_1.default.isBettingEnabled()];
            case 1:
                _a.betting_enabled = _b.sent();
                return [4 /*yield*/, settingsService_1.default.areWalletsEnabled()];
            case 2:
                _a.wallets_enabled = _b.sent();
                return [4 /*yield*/, settingsService_1.default.isStreamingEnabled()];
            case 3:
                _a.streaming_enabled = _b.sent();
                return [4 /*yield*/, settingsService_1.default.isMaintenanceMode()];
            case 4:
                features = (_a.maintenance_mode = _b.sent(),
                    _a);
                res.json({
                    success: true,
                    data: features,
                    message: 'Public feature status retrieved successfully'
                });
                return [3 /*break*/, 6];
            case 5:
                error_1 = _b.sent();
                console.error('❌ Error getting public feature status:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving public feature status'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Middleware: All other settings routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/settings/public
 * Get public settings (accessible to all authenticated users)
 */
router.get('/public', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var publicSettings, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, settingsService_1.default.getPublicSettings()];
            case 1:
                publicSettings = _a.sent();
                res.json({
                    success: true,
                    data: publicSettings,
                    message: 'Public settings retrieved successfully'
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('❌ Error getting public settings:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving public settings'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/settings/category/:category
 * Get all settings by category (admin only)
 */
router.get('/category/:category', (0, auth_1.authorize)('admin'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var category, settings, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                category = req.params.category;
                return [4 /*yield*/, settingsService_1.default.getByCategory(category)];
            case 1:
                settings = _a.sent();
                res.json({
                    success: true,
                    data: settings,
                    message: "Settings for category '".concat(category, "' retrieved successfully")
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("\u274C Error getting settings for category '".concat(req.params.category, "':"), error_3);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving category settings'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/settings/features/status
 * Get current feature toggle status (admin only)
 * TEMPORARY: Allow public access for testing dashboard
 */
router.get('/features/status', function (req, res, next) {
    // Skip auth for this endpoint temporarily
    next();
}, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var features, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = {};
                return [4 /*yield*/, settingsService_1.default.areWalletsEnabled()];
            case 1:
                _a.wallets_enabled = _b.sent();
                return [4 /*yield*/, settingsService_1.default.isBettingEnabled()];
            case 2:
                _a.betting_enabled = _b.sent();
                return [4 /*yield*/, settingsService_1.default.isStreamingEnabled()];
            case 3:
                _a.streaming_enabled = _b.sent();
                return [4 /*yield*/, settingsService_1.default.isMaintenanceMode()];
            case 4:
                features = (_a.maintenance_mode = _b.sent(),
                    _a);
                res.json({
                    success: true,
                    data: features,
                    message: 'Feature status retrieved successfully'
                });
                return [3 /*break*/, 6];
            case 5:
                error_4 = _b.sent();
                console.error('❌ Error getting feature status:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving feature status'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/settings/:key
 * Get specific setting by key (admin only)
 */
router.get('/:key', (0, auth_1.authorize)('admin'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var key, value, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                key = req.params.key;
                return [4 /*yield*/, settingsService_1.default.getSetting(key)];
            case 1:
                value = _b.sent();
                if (value === null) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: "Setting '".concat(key, "' not found")
                        })];
                }
                res.json({
                    success: true,
                    data: (_a = {}, _a[key] = value, _a),
                    message: 'Setting retrieved successfully'
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                console.error("\u274C Error getting setting '".concat(req.params.key, "':"), error_5);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving setting'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/settings
 * Get all settings (admin only)
 */
router.get('/', (0, auth_1.authorize)('admin'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allSettings, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, settingsService_1.default.getAllSettings()];
            case 1:
                allSettings = _a.sent();
                res.json({
                    success: true,
                    data: allSettings,
                    message: 'All settings retrieved successfully'
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('❌ Error getting all settings:', error_6);
                res.status(500).json({
                    success: false,
                    message: 'Error retrieving settings'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * PUT /api/settings/:key
 * Update specific setting by key (admin only)
 */
router.put('/:key', (0, auth_1.authorize)('admin'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var key, value, userId, result, error_7;
    var _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                key = req.params.key;
                value = req.body.value;
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                if (value === undefined) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Setting value is required'
                        })];
                }
                return [4 /*yield*/, settingsService_1.default.updateSetting(key, value, userId)];
            case 1:
                result = _c.sent();
                if (result[0] === 0) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: "Setting '".concat(key, "' not found")
                        })];
                }
                res.json({
                    success: true,
                    data: (_a = {}, _a[key] = value, _a),
                    message: "Setting '".concat(key, "' updated successfully")
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _c.sent();
                console.error("\u274C Error updating setting '".concat(req.params.key, "':"), error_7);
                res.status(400).json({
                    success: false,
                    message: error_7 instanceof Error ? error_7.message : 'Error updating setting'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * PUT /api/settings (Bulk update)
 * Bulk update multiple settings (admin only)
 */
router.put('/', (0, auth_1.authorize)('admin'), [
    (0, express_validator_1.body)().isObject(),
    (0, express_validator_1.body)('*.key').not().exists(), // a key should not be a property of the value object
], function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, settingsToUpdate, userId, results, _a, _b, _c, _i, key, error_8, updatedSettings, successCount, failureCount, error_9;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 8, , 9]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({ success: false, errors: errors.array() })];
                }
                settingsToUpdate = req.body;
                userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
                results = [];
                _a = settingsToUpdate;
                _b = [];
                for (_c in _a)
                    _b.push(_c);
                _i = 0;
                _e.label = 1;
            case 1:
                if (!(_i < _b.length)) return [3 /*break*/, 6];
                _c = _b[_i];
                if (!(_c in _a)) return [3 /*break*/, 5];
                key = _c;
                _e.label = 2;
            case 2:
                _e.trys.push([2, 4, , 5]);
                return [4 /*yield*/, settingsService_1.default.updateSetting(key, settingsToUpdate[key], userId)];
            case 3:
                _e.sent();
                results.push({
                    key: key,
                    success: true,
                    message: 'Updated successfully'
                });
                return [3 /*break*/, 5];
            case 4:
                error_8 = _e.sent();
                results.push({
                    key: key,
                    success: false,
                    message: error_8 instanceof Error ? error_8.message : 'Update failed'
                });
                return [3 /*break*/, 5];
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [4 /*yield*/, settingsService_1.default.getAllSettings()];
            case 7:
                updatedSettings = _e.sent();
                successCount = results.filter(function (r) { return r.success; }).length;
                failureCount = results.filter(function (r) { return !r.success; }).length;
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
                    message: "Bulk update completed: ".concat(successCount, " successful, ").concat(failureCount, " failed")
                });
                return [3 /*break*/, 9];
            case 8:
                error_9 = _e.sent();
                console.error('❌ Error in bulk settings update:', error_9);
                res.status(500).json({
                    success: false,
                    message: 'Error in bulk settings update'
                });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
