'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Command, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShortcutItem {
  keys: string[]
  description: string
  category: string
}

const shortcuts: ShortcutItem[] = [
  // General
  { keys: ['Ctrl', 'B'], description: 'تبديل الشريط الجانبي', category: 'عام' },
  { keys: ['Ctrl', 'Shift', 'I'], description: 'تبديل مساعد الذكاء الاصطناعي', category: 'عام' },
  { keys: ['Ctrl', 'Shift', '/'], description: 'عرض اختصارات لوحة المفاتيح', category: 'عام' },
  { keys: ['Ctrl', ','], description: 'لوحة تحكم المدير', category: 'عام' },
  { keys: ['Escape'], description: 'العودة من المحرر', category: 'عام' },
  // Editor
  { keys: ['Ctrl', 'S'], description: 'حفظ الملف الحالي', category: 'المحرر' },
  { keys: ['Ctrl', 'P'], description: 'بحث سريع عن ملف', category: 'المحرر' },
  { keys: ['Ctrl', 'W'], description: 'إغلاق التبويب الحالي', category: 'المحرر' },
  { keys: ['Ctrl', 'Tab'], description: 'التبديل بين التبويبات', category: 'المحرر' },
]

const categories = ['عام', 'المحرر']

function KeyBadge({ text }: { text: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-muted border border-border text-xs font-mono font-medium text-foreground shadow-sm">
      {text}
    </kbd>
  )
}

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen((prev) => !prev)
    window.addEventListener('toggle-shortcuts-dialog', handler)
    return () => window.removeEventListener('toggle-shortcuts-dialog', handler)
  }, [])

  // Close on Escape (second press)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <Keyboard className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">اختصارات لوحة المفاتيح</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      استخدم هذه الاختصارات لتسريع عملك
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                {categories.map((category) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {shortcuts
                        .filter((s) => s.category === category)
                        .map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <span className="text-sm text-foreground">{shortcut.description}</span>
                            <div className="flex items-center gap-1" dir="ltr">
                              {shortcut.keys.map((key, keyIndex) => (
                                <span key={keyIndex} className="flex items-center gap-1">
                                  {keyIndex > 0 && (
                                    <span className="text-[10px] text-muted-foreground mx-0.5">+</span>
                                  )}
                                  <KeyBadge text={key} />
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/30">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Command className="size-3" />
                  <span>اضغط على أي مكان خارج النافذة أو Escape للإغلاق</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
