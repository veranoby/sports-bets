"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var Migration_1 = __importDefault(require("./Migration"));
var logger_1 = require("../config/logger");
var AddPerformanceIndexes = /** @class */ (function (_super) {
    __extends(AddPerformanceIndexes, _super);
    function AddPerformanceIndexes() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.version = '2025-11-19-134000';
        _this.description = 'Add performance indexes for subscription lookups and membership requests filtering';
        return _this;
    }
    AddPerformanceIndexes.prototype.up = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Index 1: Optimize subscription lookups with ordering (for getLatestSubscription)
                        logger_1.logger.info('🔍 Creating idx_subscriptions_user_created index...');
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_created\n        ON subscriptions(user_id, created_at DESC)\n        WHERE user_id IS NOT NULL\n    ")];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('✅ idx_subscriptions_user_created created');
                        // Index 2: Optimize membership request filtering by status
                        logger_1.logger.info('🔍 Creating idx_membership_requests_status_requested index...');
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_requests_status_requested\n        ON membership_change_requests(status, requested_at DESC)\n        WHERE status IS NOT NULL\n    ")];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('✅ idx_membership_requests_status_requested created');
                        // Index 3: Support wallet transaction queries (future use - only if table exists)
                        logger_1.logger.info('🔍 Checking if wallet_transactions table exists...');
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_user_type_status\n          ON wallet_transactions(user_id, type, status)\n          WHERE user_id IS NOT NULL\n      ")];
                    case 4:
                        _a.sent();
                        logger_1.logger.info('✅ idx_wallet_transactions_user_type_status created');
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        logger_1.logger.warn('⚠️  wallet_transactions table does not exist yet - skipping index creation');
                        return [3 /*break*/, 6];
                    case 6:
                        logger_1.logger.info('✅ All performance indexes created successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    AddPerformanceIndexes.prototype.down = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Rollback: Drop all indexes created by this migration
                        logger_1.logger.info('🔍 Dropping performance indexes...');
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n      DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_user_created\n    ")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n      DROP INDEX CONCURRENTLY IF EXISTS idx_membership_requests_status_requested\n    ")];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n        DROP INDEX CONCURRENTLY IF EXISTS idx_wallet_transactions_user_type_status\n      ")];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        // Index may not exist if wallet_transactions table didn't exist
                        logger_1.logger.warn('⚠️  Could not drop wallet_transactions index (may not exist)');
                        return [3 /*break*/, 6];
                    case 6:
                        logger_1.logger.info('✅ All performance indexes dropped');
                        return [2 /*return*/];
                }
            });
        });
    };
    return AddPerformanceIndexes;
}(Migration_1.default));
exports.default = AddPerformanceIndexes;
