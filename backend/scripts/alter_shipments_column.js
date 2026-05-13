const { Client } = require('pg');

// Usage: node scripts/alter_shipments_column.js "postgres://user:pass@host:port/dbname"
// or set DATABASE_URL env var and run: node scripts/alter_shipments_column.js

const conn = process.argv[2] || process.env.DATABASE_URL;
if (!conn) {
  console.error('Provide connection string as arg or set DATABASE_URL');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected — running ALTER statements...');
    await client.query("ALTER TABLE shipments ALTER COLUMN qr_code_url TYPE TEXT;");
    await client.query("ALTER TABLE shipments ALTER COLUMN qr_code_data TYPE TEXT;");
    console.log('ALTERs applied successfully.');
  } catch (err) {
    console.error('Error applying ALTER:', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
