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
var RestructureSubscriptionsMetadata = /** @class */ (function (_super) {
    __extends(RestructureSubscriptionsMetadata, _super);
    function RestructureSubscriptionsMetadata() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.version = '2025-11-19-133000';
        _this.description = 'Restructure subscriptions metadata - move Kushki payment fields and admin data to metadata object';
        return _this;
    }
    RestructureSubscriptionsMetadata.prototype.up = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var verification, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Step 1: Move payment fields to metadata.payment
                        logger_1.logger.info('📦 Moving payment fields to metadata.payment...');
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n      UPDATE subscriptions\n      SET metadata = jsonb_set(\n        COALESCE(metadata::jsonb, '{}'::jsonb),\n        '{payment}',\n        jsonb_build_object(\n          'kushkiSubscriptionId', kushki_subscription_id,\n          'nextBillingDate', next_billing_date::text,\n          'retryCount', retry_count,\n          'maxRetries', max_retries,\n          'cancelledAt', cancelled_at::text,\n          'cancelReason', cancel_reason,\n          'paymentMethod', payment_method::text\n        )\n      )\n    ")];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('✅ Payment fields moved to metadata.payment');
                        // Step 2: Move admin data to metadata.admin
                        logger_1.logger.info('👤 Moving admin fields to metadata.admin...');
                        return [4 /*yield*/, context.queryInterface.sequelize.query("\n      UPDATE subscriptions\n      SET metadata = jsonb_set(\n        COALESCE(metadata::jsonb, '{}'::jsonb),\n        '{admin}',\n        jsonb_build_object(\n          'assignedByAdminId', assigned_by_admin_id::text,\n          'assignedUsername', assigned_username\n        )\n      )\n      WHERE assigned_by_admin_id IS NOT NULL OR assigned_username IS NOT NULL\n    ")];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('✅ Admin fields moved to metadata.admin');
                        return [4 /*yield*/, context.queryInterface.sequelize.query("SELECT\n        COUNT(*) as total,\n        SUM(CASE WHEN metadata -> 'payment' IS NOT NULL THEN 1 ELSE 0 END) as with_payment,\n        SUM(CASE WHEN metadata -> 'admin' IS NOT NULL THEN 1 ELSE 0 END) as with_admin\n      FROM subscriptions", { raw: true })];
                    case 3:
                        verification = _a.sent();
                        result = verification[0];
                        logger_1.logger.info("\n    \u2705 Migration Complete!\n    \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n    Total subscriptions: ".concat(result.total, "\n    With payment metadata: ").concat(result.with_payment, "\n    With admin metadata: ").concat(result.with_admin, "\n\n    \u26A0\uFE0F  Note: Original columns preserved for backward compatibility.\n    They can be dropped in a future migration.\n    "));
                        return [2 /*return*/];
                }
            });
        });
    };
    RestructureSubscriptionsMetadata.prototype.down = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Rollback: Nothing to do - original columns still exist
                // Data in metadata.payment can be restored to columns if needed
                logger_1.logger.info('⚠️  Rollback: Metadata structure preserved. No data was lost.');
                return [2 /*return*/];
            });
        });
    };
    return RestructureSubscriptionsMetadata;
}(Migration_1.default));
exports.default = RestructureSubscriptionsMetadata;
