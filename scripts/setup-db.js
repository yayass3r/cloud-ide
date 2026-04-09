#!/usr/bin/env node
/**
 * كود ستوديو — سكريبت إعداد قاعدة البيانات
 * 
 * تشغيل: node scripts/setup-db.js
 * أو: bun run scripts/setup-db.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read env
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL || !DB_PASSWORD) {
  console.error('❌ يرجى تعيين NEXT_PUBLIC_SUPABASE_URL و SUPABASE_DB_PASSWORD في ملف .env');
  console.error('');
  console.error('أضف في ملف .env.local:');
  console.error('SUPABASE_DB_PASSWORD=كلمة_مرور_قاعدة_البيانات');
  process.exit(1);
}

const url = new URL(SUPABASE_URL);
const ref = url.hostname.split('.')[0];
const DB_HOST = `db.${ref}.supabase.co`;

async function setup() {
  console.log('\n🚀 كود ستوديو — إعداد قاعدة البيانات');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 المشروع: ${ref}`);

  const client = new Client({
    host: DB_HOST, port: 5432, database: 'postgres',
    user: 'postgres', password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('⏳ جارٍ الاتصال...');
    await client.connect();
    console.log('✅ تم الاتصال!');

    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 جارٍ تنفيذ SQL...');
    await client.query(sql);
    console.log('✅ تم إنشاء الجداول بنجاح!');

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' ORDER BY table_name
    `);
    console.log('\n📋 الجداول:');
    tables.rows.forEach(r => console.log(`   ✅ ${r.table_name}`));

    console.log('\n🎉 تم الإعداد بنجاح!');
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    if (error.message.includes('ENETUNREACH') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 لا يمكن الاتصال من هذا الجهاز (IPv6 مطلوب).');
      console.error(`   قم بتنفيذ SQL من لوحة تحكم Supabase:`);
      console.error(`   👉 https://supabase.com/dashboard/project/${ref}/sql`);
      console.error(`   📄 الملف: ${sqlPath}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
