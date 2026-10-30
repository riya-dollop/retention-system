const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');

async function migrate() {
  console.log('Running database migrations...');
  const sqlPath = path.join(__dirname, '../db/migrations/001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };

