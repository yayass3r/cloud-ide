import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * POST /api/setup
 *
 * Attempts to verify that the Supabase database has been initialised with
 * the required tables.  If the tables are missing it returns the SQL that
 * must be executed manually in the Supabase SQL Editor (because the REST
 * API cannot create tables).
 *
 * It also seeds the default admin user when it doesn't already exist.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check if the `users` table already exists by performing a lightweight query
    const { error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)

    if (checkError) {
      // Table likely doesn't exist – return SQL for manual execution
      let sql = ''
      try {
        sql = readFileSync(
          join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql'),
          'utf-8'
        )
      } catch {
        sql = '-- Could not read migration file. Check supabase/migrations/001_initial_schema.sql'
      }

      return NextResponse.json(
        {
          success: false,
          needsSetup: true,
          message:
            'The database tables have not been created yet. Please run the SQL below in the Supabase SQL Editor.',
          sql,
        },
        { status: 200 }
      )
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
        avatar:
          'https://api.dicebear.com/7.x/initials/svg?seed=AD&backgroundColor=059669',
      })

      if (seedError) {
        console.error('Seed admin error:', seedError)
      }
    }

    // 3. Verify all required tables are accessible
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

      return NextResponse.json(
        {
          success: false,
          needsSetup: true,
          message: `Missing tables: ${missingTables.join(', ')}. Please run the SQL in the Supabase SQL Editor.`,
          sql,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      needsSetup: false,
      message: 'Database is already set up and ready.',
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        success: false,
        needsSetup: true,
        error: 'An unexpected error occurred during setup.',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/setup
 * Quick health-check – returns whether tables appear to be available.
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
