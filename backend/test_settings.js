// Test script for settings system functionality
const { SystemSetting } = require('./dist/models/SystemSetting');
const settingsService = require('./dist/services/settingsService').default;

async function testSettingsSystem() {
  console.log('🧪 Testing Settings System...\n');
  
  try {
    // Test 1: Database connection and model
    console.log('1️⃣ Testing SystemSetting model...');
    
    // Create a test setting
    const testSetting = await SystemSetting.create({
      key: 'test_setting',
      value: true,
      type: 'boolean',
      category: 'test',
      description: 'Test setting for validation',
      is_public: false
    });
    
    console.log('✅ Created test setting:', testSetting.key);
    
    // Test 2: Settings service
    console.log('\n2️⃣ Testing settingsService...');
    
    const retrievedSetting = await settingsService.getSetting('test_setting');
    console.log('✅ Retrieved setting:', retrievedSetting);
    
    // Test 3: Feature toggles
    console.log('\n3️⃣ Testing feature toggles...');
    
    const walletsEnabled = await settingsService.areWalletsEnabled();
    const bettingEnabled = await settingsService.isBettingEnabled();
    const streamingEnabled = await settingsService.isStreamingEnabled();
    
    console.log('✅ Wallets enabled:', walletsEnabled);
    console.log('✅ Betting enabled:', bettingEnabled);
    console.log('✅ Streaming enabled:', streamingEnabled);
    
    // Test 4: Settings by category
    console.log('\n4️⃣ Testing category retrieval...');
    
    const featureSettings = await settingsService.getByCategory('features');
    console.log('✅ Feature settings:', Object.keys(featureSettings));
    
    // Test 5: Update setting
    console.log('\n5️⃣ Testing setting updates...');
    
    await settingsService.updateSetting('test_setting', false);
    const updatedSetting = await settingsService.getSetting('test_setting');
    console.log('✅ Updated setting value:', updatedSetting);
    
    // Cleanup
    await SystemSetting.destroy({ where: { key: 'test_setting' } });
    console.log('✅ Cleaned up test data');
    
    console.log('\n🎉 All tests passed! Settings system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testSettingsSystem().then(() => {
  console.log('Test completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});