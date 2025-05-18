const pool = require('./db');
const { sequelize } = require('./models/index');

const resetDatabase = async () => {
  try {
    console.log('Starting database reset...');
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Check if tables exist before attempting to drop them
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      console.log('Tables do not exist yet. Nothing to drop.');
      await pool.query('COMMIT');
      return;
    }
    
    // Drop the tables (with CASCADE to handle any dependencies)
    try {
      console.log('Dropping Products table...');
      await pool.query('DROP TABLE IF EXISTS "Products" CASCADE');
      console.log('Products table dropped successfully');
      
      console.log('Dropping productCategories table...');
      await pool.query('DROP TABLE IF EXISTS "ProductCategories" CASCADE');
      console.log('ProductCategories table dropped successfully');
      
      // Commit transaction
      await pool.query('COMMIT');
      console.log('Database reset completed successfully - all tables dropped');
    } catch (dropError) {
      // Rollback if there was an error dropping tables
      await pool.query('ROLLBACK');
      console.error('Error dropping tables:', dropError);
      throw dropError;
    }
    
  } catch (err) {
    // Ensure rollback happens on any error
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error during rollback:', rollbackErr);
    }
    console.error('Error resetting database:', err);
  } finally {
    await pool.end();
  }
};

// Helper function to check if tables exist
const checkTablesExist = async () => {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name IN ('Products', 'ProductCategories')
      );
    `);
    return result.rows[0].exists;
  } catch (err) {
    console.error('Error checking if tables exist:', err);
    return false;
  }
};

resetDatabase()
  .then(() => {
    console.log('Database reset operation complete. Tables have been dropped.');
    console.log('Run setup-db.js to recreate the tables and populate them with initial data.');
  })
  .catch(err => console.error('Database reset failed:', err));