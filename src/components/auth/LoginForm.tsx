'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const { setUser, navigate } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء تسجيل الدخول')
        return
      }

      setUser(data.user)
      navigate('dashboard')
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
            <LogIn className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">مرحباً بعودتك</h1>
          <p className="mt-1 text-sm text-emerald-100">سجّل دخولك للمتابعة</p>
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
              <Label htmlFor="login-email" className="text-sm font-medium">
                البريد الإلكتروني
              </Label>
              <Input
                id="login-email"
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
              <Label htmlFor="login-password" className="text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pe-10 text-left focus-visible:ring-emerald-500"
                  autoComplete="current-password"
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

            <Button
              type="submit"
              disabled={loading}
              className="h-11 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 text-base font-semibold hover:from-emerald-700 hover:to-teal-700 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جارٍ تسجيل الدخول...
                </>
              ) : (
                <>
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pt-2 pb-6">
          <p className="text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <button
              onClick={() => navigate('register')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              إنشاء حساب جديد
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
