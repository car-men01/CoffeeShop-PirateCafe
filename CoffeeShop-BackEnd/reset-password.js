const bcrypt = require('bcrypt');
const { User } = require('./models/relationships');

async function resetTestuserPassword() {
  try {
    console.log('Finding test user...');
    const testUser = await User.findOne({ where: { email: 'user@piratecafe.com' } });
    
    if (!testUser) {
      console.error('Test user not found!');
      return;
    }
    
    console.log(`Found test user: ${testUser.username}`);
    
    // Create a new clear hash with bcrypt
    console.log('Generating new password hash...');
    const plainPassword = 'user123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('Updating user password...');
    // Directly update the database record to ensure it's properly stored
    await User.update(
      { password: hashedPassword },
      { where: { id: testUser.id } }
    );
    
    // Also update in-memory model to ensure consistency
    testUser.password = hashedPassword;
    await testUser.save({ fields: ['password'] });
    
    console.log('✅ Test user password reset successful!');
    console.log(`You can now log in with:
Email: user@piratecafe.com
Password: user123`);

    // Verify the password right away to ensure it works
    const verifyResult = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`Password verification test: ${verifyResult ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (err) {
    console.error('Error resetting test user password:', err);
  } finally {
    process.exit();
  }
}

resetTestuserPassword();