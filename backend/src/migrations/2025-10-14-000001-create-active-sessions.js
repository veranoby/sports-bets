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
var CreateActiveSessionsMigration = /** @class */ (function (_super) {
    __extends(CreateActiveSessionsMigration, _super);
    function CreateActiveSessionsMigration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.version = '2025-10-14-000001';
        _this.description = 'Create active_sessions table for session tracking and concurrent login prevention';
        return _this;
    }
    CreateActiveSessionsMigration.prototype.validate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Always return true - we'll handle table existence check in up()
                return [2 /*return*/, true];
            });
        });
    };
    CreateActiveSessionsMigration.prototype.up = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var queryInterface, Sequelize, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryInterface = context.queryInterface, Sequelize = context.Sequelize;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, queryInterface.describeTable('active_sessions')];
                    case 2:
                        _a.sent();
                        console.log('⚠️  active_sessions table already exists - skipping creation');
                        return [2 /*return*/];
                    case 3:
                        error_1 = _a.sent();
                        // Table doesn't exist, proceed with creation
                        console.log('✅ Creating active_sessions table...');
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, queryInterface.createTable('active_sessions', {
                            id: {
                                type: Sequelize.UUID,
                                defaultValue: Sequelize.UUIDV4,
                                primaryKey: true,
                            },
                            user_id: {
                                type: Sequelize.UUID,
                                allowNull: false,
                                references: {
                                    model: 'users',
                                    key: 'id',
                                },
                                onDelete: 'CASCADE',
                            },
                            session_token: {
                                type: Sequelize.STRING(255),
                                allowNull: false,
                                unique: true,
                            },
                            device_fingerprint: {
                                type: Sequelize.STRING(255),
                                allowNull: true,
                            },
                            ip_address: {
                                type: Sequelize.INET,
                                allowNull: true,
                            },
                            user_agent: {
                                type: Sequelize.TEXT,
                                allowNull: true,
                            },
                            created_at: {
                                type: Sequelize.DATE,
                                allowNull: false,
                                defaultValue: Sequelize.NOW,
                            },
                            last_activity: {
                                type: Sequelize.DATE,
                                allowNull: false,
                                defaultValue: Sequelize.NOW,
                            },
                            expires_at: {
                                type: Sequelize.DATE,
                                allowNull: false,
                            },
                            is_active: {
                                type: Sequelize.BOOLEAN,
                                allowNull: false,
                                defaultValue: true,
                            },
                        })];
                    case 5:
                        _a.sent();
                        // Create indexes for performance
                        return [4 /*yield*/, queryInterface.addIndex('active_sessions', ['user_id', 'is_active'], {
                                name: 'idx_active_sessions_user_active',
                            })];
                    case 6:
                        // Create indexes for performance
                        _a.sent();
                        return [4 /*yield*/, queryInterface.addIndex('active_sessions', ['session_token'], {
                                name: 'idx_active_sessions_token',
                                unique: true,
                            })];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, queryInterface.addIndex('active_sessions', ['expires_at'], {
                                name: 'idx_active_sessions_expires',
                            })];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, queryInterface.addIndex('active_sessions', ['device_fingerprint'], {
                                name: 'idx_active_sessions_device',
                            })];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, queryInterface.addIndex('active_sessions', ['ip_address'], {
                                name: 'idx_active_sessions_ip',
                            })];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, queryInterface.addIndex('active_sessions', ['last_activity'], {
                                name: 'idx_active_sessions_activity',
                            })];
                    case 11:
                        _a.sent();
                        console.log('✅ Created active_sessions table with indexes');
                        return [2 /*return*/];
                }
            });
        });
    };
    CreateActiveSessionsMigration.prototype.down = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var queryInterface;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryInterface = context.queryInterface;
                        return [4 /*yield*/, queryInterface.dropTable('active_sessions')];
                    case 1:
                        _a.sent();
                        console.log('✅ Dropped active_sessions table');
                        return [2 /*return*/];
                }
            });
        });
    };
    return CreateActiveSessionsMigration;
}(Migration_1.default));
exports.default = CreateActiveSessionsMigration;
