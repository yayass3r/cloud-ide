import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel } from '@/lib/supabase-utils'
import fs from 'fs/promises'
import path from 'path'

const SYSTEM_PROMPT = 'أنت مساعد ذكي متخصص في البرمجة. ساعد المستخدم في كتابة وتصحيح الكود. أجب باللغة العربية. كن واضحاً ومفصلاً في إجاباتك، وقدم أمثلة عملية عند الحاجة.'

// Model mapping for the frontend selector
const MODEL_MAP: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'claude-3': 'claude-3-sonnet',
  'llama-3': 'llama-3-70b',
}

/**
 * Initialize the ZAI SDK by ensuring config is available.
 * Writes config to /tmp/.z-ai-config for serverless environments.
 */
async function initZAI() {
  const { ZAI } = await import('z-ai-web-dev-sdk')

  // Check known config locations
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(process.env.HOME || '/root', '.z-ai-config'),
    '/etc/.z-ai-config',
    '/tmp/.z-ai-config',
  ]

  for (const fp of configPaths) {
    try {
      const content = await fs.readFile(fp, 'utf-8')
      const parsed = JSON.parse(content)
      if (parsed.baseUrl && parsed.apiKey) {
        return new ZAI(parsed)
      }
    } catch {
      // File doesn't exist or is invalid, continue
    }
  }

  // Try to create config from environment variables
  const baseUrl = process.env.ZAI_BASE_URL
  const apiKey = process.env.ZAI_API_KEY
  const chatId = process.env.ZAI_CHAT_ID
  const userId = process.env.ZAI_USER_ID
  const token = process.env.ZAI_TOKEN

  if (baseUrl && apiKey) {
    const config: Record<string, string> = { baseUrl, apiKey }
    if (chatId) config.chatId = chatId
    if (userId) config.userId = userId
    if (token) config.token = token

    // Write to /tmp for future calls in this function instance
    try {
      await fs.mkdir('/tmp', { recursive: true })
      await fs.writeFile('/tmp/.z-ai-config', JSON.stringify(config, null, 2))
    } catch {
      // Ignore write errors
    }

    return new ZAI(config)
  }

  throw new Error('ZAI_CONFIG_MISSING')
}

/**
 * Make a direct fetch call to an OpenAI-compatible API endpoint
 */
async function callDirectAI(
  baseUrl: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string = 'gpt-4o'
) {
  const url = `${baseUrl}/chat/completions`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI API returned ${response.status}: ${errText}`)
  }

  return response.json()
}

/**
 * Get AI response using the best available method
 */
async function getAIResponse(
  messages: { role: string; content: string }[],
  selectedModel: string = 'gpt-4o'
): Promise<string> {
  // Strategy 1: Try ZAI SDK (works in local dev)
  try {
    const zai = await initZAI()
    const completion = await zai.chat.completions.create({
      messages,
      model: selectedModel,
    })
    const content = completion.choices?.[0]?.message?.content
    if (content) return content
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('ZAI SDK failed:', msg)

    // If config is missing, don't retry with ZAI
    if (msg.includes('ZAI_CONFIG_MISSING')) {
      console.warn('ZAI config not available, trying direct API...')
    } else {
      // ZAI had config but request failed (network issue, etc.)
      // Try direct API as fallback
      const baseUrl = process.env.ZAI_BASE_URL
      const apiKey = process.env.ZAI_API_KEY
      if (baseUrl && apiKey) {
        try {
          const result = await callDirectAI(baseUrl, apiKey, messages, selectedModel)
          return result.choices?.[0]?.message?.content || 'لم أتمكن من إنشاء رد.'
        } catch (directErr) {
          console.warn('Direct AI API also failed:', directErr instanceof Error ? directErr.message : directErr)
        }
      }
    }
  }

  // Strategy 2: Direct API call with env vars
  const baseUrl = process.env.AI_API_BASE_URL || process.env.ZAI_BASE_URL
  const apiKey = process.env.AI_API_KEY || process.env.ZAI_API_KEY
  if (baseUrl && apiKey) {
    const result = await callDirectAI(baseUrl, apiKey, messages, selectedModel)
    return result.choices?.[0]?.message?.content || 'لم أتمكن من إنشاء رد.'
  }

  throw new Error('AI_SERVICE_UNAVAILABLE')
}

// ============================================================
// POST /api/ai — Send message to AI and get response
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userId, projectId, model } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الرسائل مطلوبة' },
        { status: 400 }
      )
    }

    // Resolve model
    const selectedModel = MODEL_MAP[model] || 'gpt-4o'

    // Build full message array with system prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    try {
      const assistantMessage = await getAIResponse(fullMessages, selectedModel)

      // Save messages to database if user is authenticated
      if (userId) {
        try {
          // Save user messages
          const userMessages = messages.filter((m: { role: string }) => m.role === 'user')
          const userInserts = userMessages.map((msg: { content: string }) => ({
            user_id: userId,
            project_id: projectId || null,
            role: 'user',
            content: msg.content,
          }))

          if (userInserts.length > 0) {
            await supabaseAdmin.from('ai_chat_messages').insert(userInserts)
          }

          // Save assistant response
          await supabaseAdmin.from('ai_chat_messages').insert({
            user_id: userId,
            project_id: projectId || null,
            role: 'assistant',
            content: assistantMessage,
          })
        } catch (dbErr) {
          console.error('Failed to save chat messages:', dbErr)
          // Don't fail the request if saving fails
        }
      }

      return NextResponse.json({
        success: true,
        message: assistantMessage,
      })
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr)
      console.error('AI service error:', msg)

      if (msg === 'AI_SERVICE_UNAVAILABLE') {
        return NextResponse.json({
          success: false,
          error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى التأكد من إعداد متغيرات البيئة المطلوبة (ZAI_BASE_URL, ZAI_API_KEY).',
          code: 'AI_SERVICE_UNAVAILABLE',
        }, { status: 503 })
      }

      return NextResponse.json({
        success: false,
        error: 'حدث خطأ في خدمة الذكاء الاصطناعي',
      }, { status: 500 })
    }
  } catch (error) {
    console.error('AI POST error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// ============================================================
// GET /api/ai — Get chat history for a project/user
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', userId)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: chatHistory, error } = await query
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('AI GET error:', error)
      return NextResponse.json(
        { success: false, error: 'حدث خطأ في الخادم' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messages: (chatHistory || []).map((msg: Record<string, unknown>) => toCamel(msg)),
    })
  } catch (error) {
    console.error('AI GET error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
