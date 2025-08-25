#!/usr/bin/env node
"use strict";
/**
 * Authentication Debug Script
 * Identifies exact failure point in auth chain
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthDebugger = void 0;
const dotenv_1 = require("dotenv");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
(0, dotenv_1.config)();
class AuthDebugger {
    constructor() {
        this.results = [];
    }
    addResult(step, status, details, error) {
        this.results.push({ step, status, details, error });
    }
    debugAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔍 AUTHENTICATION DEBUG ANALYSIS');
            console.log('=================================\n');
            try {
                // Step 1: Database connection
                yield this.testDatabaseConnection();
                // Step 2: Test raw SQL query
                yield this.testRawSQLQuery();
                // Step 3: Test Sequelize User.findOne
                yield this.testSequelizeQuery();
                // Step 4: Test password hashing
                yield this.testPasswordHashing();
                // Step 5: Test bcrypt comparison
                yield this.testPasswordComparison();
                // Step 6: Complete auth simulation
                yield this.simulateCompleteAuth();
            }
            catch (error) {
                console.error('❌ Debug process failed:', error);
            }
            finally {
                yield this.printResults();
                process.exit(0);
            }
        });
    }
    testDatabaseConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, database_1.connectDatabase)();
                this.addResult('Database Connection', 'SUCCESS', 'Connected to database');
            }
            catch (error) {
                this.addResult('Database Connection', 'FAILED', null, error.message);
            }
        });
    }
    testRawSQLQuery() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const [results] = yield database_1.sequelize.query("SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = 'admin_test'");
                if (results.length > 0) {
                    const user = results[0];
                    this.addResult('Raw SQL Query', 'SUCCESS', {
                        found: true,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isActive: user.is_active,
                        password_hash_length: ((_a = user.password_hash) === null || _a === void 0 ? void 0 : _a.length) || 0,
                        password_hash_starts_with: ((_b = user.password_hash) === null || _b === void 0 ? void 0 : _b.substring(0, 7)) || 'N/A'
                    });
                }
                else {
                    this.addResult('Raw SQL Query', 'FAILED', { found: false });
                }
            }
            catch (error) {
                this.addResult('Raw SQL Query', 'FAILED', null, error.message);
            }
        });
    }
    testSequelizeQuery() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Test with username
                const userByUsername = yield User_1.User.findOne({
                    where: { username: 'admin_test' }
                });
                // Test with email
                const userByEmail = yield User_1.User.findOne({
                    where: { email: 'admin@sportsbets.com' }
                });
                this.addResult('Sequelize User.findOne', userByUsername ? 'SUCCESS' : 'FAILED', {
                    by_username: {
                        found: !!userByUsername,
                        data: userByUsername ? {
                            id: userByUsername.id,
                            username: userByUsername.username,
                            email: userByUsername.email,
                            role: userByUsername.role,
                            password_hash_length: ((_a = userByUsername.passwordHash) === null || _a === void 0 ? void 0 : _a.length) || 0
                        } : null
                    },
                    by_email: {
                        found: !!userByEmail,
                        data: userByEmail ? {
                            id: userByEmail.id,
                            username: userByEmail.username,
                            email: userByEmail.email,
                            role: userByEmail.role
                        } : null
                    }
                });
            }
            catch (error) {
                this.addResult('Sequelize User.findOne', 'FAILED', null, error.message);
            }
        });
    }
    testPasswordHashing() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const testPassword = 'Test123456';
                const hashedPassword = yield User_1.User.hashPassword(testPassword);
                this.addResult('Password Hashing', 'SUCCESS', {
                    original_password: testPassword,
                    hashed_length: hashedPassword.length,
                    hash_starts_with: hashedPassword.substring(0, 7),
                    is_bcrypt_hash: hashedPassword.startsWith('$2b$')
                });
            }
            catch (error) {
                this.addResult('Password Hashing', 'FAILED', null, error.message);
            }
        });
    }
    testPasswordComparison() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get actual hash from database
                const [results] = yield database_1.sequelize.query("SELECT password_hash FROM users WHERE username = 'admin_test'");
                if (results.length > 0) {
                    const dbHash = results[0].password_hash;
                    const testPassword = 'Test123456';
                    // Test direct bcrypt comparison
                    const directCompare = yield bcryptjs_1.default.compare(testPassword, dbHash);
                    // Test User model comparison
                    const user = yield User_1.User.findOne({ where: { username: 'admin_test' } });
                    const modelCompare = user ? yield user.comparePassword(testPassword) : false;
                    this.addResult('Password Comparison', directCompare || modelCompare ? 'SUCCESS' : 'FAILED', {
                        db_hash: dbHash,
                        test_password: testPassword,
                        direct_bcrypt_compare: directCompare,
                        model_compare: modelCompare,
                        hash_format_valid: (dbHash === null || dbHash === void 0 ? void 0 : dbHash.startsWith('$2b$')) || (dbHash === null || dbHash === void 0 ? void 0 : dbHash.startsWith('$2a$'))
                    });
                }
                else {
                    this.addResult('Password Comparison', 'FAILED', { error: 'No user found in database' });
                }
            }
            catch (error) {
                this.addResult('Password Comparison', 'FAILED', null, error.message);
            }
        });
    }
    simulateCompleteAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const login = 'admin_test';
                const password = 'Test123456';
                console.log(`\n🧪 SIMULATING COMPLETE AUTH FLOW`);
                console.log(`Login attempt for: ${login}`);
                console.log(`Password: ${password}\n`);
                // Simulate the exact auth.ts logic
                const user = yield User_1.User.findOne({
                    where: {
                        [sequelize_1.Op.or]: [
                            { email: login },
                            { username: login }
                        ]
                    }
                });
                console.log('User query result:', user ? 'FOUND' : 'NOT FOUND');
                if (user) {
                    console.log('User details:', {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive
                    });
                    console.log('\nTesting password validation...');
                    const isPasswordValid = yield user.comparePassword(password);
                    console.log('Password validation result:', isPasswordValid);
                    if (user.isActive && isPasswordValid) {
                        this.addResult('Complete Auth Simulation', 'SUCCESS', {
                            user_found: true,
                            password_valid: isPasswordValid,
                            user_isActive: user.isActive,
                            auth_success: true
                        });
                    }
                    else {
                        this.addResult('Complete Auth Simulation', 'FAILED', {
                            user_found: true,
                            password_valid: isPasswordValid,
                            user_isActive: user.isActive,
                            auth_success: false,
                            failure_reason: !user.isActive ? `User is not active` : 'Invalid password'
                        });
                    }
                }
                else {
                    this.addResult('Complete Auth Simulation', 'FAILED', {
                        user_found: false,
                        auth_success: false,
                        failure_reason: 'User not found'
                    });
                }
            }
            catch (error) {
                this.addResult('Complete Auth Simulation', 'FAILED', null, error.message);
            }
        });
    }
    printResults() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\n📊 DEBUG RESULTS SUMMARY');
            console.log('========================\n');
            this.results.forEach((result, index) => {
                const status = result.status === 'SUCCESS' ? '✅' : '❌';
                console.log(`${index + 1}. ${status} ${result.step}`);
                if (result.details) {
                    console.log('   Details:', JSON.stringify(result.details, null, 2));
                }
                if (result.error) {
                    console.log(`   Error: ${result.error}`);
                }
                console.log('');
            });
            // Analysis
            const failedSteps = this.results.filter(r => r.status === 'FAILED');
            const successSteps = this.results.filter(r => r.status === 'SUCCESS');
            console.log('🎯 ANALYSIS');
            console.log('===========');
            console.log(`✅ Successful steps: ${successSteps.length}`);
            console.log(`❌ Failed steps: ${failedSteps.length}`);
            if (failedSteps.length > 0) {
                console.log('\n🚨 CRITICAL ISSUES FOUND:');
                failedSteps.forEach(step => {
                    console.log(`   - ${step.step}: ${step.error || 'Check details above'}`);
                });
            }
            console.log('\n🔧 RECOMMENDED ACTIONS:');
            if (failedSteps.some(s => s.step.includes('Database'))) {
                console.log('   - Check database connection and credentials');
            }
            if (failedSteps.some(s => s.step.includes('SQL Query'))) {
                console.log('   - Verify user exists in database: admin_test');
            }
            if (failedSteps.some(s => s.step.includes('Sequelize'))) {
                console.log('   - Check Sequelize model configuration and underscored mapping');
            }
            if (failedSteps.some(s => s.step.includes('Password'))) {
                console.log('   - Regenerate password hashes or check bcrypt configuration');
            }
        });
    }
}
exports.AuthDebugger = AuthDebugger;
// Execute if called directly
if (require.main === module) {
    const authDebugger = new AuthDebugger();
    authDebugger.debugAuth().catch(console.error);
}
