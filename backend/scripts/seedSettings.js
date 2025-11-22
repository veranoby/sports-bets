"use strict";
// Script para inicializar configuraciones por defecto en la base de datos
// Ejecutar: npx ts-node scripts/seedSettings.ts
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
var sequelize_1 = require("sequelize");
var dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
// Configuración de la base de datos usando DATABASE_URL
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
var sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false,
    pool: {
        max: 10,
        min: 0,
        acquire: 120000,
        idle: 10000
    }
});
var defaultSettings = [
    {
        key: 'enable_betting',
        value: JSON.stringify(true),
        type: 'boolean',
        category: 'features',
        description: 'Habilita/deshabilita el sistema de apuestas',
        is_public: false
    },
    {
        key: 'enable_wallets',
        value: JSON.stringify(true),
        type: 'boolean',
        category: 'features',
        description: 'Habilita/deshabilita el sistema de billeteras',
        is_public: false
    },
    {
        key: 'enable_streaming',
        value: JSON.stringify(true),
        type: 'boolean',
        category: 'features',
        description: 'Habilita/deshabilita las funciones de streaming',
        is_public: false
    },
    {
        key: 'maintenance_mode',
        value: JSON.stringify(false),
        type: 'boolean',
        category: 'system',
        description: 'Habilita el modo de mantenimiento',
        is_public: true
    },
    {
        key: 'enable_push_notifications',
        value: JSON.stringify(true),
        type: 'boolean',
        category: 'features',
        description: 'Habilita/deshabilita las notificaciones push',
        is_public: false
    },
    {
        key: 'commission_percentage',
        value: JSON.stringify(5.0),
        type: 'number',
        category: 'business',
        description: 'Porcentaje de comisión de la plataforma',
        is_public: false
    },
    {
        key: 'min_bet_amount',
        value: JSON.stringify(10),
        type: 'number',
        category: 'business',
        description: 'Monto mínimo permitido para una apuesta',
        is_public: true
    },
    {
        key: 'max_bet_amount',
        value: JSON.stringify(10000),
        type: 'number',
        category: 'business',
        description: 'Monto máximo permitido para una apuesta',
        is_public: true
    }
];
function seedSettings() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, defaultSettings_1, setting, query, error_1, results, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, 10, 12]);
                    console.log('🔗 Conectando a la base de datos...');
                    return [4 /*yield*/, sequelize.authenticate()];
                case 1:
                    _a.sent();
                    console.log('✅ Conexión establecida exitosamente');
                    console.log('🌱 Insertando configuraciones por defecto...');
                    _i = 0, defaultSettings_1 = defaultSettings;
                    _a.label = 2;
                case 2:
                    if (!(_i < defaultSettings_1.length)) return [3 /*break*/, 7];
                    setting = defaultSettings_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    query = "\n          INSERT INTO system_settings (key, value, type, category, description, is_public, created_at, updated_at)\n          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())\n          ON CONFLICT (key) DO NOTHING\n        ";
                    return [4 /*yield*/, sequelize.query(query, {
                            bind: [
                                setting.key,
                                setting.value,
                                setting.type,
                                setting.category,
                                setting.description,
                                setting.is_public
                            ]
                        })];
                case 4:
                    _a.sent();
                    console.log("\u2705 Setting creado/actualizado: ".concat(setting.key, " = ").concat(setting.value));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error("\u274C Error insertando ".concat(setting.key, ":"), error_1);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    console.log('🎉 Settings inicializados exitosamente');
                    // Verificar que se insertaron
                    console.log('\n📊 Verificando settings en base de datos:');
                    return [4 /*yield*/, sequelize.query('SELECT key, value, type FROM system_settings ORDER BY key')];
                case 8:
                    results = (_a.sent())[0];
                    results.forEach(function (row) {
                        console.log("  ".concat(row.key, ": ").concat(row.value, " (").concat(row.type, ")"));
                    });
                    return [3 /*break*/, 12];
                case 9:
                    error_2 = _a.sent();
                    console.error('❌ Error:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, sequelize.close()];
                case 11:
                    _a.sent();
                    console.log('🔌 Conexión cerrada');
                    process.exit(0);
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// Ejecutar el script
seedSettings();
