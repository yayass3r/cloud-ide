'use client'

import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Code2, Brain, Rocket, Briefcase, Sparkles, ArrowLeft, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: <Code2 className="size-7 text-emerald-600" />,
    title: 'محرر أكواد متقدم',
    description: 'محرر أكواد احترافي متكامل مع دعم لعدة لغات برمجة، وتلوين بناء الجملة، وإكمال تلقائي ذكي.',
  },
  {
    icon: <Brain className="size-7 text-emerald-600" />,
    title: 'ذكاء اصطناعي مدمج',
    description: 'مساعد ذكاء اصطناعي يساعدك في كتابة الأكواد، إصلاح الأخطاء، وتحسين الأداء بشكل فوري.',
  },
  {
    icon: <Rocket className="size-7 text-emerald-600" />,
    title: 'نشر فوري',
    description: 'انشر مشاريعك على الإنترنت بنقرة واحدة مع رابط مباشر قابل للمشاركة في ثوانٍ معدودة.',
  },
  {
    icon: <Briefcase className="size-7 text-emerald-600" />,
    title: 'معرض أعمال',
    description: 'أنشئ معرض أعمالك الشخصي وشارك مشاريعك مع العالم ليعرض مهاراتك.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function LandingPage() {
  const { navigate } = useAppStore()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20" />

        {/* Decorative blurred circles */}
        <div className="pointer-events-none absolute -top-24 left-1/4 size-96 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 size-96 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-500/10" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25">
              <Code2 className="size-10 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              كود ستوديو
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            بيئة تطوير متكاملة داخل متصفحك — اكتب، شغّل، وانشر أكوادك من أي مكان في العالم
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate('register')}
              className="h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 px-8 text-base font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-500/30 transition-all"
            >
              <Sparkles className="size-5" />
              ابدأ مجاناً
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('login')}
              className="h-12 gap-2 px-8 text-base"
            >
              <LogIn className="size-5" />
              تسجيل الدخول
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            لا حاجة لتحميل أي شيء — يعمل مباشرة في المتصفح
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">كل ما تحتاجه في مكان واحد</h2>
            <p className="mt-3 text-muted-foreground text-lg">أدوات قوية لبناء ونشر مشاريعك البرمجية</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group h-full border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:border-emerald-900 hover:-translate-y-1">
                  <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-950 dark:group-hover:bg-emerald-900">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 p-10 text-center text-white shadow-xl shadow-emerald-500/20"
        >
          <h2 className="text-2xl font-bold sm:text-3xl">جاهز لبدء رحلتك؟</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100">
            انضم إلى آلاف المطورين الذين يستخدمون كود ستوديو لبناء مشاريعهم المذهلة
          </p>
          <Button
            size="lg"
            onClick={() => navigate('register')}
            className="mt-6 h-12 gap-2 bg-white px-8 text-base font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50 transition-colors"
          >
            ابدأ مجاناً الآن
            <ArrowLeft className="size-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} كود ستوديو — جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}
