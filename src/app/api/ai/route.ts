import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import ZAI from 'z-ai-web-dev-sdk'
import { toCamel } from '@/lib/supabase-utils'

const SYSTEM_PROMPT = 'أنت مساعد ذكي متخصص في البرمجة. ساعد المستخدم في كتابة وتصحيح الكود. أجب باللغة العربية. كن واضحاً ومفصلاً في إجاباتك، وقدم أمثلة عملية عند الحاجة.'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userId, projectId } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الرسائل مطلوبة' },
        { status: 400 }
      )
    }

    // Initialize AI SDK
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    })

    const assistantMessage = completion.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من إنشاء رد.'

    // Save messages to database if user is authenticated
    if (userId) {
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
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    })
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في خدمة الذكاء الاصطناعي' },
      { status: 500 }
    )
  }
}

// GET /api/ai — Get chat history for a project/user
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
