import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken, verifyToken, getTokenFromHeader } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { toCamel, stripPassword } from '@/lib/supabase-utils'

// ============================================================
// POST /api/auth — login | register | reset-request | reset-password
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, name, token: resetToken, newPassword } = body

    // ──────────────────────────────────────────
    // REGISTER
    // ──────────────────────────────────────────
    if (action === 'register') {
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
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      if (checkError) {
        console.error('Auth check user error:', checkError.message, checkError.code, checkError.hint)
        return NextResponse.json({
          error: 'حدث خطأ في الخادم',
          debug: checkError.message,
        }, { status: 500 })
      }
      if (existingUser) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user — only use columns that exist in the current table
      const insertData: Record<string, string> = {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: hashedPassword,
      }

      const { data: user, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error('Auth insert error:', insertError.message, 'Code:', insertError.code, 'Details:', insertError.details, 'Hint:', insertError.hint)
        return NextResponse.json({
          error: 'حدث خطأ في إنشاء الحساب',
          debug: insertError.message,
          code: insertError.code,
        }, { status: 500 })
      }

      const safeUser = stripPassword(user)
      const camelUser = toCamel(safeUser)

      // Generate real JWT token
      const jwtToken = await generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      return NextResponse.json({
        user: camelUser,
        token: jwtToken,
      })
    }

    // ──────────────────────────────────────────
    // LOGIN
    // ──────────────────────────────────────────
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
      }

      // Find user by email
      const { data: user, error: findError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
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
      await supabaseAdmin
        .from('users')
        .update({ is_online: true, last_seen: now })
        .eq('id', user.id)

      const safeUser = stripPassword(user)
      const camelUser = toCamel(safeUser)

      // Generate real JWT token
      const jwtToken = await generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      return NextResponse.json({
        user: {
          ...camelUser,
          isOnline: true,
          lastSeen: now,
        },
        token: jwtToken,
      })
    }

    // ──────────────────────────────────────────
    // PASSWORD RESET REQUEST
    // ──────────────────────────────────────────
    if (action === 'reset-request') {
      if (!email) {
        return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
      }

      // Find user by email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      if (user) {
        const resetTokenValue = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

        // Try to use reset_token column if it exists
        try {
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              reset_token: resetTokenValue,
              reset_token_expires: expiresAt,
            })
            .eq('id', user.id)

          if (error && error.message.includes('does not exist')) {
            // Fallback: store in bio field
            await supabaseAdmin
              .from('users')
              .update({ bio: `__reset__${resetTokenValue}__expires__${expiresAt}` })
              .eq('id', user.id)
          }
        } catch {
          // Fallback: store in bio field
          await supabaseAdmin
            .from('users')
            .update({ bio: `__reset__${resetTokenValue}__expires__${expiresAt}` })
            .eq('id', user.id)
        }

        return NextResponse.json({
          success: true,
          message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين.',
          resetToken: resetTokenValue,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين.',
      })
    }

    // ──────────────────────────────────────────
    // PASSWORD RESET EXECUTION
    // ──────────────────────────────────────────
    if (action === 'reset-password') {
      if (!resetToken || !newPassword) {
        return NextResponse.json({ error: 'رمز إعادة التعيين وكلمة المرور الجديدة مطلوبان' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
      }

      // Try reset_token column first
      const { data: tokenUser, error: tokenError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('reset_token', resetToken)
        .maybeSingle()

      let user = tokenUser

      // Fallback: search in bio field
      if (!user || tokenError) {
        const { data: bioUsers } = await supabaseAdmin
          .from('users')
          .select('*')
          .ilike('bio', `%__reset__${resetToken}%`)

        if (bioUsers && bioUsers.length > 0) {
          user = bioUsers[0]
        }
      }

      if (!user) {
        return NextResponse.json({ error: 'رمز إعادة التعيين غير صالح' }, { status: 400 })
      }

      // Check expiry
      if (user.reset_token_expires) {
        const expiresAt = new Date(user.reset_token_expires)
        if (expiresAt < new Date()) {
          return NextResponse.json({ error: 'رمز إعادة التعيين منتهي الصلاحية، يرجى طلب رمز جديد' }, { status: 400 })
        }
      } else {
        // Check expiry from bio field
        const bioMatch = user.bio?.match(/__expires__(.+)__/)
        if (bioMatch) {
          const expiresAt = new Date(bioMatch[1])
          if (expiresAt < new Date()) {
            return NextResponse.json({ error: 'رمز إعادة التعيين منتهي الصلاحية، يرجى طلب رمز جديد' }, { status: 400 })
          }
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update password and clear reset token
      const updateData: Record<string, unknown> = {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        bio: null,
      }

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Password reset error:', updateError)
        return NextResponse.json({ error: 'حدث خطأ في تحديث كلمة المرور' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'تم تحديث كلمة المرور بنجاح',
      })
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Auth POST error:', error)
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return NextResponse.json({ error: 'حدث خطأ في الخادم', debug: message }, { status: 500 })
  }
}

// ============================================================
// GET /api/auth?action=session  — Verify JWT & return user
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ──────────────────────────────────────────
    // SESSION VERIFICATION (for page refresh restore)
    // ──────────────────────────────────────────
    if (action === 'session') {
      const token = getTokenFromHeader(request)
      if (!token) {
        return NextResponse.json({ error: 'رمز المصادقة مطلوب' }, { status: 401 })
      }

      // Verify JWT
      const payload = await verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'رمز المصادقة غير صالح أو منتهي الصلاحية' }, { status: 401 })
      }

      // Fetch fresh user data from DB
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single()

      if (error || !user) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
      }

      if (user.is_frozen) {
        return NextResponse.json({ error: 'تم تجميد هذا الحساب' }, { status: 403 })
      }

      const safeUser = stripPassword(user)

      return NextResponse.json({
        user: toCamel(safeUser),
      })
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
