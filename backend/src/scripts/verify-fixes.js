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
Object.defineProperty(exports, "__esModule", { value: true });
var database_1 = require("../config/database");
var sequelize_1 = require("sequelize");
function verify() {
    return __awaiter(this, void 0, void 0, function () {
        var userResult, subCount, settings, indexes, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 8]);
                    console.log('\n🔍 VERIFICATION REPORT - Performance Fixes\n');
                    console.log('='.repeat(60));
                    return [4 /*yield*/, database_1.sequelize.query("SELECT u.id, u.username, u.role, s.id as sub_id, s.type, s.status, s.expires_at, s.created_at\n       FROM users u\n       LEFT JOIN subscriptions s ON u.id = s.user_id\n       WHERE u.username = 'user_test2'\n       ORDER BY s.created_at DESC", { type: sequelize_1.QueryTypes.SELECT })];
                case 1:
                    userResult = _a.sent();
                    console.log('\n📊 USER_TEST2 & SUBSCRIPTIONS:');
                    console.log(JSON.stringify(userResult, null, 2));
                    return [4 /*yield*/, database_1.sequelize.query("SELECT COUNT(*) as total FROM subscriptions", { type: sequelize_1.QueryTypes.SELECT })];
                case 2:
                    subCount = _a.sent();
                    console.log('\n📊 TOTAL SUBSCRIPTIONS:', subCount[0].total);
                    return [4 /*yield*/, database_1.sequelize.query("SELECT key, value FROM system_settings WHERE key LIKE 'enable_%'", { type: sequelize_1.QueryTypes.SELECT })];
                case 3:
                    settings = _a.sent();
                    console.log('\n⚙️ SYSTEM SETTINGS (enable_*):');
                    console.log(JSON.stringify(settings, null, 2));
                    return [4 /*yield*/, database_1.sequelize.query("SELECT indexname FROM pg_indexes\n       WHERE tablename IN ('subscriptions', 'membership_change_requests')\n       AND indexname LIKE 'idx_%'\n       ORDER BY indexname", { type: sequelize_1.QueryTypes.SELECT })];
                case 4:
                    indexes = _a.sent();
                    console.log('\n🔍 PERFORMANCE INDEXES CREATED:');
                    console.log(JSON.stringify(indexes, null, 2));
                    console.log('\n' + '='.repeat(60));
                    console.log('✅ VERIFICATION COMPLETE\n');
                    return [3 /*break*/, 8];
                case 5:
                    error_1 = _a.sent();
                    console.error('❌ Error:', error_1.message);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, database_1.sequelize.close()];
                case 7:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
verify();
