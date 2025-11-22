"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
exports.validateEnvironment = validateEnvironment;
exports.logEnvironmentStatus = logEnvironmentStatus;
var joi_1 = __importDefault(require("joi"));
var dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
var envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().port().default(3001),
    // Critical configuration
    DATABASE_URL: joi_1.default.string()
        .uri({ scheme: ['postgresql', 'postgres'] })
        .required()
        .messages({
        'any.required': 'DATABASE_URL is required. Check your .env file and Neon.tech connection string.',
        'string.uri': 'DATABASE_URL must be a valid PostgreSQL connection string.'
    }),
    JWT_SECRET: joi_1.default.string()
        .min(8)
        .required()
        .messages({
        'any.required': 'JWT_SECRET is required for authentication. Set a secure secret in .env file.',
        'string.min': 'JWT_SECRET must be at least 8 characters long.'
    }),
    JWT_EXPIRES_IN: joi_1.default.string().default('7d'),
    FRONTEND_URL: joi_1.default.string()
        .uri({ scheme: ['http', 'https'] })
        .default('http://localhost:5174'),
    // Streaming configuration
    STREAM_SERVER_URL: joi_1.default.string()
        .uri({ scheme: ['rtmp', 'rtmps'] })
        .default('rtmp://localhost:1935/live'),
    STREAM_HEALTH_CHECK_URL: joi_1.default.string()
        .uri({ scheme: ['http', 'https'] })
        .default('http://localhost:8080'),
    // Business configuration
    SUBSCRIPTION_DAILY_PRICE: joi_1.default.number().positive().default(2.99),
    SUBSCRIPTION_MONTHLY_PRICE: joi_1.default.number().positive().default(9.99),
    MAX_BET_AMOUNT: joi_1.default.number().positive().default(10000),
    MIN_BET_AMOUNT: joi_1.default.number().positive().default(10),
    MAX_WITHDRAWAL_DAILY: joi_1.default.number().positive().default(500),
    // Development configuration
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    ENABLE_CORS: joi_1.default.boolean().default(true),
    TRUST_PROXY: joi_1.default.boolean().default(false),
}).unknown(); // Allow unknown environment variables
/**
 * Validate environment variables on startup
 */
function validateEnvironment() {
    var _a = envSchema.validate(process.env), error = _a.error, value = _a.value;
    if (error) {
        var errorMessage = "\u274C Environment validation failed:\n".concat(error.details.map(function (detail) { return "  - ".concat(detail.message); }).join('\n'));
        console.error('\n🔧 ENVIRONMENT CONFIGURATION ERROR');
        console.error('=====================================');
        console.error(errorMessage);
        console.error('\n💡 Common solutions:');
        console.error('  1. Check your .env file exists in backend/ directory');
        console.error('  2. Verify DATABASE_URL from Neon.tech is correct');
        console.error('  3. Ensure JWT_SECRET is set (minimum 8 characters)');
        console.error('  4. Run: cp .env.example .env (if .env.example exists)\n');
        process.exit(1);
    }
    return value;
}
/**
 * Get validated environment configuration
 */
exports.envConfig = validateEnvironment();
/**
 * Log environment status for debugging
 */
function logEnvironmentStatus() {
    console.log('\n🔧 Environment Configuration Status:');
    console.log('===================================');
    console.log("\uD83D\uDCCD Node Environment: ".concat(exports.envConfig.NODE_ENV));
    console.log("\uD83C\uDF10 Server Port: ".concat(exports.envConfig.PORT));
    console.log("\uD83D\uDDC4\uFE0F  Database: ".concat(exports.envConfig.DATABASE_URL.includes('neon.tech') ? '✅ Neon.tech' : '⚠️ Custom DB'));
    console.log("\uD83D\uDD10 JWT Secret: ".concat(exports.envConfig.JWT_SECRET ? '✅ Configured' : '❌ Missing'));
    console.log("\uD83C\uDFA5 Streaming: ".concat(exports.envConfig.STREAM_SERVER_URL));
    console.log("\uD83D\uDCB0 Bet Limits: $".concat(exports.envConfig.MIN_BET_AMOUNT, " - $").concat(exports.envConfig.MAX_BET_AMOUNT));
    console.log("\uD83D\uDCCA Log Level: ".concat(exports.envConfig.LOG_LEVEL));
    console.log('');
}
