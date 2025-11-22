#!/usr/bin/env node
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
var MigrationRunner_1 = require("../migrations/MigrationRunner");
var logger_1 = require("../config/logger");
var command = process.argv[2];
var argument = process.argv[3];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var runner, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    runner = new MigrationRunner_1.MigrationRunner();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 12, , 13]);
                    _a = command;
                    switch (_a) {
                        case 'up': return [3 /*break*/, 2];
                        case 'migrate': return [3 /*break*/, 2];
                        case 'down': return [3 /*break*/, 4];
                        case 'rollback': return [3 /*break*/, 4];
                        case 'status': return [3 /*break*/, 6];
                        case 'init': return [3 /*break*/, 8];
                    }
                    return [3 /*break*/, 10];
                case 2:
                    logger_1.logger.info('🚀 Running migrations...');
                    return [4 /*yield*/, runner.migrate()];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 4:
                    logger_1.logger.info('🔄 Rolling back migrations...');
                    return [4 /*yield*/, runner.rollback(argument)];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 6: return [4 /*yield*/, runner.status()];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 8:
                    logger_1.logger.info('🏗️  Initializing migration system...');
                    return [4 /*yield*/, runner.initialize()];
                case 9:
                    _b.sent();
                    logger_1.logger.info('✅ Migration system initialized');
                    return [3 /*break*/, 11];
                case 10:
                    console.log("\n\uD83C\uDFD7\uFE0F  Sports Bets Migration Tool\n\nUsage: npm run migrate <command> [options]\n\nCommands:\n  up, migrate     Run all pending migrations\n  down, rollback  Rollback migrations (optionally to specific version)\n  status          Show migration status\n  init            Initialize migration system\n\nExamples:\n  npm run migrate up\n  npm run migrate status  \n  npm run migrate rollback\n  npm run migrate rollback 2024-01-01-000001\n  npm run migrate init\n\n\u26A0\uFE0F  PRODUCTION SAFETY:\n- Always backup your database before running migrations\n- Test migrations in staging environment first\n- Never use Sequelize sync in production\n        ");
                    process.exit(1);
                    _b.label = 11;
                case 11:
                    logger_1.logger.info('🎉 Migration command completed successfully');
                    process.exit(0);
                    return [3 /*break*/, 13];
                case 12:
                    error_1 = _b.sent();
                    logger_1.logger.error('❌ Migration command failed:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
main();
