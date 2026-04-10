import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/settings
 * Returns public platform settings (AI enabled status, provider availability)
 * No auth required — users need this info to render UI correctly.
 */
export async function GET() {
  try {
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

    const aiEnabled = dbSettings['ai_enabled']
      ? dbSettings['ai_enabled'] !== 'false'
      : process.env.NEXT_PUBLIC_AI_ENABLED !== 'false'

    const hasGroqKey = !!(dbSettings['groq_api_key'] || process.env.GROQ_API_KEY)
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    return NextResponse.json({
      success: true,
      settings: {
        aiEnabled,
        hasGroqKey,
        hasOpenAI,
        tableExists,
      },
    })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    )
  }
}
