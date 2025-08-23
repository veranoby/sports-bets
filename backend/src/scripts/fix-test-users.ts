#!/usr/bin/env node

/**
 * Fix Test Users Script
 * Regenerates test users with properly hashed passwords
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { connectDatabase, sequelize } from "../config/database";
import { logger } from "../config/logger";

config();

interface TestUser {
  username: string;
  email: string;
  role: string;
  password: string;
}

const TEST_USERS: TestUser[] = [
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
  async fixAllUsers(): Promise<void> {
    console.log('🔧 FIXING TEST USER PASSWORDS');
    console.log('==============================\n');

    try {
      await connectDatabase();
      
      for (const testUser of TEST_USERS) {
        await this.fixUser(testUser);
      }
      
      console.log('\n✅ All test users fixed successfully!');
      console.log('\n🧪 Test these credentials:');
      TEST_USERS.forEach(user => {
        console.log(`   ${user.username} / ${user.password} (${user.role})`);
      });
      
      await this.verifyAllUsers();
      
    } catch (error) {
      console.error('❌ Failed to fix test users:', error);
      throw error;
    }
  }

  private async fixUser(testUser: TestUser): Promise<void> {
    try {
      console.log(`🔄 Processing user: ${testUser.username}`);
      
      // Generate new hash using User model method
      const hashedPassword = await User.hashPassword(testUser.password);
      console.log(`   Generated hash: ${hashedPassword.substring(0, 20)}...`);
      
      // Update using raw SQL to ensure it works
      const [results] = await sequelize.query(
        'UPDATE users SET password_hash = :hash WHERE username = :username',
        {
          replacements: {
            hash: hashedPassword,
            username: testUser.username
          }
        }
      );
      
      console.log(`   ✅ Updated ${testUser.username}`);
      
    } catch (error) {
      console.error(`   ❌ Failed to fix ${testUser.username}:`, error);
      throw error;
    }
  }

  private async verifyAllUsers(): Promise<void> {
    console.log('\n🧪 VERIFYING ALL USERS');
    console.log('======================');
    
    for (const testUser of TEST_USERS) {
      await this.verifyUser(testUser);
    }
  }

  private async verifyUser(testUser: TestUser): Promise<void> {
    try {
      console.log(`\n🔍 Verifying: ${testUser.username}`);
      
      // Find user via Sequelize
      const user = await User.findOne({ 
        where: { username: testUser.username } 
      });
      
      if (!user) {
        console.log(`   ❌ User not found: ${testUser.username}`);
        return;
      }
      
      console.log(`   📋 User found: ${user.email} (${user.role})`);
      console.log(`   🔑 Hash: ${user.passwordHash.substring(0, 20)}...`);
      
      // Test password with model method
      const modelResult = await user.comparePassword(testUser.password);
      console.log(`   🧪 Model comparison: ${modelResult ? '✅ PASS' : '❌ FAIL'}`);
      
      // Test password with direct bcrypt
      const directResult = await bcrypt.compare(testUser.password, user.passwordHash);
      console.log(`   🧪 Direct bcrypt: ${directResult ? '✅ PASS' : '❌ FAIL'}`);
      
      if (modelResult && directResult) {
        console.log(`   ✅ ${testUser.username} authentication works!`);
      } else {
        console.log(`   ❌ ${testUser.username} authentication FAILED`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error verifying ${testUser.username}:`, error);
    }
  }
}

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

export { TestUserFixer };