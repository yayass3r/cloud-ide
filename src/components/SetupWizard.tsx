'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Database,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  Terminal,
  ArrowLeftRight,
} from 'lucide-react'

const SUPABASE_SQL_EDITOR_URL =
  'https://supabase.com/dashboard/project/uuslujxtsrtbvjihcdzw/sql'

const steps = [
  {
    number: 1,
    title: 'افتح محرر SQL في Supabase',
    description: 'انقر على الرابط أدناه لفتح محرر SQL في لوحة تحكم Supabase',
    icon: <ExternalLink className="size-5" />,
  },
  {
    number: 2,
    title: 'انسخ SQL أدناه والصقه في المحرر',
    description: 'انقر على زر "نسخ" ثم الصق الكود في محرر SQL',
    icon: <ClipboardPaste className="size-5" />,
  },
  {
    number: 3,
    title: 'اضغط على "Run" لتنفيذ SQL',
    description: 'بعد لصق الكود، اضغط على زر التشغيل لإنشاء الجداول',
    icon: <Terminal className="size-5" />,
  },
  {
    number: 4,
    title: 'ارجع هنا واضغط "تحقق مرة أخرى"',
    description: 'بعد نجاح التنفيذ، عد واضغط زر التحقق للمتابعة',
    icon: <RefreshCw className="size-5" />,
  },
]

export default function SetupWizard() {
  const [status, setStatus] = useState<'loading' | 'needs-setup' | 'ready' | 'error'>(
    'loading'
  )
  const [sql, setSql] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const checkSetup = useCallback(async () => {
    setChecking(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/setup')
      const data = await res.json()

      if (data.ready) {
        setStatus('ready')
      } else {
        // Fetch the SQL
        const postRes = await fetch('/api/setup', { method: 'POST' })
        const postData = await postRes.json()
        if (postData.sql) {
          setSql(postData.sql)
        }
        setStatus('needs-setup')
      }
    } catch (err) {
      setErrorMessage('حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.')
      setStatus('error')
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    checkSetup()
  }, [checkSetup])

  const handleCopy = async () => {
    if (!sql) return
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = sql
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
              <Database className="size-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">جاري التحقق من قاعدة البيانات...</h2>
            <p className="text-sm text-muted-foreground">يرجى الانتظار قليلاً</p>
          </div>
          <Loader2 className="size-6 text-emerald-500 animate-spin" />
        </motion.div>
      </div>
    )
  }

  // Ready — this shouldn't render but just in case
  if (status === 'ready') {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 right-1/4 size-96 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -bottom-24 left-1/4 size-96 rounded-full bg-teal-300/15 blur-3xl dark:bg-teal-500/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-5 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25"
          >
            <Database className="size-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            <span className="bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              إعداد قاعدة البيانات
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 text-muted-foreground"
          >
            تحتاج إلى تنفيذ بعض أوامر SQL لإنشاء الجداول المطلوبة
          </motion.p>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">خطوة 1 من 4</span>
          </div>
          <Progress value={25} className="h-2" />
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4 mb-6"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + index * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                    {step.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {step.number}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base">{step.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mr-8">
                      {step.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Supabase SQL Editor Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-6"
        >
          <Button
            asChild
            size="lg"
            className="w-full h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-500/30 transition-all text-base"
          >
            <a href={SUPABASE_SQL_EDITOR_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-5" />
              افتح محرر SQL في Supabase
            </a>
          </Button>
        </motion.div>

        {/* SQL Code Block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle className="text-sm font-semibold">أوامر SQL المطلوبة</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs h-8"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-600">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
              <CardDescription className="text-xs">
                انسخ هذا الكود بالكامل والصقه في محرر Supabase SQL
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="relative">
                <pre className="max-h-72 overflow-y-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-300 font-mono direction-ltr text-left custom-scrollbar">
                  <code>{sql || '-- جاري تحميل SQL...'}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Check Again Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-6"
        >
          <Button
            onClick={checkSetup}
            disabled={checking}
            size="lg"
            variant="outline"
            className="w-full h-12 gap-2 text-base font-semibold border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
          >
            {checking ? (
              <>
                <Loader2 className="size-5 animate-spin text-emerald-600" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="size-5 text-emerald-600" />
                <span>تحقق مرة أخرى</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          بعد تنفيذ SQL بنجاح، اضغط على زر &quot;تحقق مرة أخرى&quot; للمتابعة
        </motion.p>
      </motion.div>
    </div>
  )
}
