#!/bin/sh
# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
sleep 5

# First, manually create the base tables in the correct order
echo "Creating base database tables..."
node -e "
const sequelize = require('./models/index');

async function createBaseTables() {
  try {
    // Create Users table first
    await sequelize.query(\`
      CREATE TABLE IF NOT EXISTS \"Users\" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'user',
        \"isMonitored\" BOOLEAN DEFAULT false,
        \"monitoringSince\" TIMESTAMP,
        \"lastLogin\" TIMESTAMP,
        \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
        \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    \`);
    console.log('Users table created successfully');
    
    // Create other base tables
    await sequelize.query(\`
    CREATE TABLE IF NOT EXISTS \"ProductCategories\" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        \"displayOrder\" INTEGER DEFAULT 0,
        \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
        \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
    );
    \`);
    console.log('ProductCategories table created successfully');
    
    // Create Products table with foreign key to ProductCategories
    await sequelize.query(\`
      CREATE TABLE IF NOT EXISTS \"Products\" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(255),
        description TEXT,
        \"ProductCategoryId\" INTEGER REFERENCES \"ProductCategories\"(id),
        \"UserId\" INTEGER REFERENCES \"Users\"(id),
        \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
        \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    \`);
    console.log('Products table created successfully');
    
    // Create ActivityLogs table with foreign key to Users
    await sequelize.query(\`
      CREATE TABLE IF NOT EXISTS \"ActivityLogs\" (
        id SERIAL PRIMARY KEY,
        action VARCHAR(10) NOT NULL,
        \"entityType\" VARCHAR(50) NOT NULL,
        \"entityId\" INTEGER,
        details TEXT,
        \"ipAddress\" VARCHAR(50),
        \"UserId\" INTEGER REFERENCES \"Users\"(id),
        \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
        \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    \`);
    console.log('ActivityLogs table created successfully');
    
    // Create MonitoredUsers table last
    await sequelize.query(\`
      CREATE TABLE IF NOT EXISTS \"MonitoredUsers\" (
        id SERIAL PRIMARY KEY,
        \"UserId\" INTEGER NOT NULL REFERENCES \"Users\"(id) ON DELETE CASCADE,
        \"monitoringSince\" TIMESTAMP NOT NULL DEFAULT NOW(),
        reason TEXT NOT NULL,
        \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
        \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    \`);
    console.log('MonitoredUsers table created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
}

createBaseTables()
  .then(() => console.log('All base tables created successfully'))
  .catch(err => {
    console.error('Failed to create tables:', err);
    process.exit(1);
  });
"

# Setup initial data
echo "Setting up database with initial data using docker-setup.js..."
node docker-setup.js

# Start the server
echo "Starting server..."
exec node server.js