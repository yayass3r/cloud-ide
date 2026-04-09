import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { toCamel, stripPassword } from '@/lib/supabase-utils'

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
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (checkError) {
        console.error('Auth check error:', checkError)
        return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
      }

      if (existingUser) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')

      // Create user
      const { data: user, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({ email, name, password: hashedPassword, verification_token: verificationToken })
        .select()
        .single()

      if (insertError) {
        console.error('Auth insert error:', insertError)
        return NextResponse.json({ error: 'حدث خطأ في إنشاء الحساب' }, { status: 500 })
      }

      const safeUser = stripPassword(user)

      return NextResponse.json({
        user: toCamel(safeUser),
        token: user.id,
      })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
      }

      // Find user
      const { data: user, error: findError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (findError || !user) {
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      // Check if frozen
      if (user.is_frozen) {
        return NextResponse.json({ error: 'تم تجميد هذا الحساب، يرجى التواصل مع الدعم' }, { status: 403 })
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      // Update online status
      const now = new Date().toISOString()
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ is_online: true, last_seen: now })
        .eq('id', user.id)

      if (updateError) {
        console.error('Auth update online error:', updateError)
      }

      const safeUser = stripPassword(user)

      return NextResponse.json({
        user: {
          ...toCamel(safeUser),
          isOnline: true,
          lastSeen: now,
        },
        token: user.id,
      })
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// GET /api/auth?action=verify&userId=xxx
// Email verification endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'verify') {
      const userId = searchParams.get('userId')

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'معرف المستخدم مطلوب' },
          { status: 400 }
        )
      }

      // Find user
      const { data: user, error: findError } = await supabaseAdmin
        .from('users')
        .select('id, email_verified')
        .eq('id', userId)
        .single()

      if (findError || !user) {
        return NextResponse.json(
          { success: false, error: 'المستخدم غير موجود' },
          { status: 404 }
        )
      }

      if (user.email_verified) {
        return NextResponse.json({
          success: true,
          message: 'البريد الإلكتروني موثق بالفعل',
          emailVerified: true,
        })
      }

      // Mark email as verified
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email_verified: true,
          verification_token: null,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Email verification error:', updateError)
        return NextResponse.json(
          { success: false, error: 'حدث خطأ في التحقق' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'تم التحقق من البريد الإلكتروني بنجاح',
        emailVerified: true,
      })
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
