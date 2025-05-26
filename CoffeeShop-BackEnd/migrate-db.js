const sequelize = require('./models/index');

async function createMonitoredUsersTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "MonitoredUsers" (
        id SERIAL PRIMARY KEY,
        "UserId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
        "monitoringSince" TIMESTAMP NOT NULL DEFAULT NOW(),
        reason TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Monitored Users table created successfully');
  } catch (err) {
    console.error('Error creating Monitored Users table:', err);
  }
}

async function addTwoFactorAuthColumns() {
  try {
    // Check if columns already exist to avoid errors
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users' 
      AND column_name IN ('verificationCode', 'verificationCodeExpiry', 'isVerified');
    `);
    
    const existingColumns = results.map(r => r.column_name);
    
    // Add verificationCode column if it doesn't exist
    if (!existingColumns.includes('verificationCode')) {
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN "verificationCode" VARCHAR(255) NULL;
      `);
      console.log('Added verificationCode column to Users table');
    }
    
    // Add verificationCodeExpiry column if it doesn't exist
    if (!existingColumns.includes('verificationCodeExpiry')) {
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN "verificationCodeExpiry" TIMESTAMP NULL;
      `);
      console.log('Added verificationCodeExpiry column to Users table');
    }
    
    // Add isVerified column if it doesn't exist
    if (!existingColumns.includes('isVerified')) {
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN "isVerified" BOOLEAN DEFAULT FALSE;
      `);
      console.log('Added isVerified column to Users table');
    }
    
    console.log('Two-factor authentication columns added successfully');
  } catch (err) {
    console.error('Error adding two-factor authentication columns:', err);
  }
}

// Run this function if this file is executed directly
if (require.main === module) {
  Promise.all([
    createMonitoredUsersTable(),
    addTwoFactorAuthColumns()
  ])
    .then(() => {
      console.log('All migrations completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { 
  createMonitoredUsersTable,
  addTwoFactorAuthColumns
};