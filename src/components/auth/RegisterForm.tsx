'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, UserPlus, Loader2, AlertCircle } from 'lucide-react'

export default function RegisterForm() {
  const { navigate } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = (): string | null => {
    if (!name.trim()) return 'يرجى إدخال الاسم الكامل'
    if (name.trim().length < 2) return 'الاسم يجب أن يكون حرفين على الأقل'
    if (!email.trim()) return 'يرجى إدخال البريد الإلكتروني'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'البريد الإلكتروني غير صالح'
    if (!password) return 'يرجى إدخال كلمة المرور'
    if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    if (password !== confirmPassword) return 'كلمات المرور غير متطابقة'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء إنشاء الحساب')
        return
      }

      navigate('login')
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
        {/* Gradient header */}
        <div className="bg-gradient-to-l from-emerald-500 to-teal-600 px-8 py-8 text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <UserPlus className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-emerald-100">انضم إلينا وابدأ ببناء مشاريعك</p>
        </div>

        <CardHeader className="pb-0" />

        <CardContent className="pt-6 pb-2">
          {error && (
            <Alert variant="destructive" className="mb-4 border-0">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reg-name" className="text-sm font-medium">
                الاسم الكامل
              </Label>
              <Input
                id="reg-name"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 focus-visible:ring-emerald-500"
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reg-email" className="text-sm font-medium">
                البريد الإلكتروني
              </Label>
              <Input
                id="reg-email"
                type="email"
                dir="ltr"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-left focus-visible:ring-emerald-500"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reg-password" className="text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="6 أحرف على الأقل"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pe-10 text-left focus-visible:ring-emerald-500"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reg-confirm" className="text-sm font-medium">
                تأكيد كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-11 pe-10 text-left focus-visible:ring-emerald-500 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-destructive">كلمات المرور غير متطابقة</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 text-base font-semibold hover:from-emerald-700 hover:to-teal-700 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جارٍ إنشاء الحساب...
                </>
              ) : (
                <>
                  إنشاء حساب
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pt-2 pb-6">
          <p className="text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <button
              onClick={() => navigate('login')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              تسجيل الدخول
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
