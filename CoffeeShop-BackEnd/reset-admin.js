const bcrypt = require('bcrypt');
const { User } = require('./models/relationships');

async function resetAdminPassword() {
  try {
    console.log('Finding admin user...');
    const adminUser = await User.findOne({ where: { email: 'admin@piratecafe.com' } });
    
    if (!adminUser) {
      console.error('Admin user not found!');
      return;
    }
    
    console.log(`Found admin user: ${adminUser.username}`);
    
    // Create a new clear hash with bcrypt
    console.log('Generating new password hash...');
    const newPassword = 'Admin123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('Updating user password...');
    // Directly update the database record to ensure it's properly stored
    await User.update(
      { password: hashedPassword },
      { where: { id: adminUser.id } }
    );
    
    console.log('✅ Admin password reset successful!');
    console.log(`You can now log in with:
Email: admin@piratecafe.com
Password: admin123`);
    
  } catch (err) {
    console.error('Error resetting admin password:', err);
  } finally {
    process.exit();
  }
}

resetAdminPassword();