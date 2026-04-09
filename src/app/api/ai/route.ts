import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = 'أنت مساعد ذكي متخصص في البرمجة. ساعد المستخدم في كتابة وتصحيح الكود. أجب باللغة العربية. كن واضحاً ومفصلاً في إجاباتك، وقدم أمثلة عملية عند الحاجة.';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userId, projectId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الرسائل مطلوبة' },
        { status: 400 }
      );
    }

    // Initialize AI SDK
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const assistantMessage = completion.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من إنشاء رد.';

    // Save messages to database if user is authenticated
    if (userId) {
      // Save user messages
      const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
      for (const msg of userMessages) {
        await db.aiChatMessage.create({
          data: {
            userId,
            projectId: projectId || null,
            role: 'user',
            content: msg.content,
          },
        });
      }

      // Save assistant response
      await db.aiChatMessage.create({
        data: {
          userId,
          projectId: projectId || null,
          role: 'assistant',
          content: assistantMessage,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في خدمة الذكاء الاصطناعي' },
      { status: 500 }
    );
  }
}

// GET /api/ai — Get chat history for a project/user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const whereClause: Record<string, unknown> = { userId };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    const chatHistory = await db.aiChatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({ success: true, messages: chatHistory });
  } catch (error) {
    console.error('AI GET error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
