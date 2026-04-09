import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * POST /api/setup
 *
 * Verifies the Supabase database is properly initialized:
 * 1. Checks all tables exist
 * 2. Adds missing columns
 * 3. Seeds the default admin user
 *
 * Since the REST API can't run DDL (ALTER TABLE), it returns SQL
 * that must be executed in the Supabase SQL Editor.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check if the `users` table exists
    const { error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)

    if (checkError) {
      let sql = ''
      try {
        sql = readFileSync(
          join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql'),
          'utf-8'
        )
      } catch {
        sql = '-- Could not read migration file.'
      }

      return NextResponse.json({
        success: false,
        needsSetup: true,
        message: 'جداول قاعدة البيانات غير موجودة. يرجى تشغيل SQL التالي في محرر SQL في Supabase.',
        sql,
      }, { status: 200 })
    }

    // 2. Seed the default admin user if it doesn't exist
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'admin@cloudide.com')
      .maybeSingle()

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const { error: seedError } = await supabaseAdmin.from('users').insert({
        email: 'admin@cloudide.com',
        name: 'مدير النظام',
        password: hashedPassword,
        role: 'admin',
        bio: 'مدير النظام الرئيسي',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AD&backgroundColor=059669',
      })
      if (seedError) {
        console.error('Seed admin error:', seedError)
      }
    }

    // 3. Verify all required tables exist
    const tableChecks = await Promise.all([
      supabaseAdmin.from('users').select('id').limit(1),
      supabaseAdmin.from('projects').select('id').limit(1),
      supabaseAdmin.from('deployments').select('id').limit(1),
      supabaseAdmin.from('ai_chat_messages').select('id').limit(1),
    ])

    const missingTables = tableChecks
      .map((r, i) => {
        const names = ['users', 'projects', 'deployments', 'ai_chat_messages']
        return r.error ? names[i] : null
      })
      .filter(Boolean)

    if (missingTables.length > 0) {
      let sql = ''
      try {
        sql = readFileSync(
          join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql'),
          'utf-8'
        )
      } catch {
        sql = '-- Could not read migration file'
      }

      return NextResponse.json({
        success: false,
        needsSetup: true,
        message: `جداول مفقودة: ${missingTables.join(', ')}. يرجى تشغيل SQL في محرر Supabase.`,
        sql,
      }, { status: 200 })
    }

    // 4. Check for missing columns by trying to select them
    const columnChecks = await Promise.all([
      supabaseAdmin.from('users').select('email_verified').limit(1),
      supabaseAdmin.from('users').select('verification_token').limit(1),
      supabaseAdmin.from('users').select('reset_token').limit(1),
      supabaseAdmin.from('users').select('reset_token_expires').limit(1),
    ])

    const missingColumns = [
      { name: 'email_verified', sql: 'email_verified BOOLEAN NOT NULL DEFAULT false' },
      { name: 'verification_token', sql: 'verification_token TEXT' },
      { name: 'reset_token', sql: 'reset_token TEXT' },
      { name: 'reset_token_expires', sql: 'reset_token_expires TIMESTAMPTZ' },
    ].filter((col, i) => columnChecks[i].error !== null)

    if (missingColumns.length > 0) {
      const alterSql = missingColumns
        .map((col) => `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.sql};`)
        .join('\n')

      const fullSql = `-- أضف الأعمدة المفقودة لجدول users\n${alterSql}\n\n-- إنشاء فهرس لعمود reset_token\nCREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;\n`

      return NextResponse.json({
        success: true,
        needsSetup: false,
        missingColumns: missingColumns.map((c) => c.name),
        message: 'قاعدة البيانات تعمل لكن هناك أعمدة مفقودة. يرجى تشغيل SQL التالي في محرر SQL في Supabase لتحسين الوظائف.',
        sql: fullSql,
      }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      needsSetup: false,
      message: 'قاعدة البيانات جاهزة بالكامل.',
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      needsSetup: true,
      error: 'حدث خطأ غير متوقع أثناء الإعداد.',
    }, { status: 500 })
  }
}

/**
 * GET /api/setup
 * Quick health-check
 */
export async function GET() {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1)
    return NextResponse.json({
      ready: !error,
      tables: error ? 'not found' : 'ok',
    })
  } catch {
    return NextResponse.json({ ready: false, tables: 'error' }, { status: 500 })
  }
}
