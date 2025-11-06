#!/usr/bin/env node

/**
 * Authentication Debug Script
 * Identifies exact failure point in auth chain
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { connectDatabase, sequelize } from "../config/database";
import { logger } from "../config/logger";
import { Op } from "sequelize";

config();

interface AuthDebugResult {
  step: string;
  status: 'SUCCESS' | 'FAILED';
  details: any;
  error?: string;
}

class AuthDebugger {
  private results: AuthDebugResult[] = [];

  private addResult(step: string, status: 'SUCCESS' | 'FAILED', details: any, error?: string) {
    this.results.push({ step, status, details, error });
  }

  async debugAuth(): Promise<void> {
    console.log('🔍 AUTHENTICATION DEBUG ANALYSIS');
    console.log('=================================\n');

    try {
      // Step 1: Database connection
      await this.testDatabaseConnection();
      
      // Step 2: Test raw SQL query
      await this.testRawSQLQuery();
      
      // Step 3: Test Sequelize User.findOne
      await this.testSequelizeQuery();
      
      // Step 4: Test password hashing
      await this.testPasswordHashing();
      
      // Step 5: Test bcrypt comparison
      await this.testPasswordComparison();
      
      // Step 6: Complete auth simulation
      await this.simulateCompleteAuth();

    } catch (error) {
      console.error('❌ Debug process failed:', error);
    } finally {
      await this.printResults();
      process.exit(0);
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      await connectDatabase();
      this.addResult('Database Connection', 'SUCCESS', 'Connected to database');
    } catch (error) {
      this.addResult('Database Connection', 'FAILED', null, error.message);
    }
  }

  private async testRawSQLQuery(): Promise<void> {
    try {
      const [results] = await sequelize.query(
        "SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = 'admin_test'"
      );
      
      if (results.length > 0) {
        const user = results[0] as any;
        this.addResult('Raw SQL Query', 'SUCCESS', {
          found: true,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          password_hash_length: user.password_hash?.length || 0,
          password_hash_starts_with: user.password_hash?.substring(0, 7) || 'N/A'
        });
      } else {
        this.addResult('Raw SQL Query', 'FAILED', { found: false });
      }
    } catch (error) {
      this.addResult('Raw SQL Query', 'FAILED', null, error.message);
    }
  }

  private async testSequelizeQuery(): Promise<void> {
    try {
      // Test with username
      const userByUsername = await User.findOne({ 
        where: { username: 'admin_test' } 
      });
      
      // Test with email
      const userByEmail = await User.findOne({ 
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
            password_hash_length: userByUsername.passwordHash?.length || 0
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
    } catch (error) {
      this.addResult('Sequelize User.findOne', 'FAILED', null, error.message);
    }
  }

  private async testPasswordHashing(): Promise<void> {
    try {
      const testPassword = 'Test123456';
      const hashedPassword = await User.hashPassword(testPassword);
      
      this.addResult('Password Hashing', 'SUCCESS', {
        original_password: testPassword,
        hashed_length: hashedPassword.length,
        hash_starts_with: hashedPassword.substring(0, 7),
        is_bcrypt_hash: hashedPassword.startsWith('$2b$')
      });
    } catch (error) {
      this.addResult('Password Hashing', 'FAILED', null, error.message);
    }
  }

  private async testPasswordComparison(): Promise<void> {
    try {
      // Get actual hash from database
      const [results] = await sequelize.query(
        "SELECT password_hash FROM users WHERE username = 'admin_test'"
      );
      
      if (results.length > 0) {
        const dbHash = (results[0] as any).password_hash;
        const testPassword = 'Test123456';
        
        // Test direct bcrypt comparison
        const directCompare = await bcrypt.compare(testPassword, dbHash);
        
        // Test User model comparison
        const user = await User.findOne({ where: { username: 'admin_test' } });
        const modelCompare = user ? await user.comparePassword(testPassword) : false;
        
        this.addResult('Password Comparison', directCompare || modelCompare ? 'SUCCESS' : 'FAILED', {
          db_hash: dbHash,
          test_password: testPassword,
          direct_bcrypt_compare: directCompare,
          model_compare: modelCompare,
          hash_format_valid: dbHash?.startsWith('$2b$') || dbHash?.startsWith('$2a$')
        });
      } else {
        this.addResult('Password Comparison', 'FAILED', { error: 'No user found in database' });
      }
    } catch (error) {
      this.addResult('Password Comparison', 'FAILED', null, error.message);
    }
  }

  private async simulateCompleteAuth(): Promise<void> {
    try {
      const login = 'admin_test';
      const password = 'Test123456';
      
      console.log(`\n🧪 SIMULATING COMPLETE AUTH FLOW`);
      console.log(`Login attempt for: ${login}`);
      console.log(`Password: ${password}\n`);
      
      // Simulate the exact auth.ts logic
      const user = await User.findOne({
        where: {
          [Op.or]: [
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
        const isPasswordValid = await user.comparePassword(password);
        console.log('Password validation result:', isPasswordValid);
        
        if (user.isActive && isPasswordValid) {
          this.addResult('Complete Auth Simulation', 'SUCCESS', {
            user_found: true,
            password_valid: isPasswordValid,
            user_isActive: user.isActive,
            auth_success: true
          });
        } else {
          this.addResult('Complete Auth Simulation', 'FAILED', {
            user_found: true,
            password_valid: isPasswordValid,
            user_isActive: user.isActive,
            auth_success: false,
            failure_reason: !user.isActive ? `User is not active` : 'Invalid password'
          });
        }
      } else {
        this.addResult('Complete Auth Simulation', 'FAILED', {
          user_found: false,
          auth_success: false,
          failure_reason: 'User not found'
        });
      }
      
    } catch (error) {
      this.addResult('Complete Auth Simulation', 'FAILED', null, error.message);
    }
  }

  private async printResults(): Promise<void> {
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
  }
}

// Execute if called directly
if (require.main === module) {
  const authDebugger = new AuthDebugger();
  authDebugger.debugAuth().catch(console.error);
}

export { AuthDebugger };