const { Client } = require('pg');

const DB_PASS = '@1412Yasser@';
const DB_NAME = 'postgres';
const PROJECT_REF = 'uuslujxtsrtbvjihcdzw';

const regions = [
  'us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1', 
  'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'
];

async function tryRegion(region, userFormat) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    host,
    port: 6543,
    user: userFormat,
    password: DB_PASS,
    database: DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  
  try {
    await client.connect();
    const { rows } = await client.query('SELECT 1');
    await client.end();
    return { region, user: userFormat, host, success: true };
  } catch (e) {
    try { await client.end(); } catch {}
    return { region, user: userFormat, success: false, error: e.message };
  }
}

async function main() {
  console.log('🔍 Scanning Supabase regions with different user formats...\n');
  
  const userFormats = [
    `postgres.${PROJECT_REF}`,
    PROJECT_REF,
    'postgres'
  ];
  
  for (const uf of userFormats) {
    console.log(`\n--- Trying user: ${uf} ---`);
    const results = await Promise.all(regions.map(r => tryRegion(r, uf)));
    
    for (const r of results) {
      if (r.success) {
        console.log(`✅ ${r.region}: Connected! (user: ${uf})`);
        console.log(`   Host: ${r.host}`);
        process.exit(0);
      }
    }
    console.log('  No match found for this user format');
  }
  
  // Also try with project-specific pooler
  console.log('\n--- Trying project-specific pooler ---');
  try {
    const host = `${PROJECT_REF}.pooler.supabase.com`;
    console.log(`  Resolving ${host}...`);
    const client = new Client({
      host,
      port: 6543,
      user: `postgres.${PROJECT_REF}`,
      password: DB_PASS,
      database: DB_NAME,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    await client.connect();
    const { rows } = await client.query('SELECT 1');
    await client.end();
    console.log(`✅ Connected to ${host}!`);
    process.exit(0);
  } catch(e) {
    console.log(`❌ Project pooler: ${e.message}`);
  }
  
  console.log('\n❌ Could not find working connection');
}

main();
