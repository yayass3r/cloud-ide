import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel } from '@/lib/supabase-utils'

const SYSTEM_PROMPT = 'أنت مساعد ذكي متخصص في البرمجة. ساعد المستخدم في كتابة وتصحيح الكود. أجب باللغة العربية. كن واضحاً ومفصلاً في إجاباتك، وقدم أمثلة عملية عند الحاجة.'

// Model mapping — frontend selector → actual API model names
const MODEL_MAP: Record<string, { provider: string; model: string }> = {
  // OpenAI models
  'gpt-4o': { provider: 'openai', model: 'gpt-4o-mini' },
  'gpt-4': { provider: 'openai', model: 'gpt-4o' },
  // Groq models (fast)
  'llama-3': { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  'claude-3': { provider: 'groq', model: 'claude-3-haiku-20240307' },
  'mixtral': { provider: 'groq', model: 'mixtral-8x7b-32768' },
  'gemma2': { provider: 'groq', model: 'gemma2-9b-it' },
}

/**
 * Call OpenAI-compatible chat completions API.
 * Works with OpenAI or any compatible endpoint.
 */
async function callOpenAI(
  baseUrl: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string = 'gpt-4o-mini'
): Promise<string> {
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
    console.error('OpenAI API error:', response.status, errText)
    throw new Error(`AI_API_ERROR: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI_NO_CONTENT')
  }
  return content
}

/**
 * Call Groq API for fast inference.
 */
async function callGroq(
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string = 'llama-3.3-70b-versatile'
): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions'

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
    console.error('Groq API error:', response.status, errText)
    throw new Error(`GROQ_API_ERROR: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('GROQ_NO_CONTENT')
  }
  return content
}

/**
 * Try the ZAI SDK (local dev only)
 */
async function tryZAISDK(
  messages: { role: string; content: string }[],
  model: string
): Promise<string | null> {
  try {
    const { ZAI } = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({ messages, model })
    return completion.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

/**
 * Get AI response based on the selected model and available providers.
 */
async function getAIResponse(
  messages: { role: string; content: string }[],
  selectedModel: string = 'gpt-4o-mini',
  modelConfig?: { provider: string; model: string }
): Promise<string> {
  const provider = modelConfig?.provider || 'openai'
  const model = modelConfig?.model || selectedModel

  // ── Strategy 1: ZAI SDK (local dev / internal network) ──
  const zaiResult = await tryZAISDK(messages, model)
  if (zaiResult) return zaiResult

  // ── Strategy 2: Provider-specific API based on model config ──
  if (provider === 'groq') {
    // Try Groq API first
    const groqKey = process.env.GROQ_API_KEY
    if (groqKey) {
      return callGroq(groqKey, messages, model)
    }
    
    // Fallback: Try reading from platform_settings table
    try {
      const { data } = await supabaseAdmin
        .from('platform_settings')
        .select('value')
        .eq('key', 'groq_api_key')
        .single()
      
      if (data?.value) {
        return callGroq(data.value, messages, model)
      }
    } catch {
      // Table doesn't exist or error
    }
    
    console.warn('Groq API key not configured, falling back to OpenAI')
  }

  // ── Strategy 3: OpenAI API ──
  const openaiKey = process.env.OPENAI_API_KEY
  const openaiBase = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

  if (openaiKey) {
    return callOpenAI(openaiBase, openaiKey, messages, model)
  }

  // ── Strategy 4: ZAI env vars ──
  const zaiBaseUrl = process.env.ZAI_BASE_URL
  const zaiApiKey = process.env.ZAI_API_KEY

  if (zaiBaseUrl && zaiApiKey) {
    return callOpenAI(zaiBaseUrl, zaiApiKey, messages, model)
  }

  throw new Error('AI_SERVICE_UNAVAILABLE')
}

/**
 * Check if AI chat is enabled via platform settings
 */
async function isAIEnabled(): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'ai_enabled')
      .single()
    
    return data?.value !== 'false'
  } catch {
    // Table doesn't exist — check env var
    return process.env.NEXT_PUBLIC_AI_ENABLED !== 'false'
  }
}

// ============================================================
// POST /api/ai — Send message to AI and get response
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // Check if AI is enabled
    const aiEnabled = await isAIEnabled()
    if (!aiEnabled) {
      return NextResponse.json({
        success: false,
        error: 'خدمة الذكاء الاصطناعي معطلة حالياً من قبل المدير.',
        code: 'AI_DISABLED',
      }, { status: 403 })
    }

    const body = await request.json()
    const { messages, userId, projectId, model } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الرسائل مطلوبة' },
        { status: 400 }
      )
    }

    // Resolve model config
    const modelConfig = MODEL_MAP[model] || { provider: 'openai', model: 'gpt-4o-mini' }

    // Build full message array with system prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    try {
      const assistantMessage = await getAIResponse(fullMessages, modelConfig.model, modelConfig)

      // Save messages to database if user is authenticated
      if (userId) {
        try {
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

          await supabaseAdmin.from('ai_chat_messages').insert({
            user_id: userId,
            project_id: projectId || null,
            role: 'assistant',
            content: assistantMessage,
          })
        } catch (dbErr) {
          console.error('Failed to save chat messages:', dbErr)
        }
      }

      return NextResponse.json({
        success: true,
        message: assistantMessage,
        provider: modelConfig.provider,
        model: modelConfig.model,
      })
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr)
      console.error('AI service error:', msg)

      if (msg === 'AI_SERVICE_UNAVAILABLE') {
        return NextResponse.json({
          success: false,
          error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً.',
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
// GET /api/ai — Get chat history + AI availability info
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const checkAvailability = searchParams.get('check')

    // Check AI availability
    if (checkAvailability === 'true') {
      const aiEnabled = await isAIEnabled()
      
      // Check if at least one AI provider is configured
      const hasProvider = !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.ZAI_BASE_URL)
      
      // Check for Groq key in settings
      let hasGroqInDb = false
      try {
        const { data } = await supabaseAdmin
          .from('platform_settings')
          .select('value')
          .eq('key', 'groq_api_key')
          .single()
        hasGroqInDb = !!data?.value
      } catch {}

      return NextResponse.json({
        success: true,
        available: aiEnabled && (hasProvider || hasGroqInDb),
        enabled: aiEnabled,
        providers: {
          openai: !!process.env.OPENAI_API_KEY,
          groq: !!(process.env.GROQ_API_KEY || hasGroqInDb),
          zai: !!(process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY),
        },
      })
    }

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
