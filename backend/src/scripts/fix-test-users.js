#!/usr/bin/env node
"use strict";
/**
 * Fix Test Users Script
 * Regenerates test users with properly hashed passwords
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
exports.TestUserFixer = void 0;
const dotenv_1 = require("dotenv");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const database_1 = require("../config/database");
(0, dotenv_1.config)();
const TEST_USERS = [
    {
        username: 'admin_test',
        email: 'admin@sportsbets.com',
        role: 'admin',
        password: 'Test123456'
    },
    {
        username: 'operator_test',
        email: 'operator1@sportsbets.com',
        role: 'operator',
        password: 'Test123456'
    },
    {
        username: 'venue_test',
        email: 'venueowner1@sportsbets.com',
        role: 'venue',
        password: 'Test123456'
    },
    {
        username: 'gallera_test',
        email: 'gallera1@sportsbets.com',
        role: 'gallera',
        password: 'Test123456'
    },
    {
        username: 'user_test',
        email: 'testuser1@sportsbets.com',
        role: 'user',
        password: 'Test123456'
    }
];
class TestUserFixer {
    fixAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔧 FIXING TEST USER PASSWORDS');
            console.log('==============================\n');
            try {
                yield (0, database_1.connectDatabase)();
                for (const testUser of TEST_USERS) {
                    yield this.fixUser(testUser);
                }
                console.log('\n✅ All test users fixed successfully!');
                console.log('\n🧪 Test these credentials:');
                TEST_USERS.forEach(user => {
                    console.log(`   ${user.username} / ${user.password} (${user.role})`);
                });
                yield this.verifyAllUsers();
            }
            catch (error) {
                console.error('❌ Failed to fix test users:', error);
                throw error;
            }
        });
    }
    fixUser(testUser) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`🔄 Processing user: ${testUser.username}`);
                // Generate new hash using User model method
                const hashedPassword = yield User_1.User.hashPassword(testUser.password);
                console.log(`   Generated hash: ${hashedPassword.substring(0, 20)}...`);
                // Update using raw SQL to ensure it works
                const [results] = yield database_1.sequelize.query('UPDATE users SET password_hash = :hash WHERE username = :username', {
                    replacements: {
                        hash: hashedPassword,
                        username: testUser.username
                    }
                });
                console.log(`   ✅ Updated ${testUser.username}`);
            }
            catch (error) {
                console.error(`   ❌ Failed to fix ${testUser.username}:`, error);
                throw error;
            }
        });
    }
    verifyAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\n🧪 VERIFYING ALL USERS');
            console.log('======================');
            for (const testUser of TEST_USERS) {
                yield this.verifyUser(testUser);
            }
        });
    }
    verifyUser(testUser) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`\n🔍 Verifying: ${testUser.username}`);
                // Find user via Sequelize
                const user = yield User_1.User.findOne({
                    where: { username: testUser.username }
                });
                if (!user) {
                    console.log(`   ❌ User not found: ${testUser.username}`);
                    return;
                }
                console.log(`   📋 User found: ${user.email} (${user.role})`);
                console.log(`   🔑 Hash: ${user.passwordHash.substring(0, 20)}...`);
                // Test password with model method
                const modelResult = yield user.comparePassword(testUser.password);
                console.log(`   🧪 Model comparison: ${modelResult ? '✅ PASS' : '❌ FAIL'}`);
                // Test password with direct bcrypt
                const directResult = yield bcryptjs_1.default.compare(testUser.password, user.passwordHash);
                console.log(`   🧪 Direct bcrypt: ${directResult ? '✅ PASS' : '❌ FAIL'}`);
                if (modelResult && directResult) {
                    console.log(`   ✅ ${testUser.username} authentication works!`);
                }
                else {
                    console.log(`   ❌ ${testUser.username} authentication FAILED`);
                }
            }
            catch (error) {
                console.error(`   ❌ Error verifying ${testUser.username}:`, error);
            }
        });
    }
}
exports.TestUserFixer = TestUserFixer;
// Execute if called directly
if (require.main === module) {
    const fixer = new TestUserFixer();
    fixer.fixAllUsers()
        .then(() => {
        console.log('\n🎉 Test user fix completed!');
        process.exit(0);
    })
        .catch(error => {
        console.error('💥 Fix process failed:', error);
        process.exit(1);
    });
}
