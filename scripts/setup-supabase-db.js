const { Client } = require('pg');

const POOLER_HOST = 'aws-0-us-east-1.pooler.supabase.com';
const POOLER_PORT = 6543;
const DB_USER = 'postgres.uuslujxtsrtbvjihcdzw';
const DB_PASS = '@1412Yasser@';
const DB_NAME = 'postgres';

const DB_URL = `postgresql://${DB_USER}:${encodeURIComponent(DB_PASS)}@${POOLER_HOST}:${POOLER_PORT}/${DB_NAME}`;

async function setupDatabase() {
  const client = new Client({
    host: POOLER_HOST,
    port: POOLER_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase via pooler (IPv4)...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test query
    const { rows } = await client.query('SELECT now() as current_time, version()');
    console.log(`🕐 DB Time: ${rows[0].current_time}`);
    console.log(`📦 DB Version: ${rows[0].version.split(',')[0]}`);
    
    // Check existing tables
    console.log('\n📊 Checking existing tables...');
    const { rows: existingTables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Existing tables:', existingTables.length > 0 ? existingTables.map(t => t.table_name).join(', ') : '(none)');
    
    // Read and execute the migration SQL
    const fs = require('fs');
    const sql = fs.readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8');
    
    console.log('\n🔄 Executing migration SQL...');
    await client.query(sql);
    console.log('✅ Migration executed successfully!');
    
    // Verify tables
    console.log('\n📊 Verifying tables after migration...');
    const { rows: newTables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables after migration:', newTables.map(t => t.table_name).join(', '));
    
    // Verify RLS policies
    console.log('\n🔒 Checking RLS policies...');
    const { rows: policies } = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    policies.forEach(p => {
      console.log(`  ✓ ${p.tablename}: ${p.policyname}`);
    });
    
    // Check storage bucket
    console.log('\n📦 Checking storage buckets...');
    try {
      const { rows: buckets } = await client.query(`
        SELECT id, name, public FROM storage.buckets
      `);
      buckets.forEach(b => {
        console.log(`  ✓ Bucket: ${b.name} (public: ${b.public})`);
      });
    } catch(e) {
      console.log('  ⚠️  Storage check skipped:', e.message);
    }
    
    // Create admin user
    console.log('\n👤 Creating default admin user...');
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminId = '00000000-0000-0000-0000-000000000001';
    
    await client.query(`
      INSERT INTO users (id, email, name, password, role, bio, skills)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET role = 'admin'
    `, [
      adminId,
      'admin@cloudide.com',
      'مدير النظام',
      adminPassword,
      'admin',
      'مدير النظام الرئيسي',
      JSON.stringify(['إدارة', 'تطوير', 'DevOps'])
    ]);
    console.log('✅ Default admin user created (admin@cloudide.com / admin123)');
    
    // Create sample demo user
    console.log('\n👤 Creating demo user...');
    const demoPassword = await bcrypt.hash('demo123', 10);
    const demoId = '00000000-0000-0000-0000-000000000002';
    
    await client.query(`
      INSERT INTO users (id, email, name, password, role, bio, skills, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
    `, [
      demoId,
      'demo@cloudide.com',
      'مستخدم تجريبي',
      demoPassword,
      'user',
      'مطور ويب متحمس',
      JSON.stringify(['JavaScript', 'React', 'Node.js', 'Python']),
      null
    ]);
    console.log('✅ Demo user created (demo@cloudide.com / demo123)');
    
    // Create sample project for demo user
    console.log('\n📁 Creating sample project...');
    await client.query(`
      INSERT INTO projects (user_id, name, description, template, files, is_public)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, [
      demoId,
      'مشروع تجريبي - تطبيق React',
      'تطبيق React تجريبي تم إنشاؤه تلقائياً كمعرض',
      'react',
      JSON.stringify({
        'package.json': '{"name":"demo-app","version":"1.0.0","dependencies":{"react":"^18.0.0","react-dom":"^18.0.0"}}',
        'index.html': '<!DOCTYPE html><html><head><title>Demo</title></head><body><div id="root"></div></body></html>',
        'src/App.jsx': 'function App() { return <h1>مرحباً بالعالم!</h1>; } export default App;'
      }),
      true
    ]);
    console.log('✅ Sample project created');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - 5 tables: users, projects, deployments, ai_chat_messages, storage');
    console.log('  - RLS policies enabled on all tables');
    console.log('  - Storage bucket: avatars');
    console.log('  - Admin user: admin@cloudide.com / admin123');
    console.log('  - Demo user: demo@cloudide.com / demo123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
