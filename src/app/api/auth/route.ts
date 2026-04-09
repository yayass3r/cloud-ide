import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, name } = body

    if (action === 'register') {
      // Validation
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
      }

      // Check if user already exists
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          skills: user.skills,
          githubUrl: user.githubUrl,
          isFrozen: user.isFrozen,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
        },
      })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
      }

      // Find user
      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      // Check if frozen
      if (user.isFrozen) {
        return NextResponse.json({ error: 'تم تجميد هذا الحساب، يرجى التواصل مع الدعم' }, { status: 403 })
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      // Update online status
      await db.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
      })

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          skills: user.skills,
          githubUrl: user.githubUrl,
          isFrozen: user.isFrozen,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          createdAt: user.createdAt.toISOString(),
        },
      })
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
