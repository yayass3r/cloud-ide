#!/usr/bin/env node
/**
 * Apply platform_settings migration to Supabase
 * 
 * Usage: node scripts/apply-platform-settings.js [DB_PASSWORD]
 *   or set SUPABASE_DB_PASSWORD env var
 * 
 * If no password is provided, it will guide you to the Supabase SQL Editor.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.argv[2];

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env');
  process.exit(1);
}

const url = new URL(SUPABASE_URL);
const ref = url.hostname.split('.')[0];
const DB_HOST = `db.${ref}.supabase.co`;
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${ref}/sql`;

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_platform_settings.sql');

if (!DB_PASSWORD) {
  console.log('\n❌ No database password provided.');
  console.log('\n📌 You can apply this migration by either:');
  console.log('');
  console.log('  Option 1: Set the password and re-run this script:');
  console.log(`    SUPABASE_DB_PASSWORD=your_password node scripts/apply-platform-settings.js`);
  console.log('');
  console.log('  Option 2: Open the Supabase SQL Editor in your browser:');
  console.log(`    ${SQL_EDITOR_URL}`);
  console.log('');
  console.log(`  Then paste the contents of:`);
  console.log(`    ${migrationPath}`);
  console.log('');
  process.exit(0);
}

async function applyMigration() {
  console.log('\n🔧 Applying platform_settings migration...');
  console.log(`📍 Project: ${ref}`);
  console.log(`📍 Host: ${DB_HOST}`);

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`📄 SQL file: ${migrationPath} (${sql.length} bytes)`);

  const client = new Client({
    host: DB_HOST,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📝 Executing SQL...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!');

    // Verify
    const result = await client.query('SELECT key, value FROM platform_settings ORDER BY key');
    console.log('\n📋 Platform Settings:');
    result.rows.forEach(r => console.log(`   ${r.key} = ${r.value}`));
    console.log(`\n🎉 Done! ${result.rows.length} settings configured.`);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.message.includes('ENETUNREACH') || err.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Cannot connect directly. Use the SQL Editor instead:');
      console.error(`   ${SQL_EDITOR_URL}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
