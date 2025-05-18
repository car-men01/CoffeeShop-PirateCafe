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

// Run this function if this file is executed directly
if (require.main === module) {
  createMonitoredUsersTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { createMonitoredUsersTable };