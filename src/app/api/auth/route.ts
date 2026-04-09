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

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')

      // Create user
      const { data: user, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          name,
          password: hashedPassword,
          verification_token: verificationToken,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Auth insert error:', insertError)
        return NextResponse.json({ error: 'حدث خطأ في إنشاء الحساب' }, { status: 500 })
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

      // Find user by email (don't reveal if email exists or not)
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (user) {
        // Generate reset token (expires in 1 hour)
        const resetTokenValue = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

        await supabaseAdmin
          .from('users')
          .update({
            reset_token: resetTokenValue,
            reset_token_expires: expiresAt,
          })
          .eq('id', user.id)

        // In production, send email with reset link containing the token
        // For now, return the token so the UI can show it (demo mode)
        return NextResponse.json({
          success: true,
          message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين.',
          resetToken: resetTokenValue,
        })
      }

      // Always return success to prevent email enumeration
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

      // Find user by reset token
      const { data: user, error: findError } = await supabaseAdmin
        .from('users')
        .select('id, reset_token_expires')
        .eq('reset_token', resetToken)
        .single()

      if (findError || !user) {
        return NextResponse.json({ error: 'رمز إعادة التعيين غير صالح' }, { status: 400 })
      }

      // Check if token has expired
      if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
        return NextResponse.json({ error: 'رمز إعادة التعيين منتهي الصلاحية، يرجى طلب رمز جديد' }, { status: 400 })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update password and clear reset token
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          password: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
        })
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

    // ──────────────────────────────────────────
    // SEND EMAIL VERIFICATION (regenerate token)
    // ──────────────────────────────────────────
    if (action === 'send-verify-email') {
      const { userId: targetUserId } = body

      if (!targetUserId) {
        return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
      }

      // Find user
      const { data: verifyUser } = await supabaseAdmin
        .from('users')
        .select('id, email, email_verified')
        .eq('id', targetUserId)
        .single()

      if (!verifyUser) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
      }

      if (verifyUser.email_verified) {
        return NextResponse.json({ success: true, message: 'البريد الإلكتروني موثق بالفعل' })
      }

      // Generate new verification token
      const newVerificationToken = crypto.randomBytes(32).toString('hex')

      await supabaseAdmin
        .from('users')
        .update({ verification_token: newVerificationToken })
        .eq('id', verifyUser.id)

      // In production, send verification email with link:
      // https://cloud-ide-ar.netlify.app/api/auth?action=verify&userId=xxx&token=yyy
      return NextResponse.json({
        success: true,
        message: 'تم إنشاء رمز التحقق. في بيئة الإنتاج، سيتم إرسال رابط عبر البريد الإلكتروني.',
        verificationToken: newVerificationToken,
      })
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ============================================================
// GET /api/auth?action=session  — Verify JWT & return user
// GET /api/auth?action=verify&userId=xxx&token=xxx  — Email verification
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

    // ──────────────────────────────────────────
    // EMAIL VERIFICATION
    // ──────────────────────────────────────────
    if (action === 'verify') {
      const userId = searchParams.get('userId')
      const token = searchParams.get('token')

      if (!userId || !token) {
        return NextResponse.json(
          { success: false, error: 'معرف المستخدم ورمز التحقق مطلوبان' },
          { status: 400 }
        )
      }

      // Find user and verify token matches
      const { data: user, error: findError } = await supabaseAdmin
        .from('users')
        .select('id, email_verified, verification_token')
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

      // Verify the token matches (security fix: don't accept just userId)
      if (user.verification_token !== token) {
        return NextResponse.json(
          { success: false, error: 'رمز التحقق غير صالح' },
          { status: 400 }
        )
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
