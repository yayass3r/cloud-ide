import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/verify-admin'

/**
 * GET /api/admin/settings
 * Returns all platform settings (reads from DB table or falls back to env vars)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if platform_settings table exists by trying to query it
    let dbSettings: Record<string, string> = {}
    let tableExists = false

    try {
      const { data, error } = await supabaseAdmin
        .from('platform_settings')
        .select('key, value')

      if (!error && data) {
        tableExists = true
        for (const row of data) {
          dbSettings[row.key] = row.value
        }
      }
    } catch {
      // Table doesn't exist — use env vars
    }

    // Merge: DB settings override env vars
    const settings = {
      aiEnabled: dbSettings['ai_enabled'] ?? process.env.NEXT_PUBLIC_AI_ENABLED ?? 'true',
      groqApiKey: dbSettings['groq_api_key']
        ? '••••••••' + (dbSettings['groq_api_key'].slice(-8))
        : (process.env.GROQ_API_KEY ? '••••••••' + process.env.GROQ_API_KEY.slice(-8) : ''),
      hasGroqKey: !!(dbSettings['groq_api_key'] || process.env.GROQ_API_KEY),
      maxProjectsPerUser: dbSettings['max_projects_per_user'] ?? process.env.MAX_PROJECTS ?? '10',
      maxStorageMb: dbSettings['max_storage_mb'] ?? process.env.MAX_STORAGE_MB ?? '500',
      registrationEnabled: dbSettings['registration_enabled'] ?? process.env.REGISTRATION_ENABLED ?? 'true',
      tableExists,
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب الإعدادات' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/settings
 * Updates platform settings (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.authorized) {
      return adminCheck.response
    }

    const body = await request.json()
    const updates: Record<string, string> = {}

    if (body.aiEnabled !== undefined) {
      updates['ai_enabled'] = String(body.aiEnabled)
    }
    if (body.groqApiKey !== undefined && body.groqApiKey !== '') {
      updates['groq_api_key'] = body.groqApiKey
    }
    if (body.maxProjectsPerUser !== undefined) {
      updates['max_projects_per_user'] = String(body.maxProjectsPerUser)
    }
    if (body.maxStorageMb !== undefined) {
      updates['max_storage_mb'] = String(body.maxStorageMb)
    }
    if (body.registrationEnabled !== undefined) {
      updates['registration_enabled'] = String(body.registrationEnabled)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد تحديثات' },
        { status: 400 }
      )
    }

    // Try to update in database
    try {
      const upserts = Object.entries(updates).map(([key, value]) => ({
        key,
        value,
        updated_by: adminCheck.userId,
      }))

      const { error } = await supabaseAdmin
        .from('platform_settings')
        .upsert(upserts, { onConflict: 'key' })

      if (error) {
        // If table doesn't exist, return helpful error
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return NextResponse.json({
            success: false,
            error: 'جدول الإعدادات غير موجود. يرجى إنشاء جدول platform_settings في قاعدة البيانات.',
            needsMigration: true,
          }, { status: 400 })
        }
        throw error
      }

      return NextResponse.json({
        success: true,
        message: 'تم تحديث الإعدادات بنجاح',
        updated: Object.keys(updates),
      })
    } catch (dbError: unknown) {
      const errMsg = dbError instanceof Error ? dbError.message : String(dbError)
      console.error('Settings DB error:', errMsg)

      // Check if it's a missing table error
      if (errMsg.includes('does not exist') || errMsg.includes('42P01')) {
        return NextResponse.json({
          success: false,
          error: 'جدول الإعدادات غير موجود. يرجى إنشاء جدول platform_settings أولاً.',
          needsMigration: true,
        }, { status: 400 })
      }

      return NextResponse.json(
        { success: false, error: 'فشل في حفظ الإعدادات' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
