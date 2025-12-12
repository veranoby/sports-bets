import Joi from 'joi';
import { config } from 'dotenv';

// Load environment variables
config();

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
  
  // Streaming configuration
  STREAM_SERVER_URL: string;
  STREAM_HEALTH_CHECK_URL: string;
  
  // Business configuration
  SUBSCRIPTION_DAILY_PRICE: number;
  SUBSCRIPTION_MONTHLY_PRICE: number;
  MAX_BET_AMOUNT: number;
  MIN_BET_AMOUNT: number;
  MAX_WITHDRAWAL_DAILY: number;
  
  // Development configuration
  LOG_LEVEL: string;
  ENABLE_CORS: boolean;
  TRUST_PROXY: boolean;
}

const envSchema = Joi.object<EnvConfig>({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  
  // Critical configuration
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required()
    .messages({
      'any.required': 'DATABASE_URL is required. Check your .env file and Neon.tech connection string.',
      'string.uri': 'DATABASE_URL must be a valid PostgreSQL connection string.'
    }),
  
  JWT_SECRET: Joi.string()
    .min(8)
    .required()
    .messages({
      'any.required': 'JWT_SECRET is required for authentication. Set a secure secret in .env file.',
      'string.min': 'JWT_SECRET must be at least 8 characters long.'
    }),
    
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:5174'),
  
  // Streaming configuration
  STREAM_SERVER_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://127.0.0.1/hls'),

  STREAM_HEALTH_CHECK_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:8080'),
  
  // Business configuration (PRD: 24h=$5, monthly=$10)
  SUBSCRIPTION_DAILY_PRICE: Joi.number().positive().default(5.00),
  SUBSCRIPTION_MONTHLY_PRICE: Joi.number().positive().default(10.00),
  MAX_BET_AMOUNT: Joi.number().positive().default(10000),
  MIN_BET_AMOUNT: Joi.number().positive().default(10),
  MAX_WITHDRAWAL_DAILY: Joi.number().positive().default(500),
  
  // Development configuration
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  ENABLE_CORS: Joi.boolean().default(true),
  TRUST_PROXY: Joi.boolean().default(false),
}).unknown(); // Allow unknown environment variables

/**
 * Validate environment variables on startup
 */
export function validateEnvironment(): EnvConfig {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    const errorMessage = `❌ Environment validation failed:\n${
      error.details.map(detail => `  - ${detail.message}`).join('\n')
    }`;
    
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
  
  return value as EnvConfig;
}

/**
 * Get validated environment configuration
 */
export const envConfig = validateEnvironment();

/**
 * Log environment status for debugging
 */
export function logEnvironmentStatus(): void {
  console.log('\n🔧 Environment Configuration Status:');
  console.log('===================================');
  console.log(`📍 Node Environment: ${envConfig.NODE_ENV}`);
  console.log(`🌐 Server Port: ${envConfig.PORT}`);
  console.log(`🗄️  Database: ${envConfig.DATABASE_URL.includes('neon.tech') ? '✅ Neon.tech' : '⚠️ Custom DB'}`);
  console.log(`🔐 JWT Secret: ${envConfig.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🎥 Streaming: ${envConfig.STREAM_SERVER_URL}`);
  console.log(`💰 Bet Limits: $${envConfig.MIN_BET_AMOUNT} - $${envConfig.MAX_BET_AMOUNT}`);
  console.log(`📊 Log Level: ${envConfig.LOG_LEVEL}`);
  console.log('');
}