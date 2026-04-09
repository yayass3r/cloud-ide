'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { motion } from 'framer-motion'
import { KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle2, LogIn } from 'lucide-react'

export default function ForgotPasswordForm() {
  const { navigate } = useAppStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetToken, setResetToken] = useState('') // For demo purposes
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('البريد الإلكتروني غير صالح')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-request', email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء معالجة الطلب')
        return
      }

      setSuccess(true)
      // For demo/testing: show the reset token
      if (data.resetToken) {
        setResetToken(data.resetToken)
      }
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!resetToken.trim()) {
      setError('رمز إعادة التعيين مطلوب')
      return
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    setResetting(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', token: resetToken, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء إعادة تعيين كلمة المرور')
        return
      }

      setResetSuccess(true)
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          {/* Gradient header */}
          <div className="bg-gradient-to-l from-emerald-500 to-teal-600 px-8 py-8 text-center">
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <KeyRound className="size-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">إعادة تعيين كلمة المرور</h1>
            <p className="mt-1 text-sm text-emerald-100">أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
          </div>

          <CardHeader className="pb-0" />

          <CardContent className="pt-6 pb-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-0">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {resetSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">تم تحديث كلمة المرور</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
                  </p>
                </div>
                <Button
                  onClick={() => navigate('login')}
                  className="gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <LogIn className="size-4" />
                  تسجيل الدخول
                </Button>
              </motion.div>
            ) : success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    إذا كان البريد الإلكتروني مسجلاً لدينا، سيتم إرسال رابط إعادة تعيين كلمة المرور.
                  </p>
                </div>

                {/* Reset password form (for demo — normally this would be a separate page linked via email) */}
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    لإكمال إعادة التعيين، أدخل رمز الاستعادة وكلمة المرور الجديدة
                  </p>
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="reset-token" className="text-sm font-medium">
                        رمز الاستعادة
                      </Label>
                      <Input
                        id="reset-token"
                        type="text"
                        dir="ltr"
                        placeholder="أدخل رمز الاستعادة"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        className="h-10 text-left text-xs focus-visible:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="new-password" className="text-sm font-medium">
                        كلمة المرور الجديدة
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        dir="ltr"
                        placeholder="6 أحرف على الأقل"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10 text-left focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="confirm-new-password" className="text-sm font-medium">
                        تأكيد كلمة المرور الجديدة
                      </Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        dir="ltr"
                        placeholder="أعد إدخال كلمة المرور"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`h-10 text-left focus-visible:ring-emerald-500 ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                        }`}
                      />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-destructive">كلمات المرور غير متطابقة</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={resetting}
                      className="h-10 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      {resetting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          جارٍ التحديث...
                        </>
                      ) : (
                        'تحديث كلمة المرور'
                      )}
                    </Button>
                  </form>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => navigate('login')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                  >
                    العودة لتسجيل الدخول
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleRequestReset}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    dir="ltr"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-left focus-visible:ring-emerald-500"
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    أدخل البريد الإلكتروني المرتبط بحسابك وسنرسل لك رابط إعادة التعيين
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 text-base font-semibold hover:from-emerald-700 hover:to-teal-700 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      جارٍ المعالجة...
                    </>
                  ) : (
                    'إرسال رابط إعادة التعيين'
                  )}
                </Button>
              </motion.form>
            )}
          </CardContent>
        </Card>

        {/* Back to login */}
        {!success && !resetSuccess && (
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('login')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="size-3.5" />
              العودة لتسجيل الدخول
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
