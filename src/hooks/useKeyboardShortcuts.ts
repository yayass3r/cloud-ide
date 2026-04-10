'use client'

import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'

interface ShortcutConfig {
  key: string
  ctrlOrMeta?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
  enabled?: () => boolean
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+S even in inputs (save is universal)
        const isSave = e.key === 's' && (e.ctrlKey || e.metaKey) && !e.shiftKey
        if (!isSave) return
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlOrMeta
          ? e.ctrlKey || e.metaKey
          : true
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          if (shortcut.enabled && !shortcut.enabled()) continue
          e.preventDefault()
          e.stopPropagation()
          shortcut.action()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Predefined global shortcuts for the IDE app
 */
export function useGlobalShortcuts() {
  const { toggleSidebar, toggleAiChat, navigate, currentView, user } = useAppStore()

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'b',
      ctrlOrMeta: true,
      description: 'تبديل الشريط الجانبي',
      action: toggleSidebar,
    },
    {
      key: 'i',
      ctrlOrMeta: true,
      shift: true,
      description: 'تبديل مساعد الذكاء الاصطناعي',
      action: toggleAiChat,
    },
    {
      key: '/',
      ctrlOrMeta: true,
      shift: true,
      description: 'عرض اختصارات لوحة المفاتيح',
      action: () => {
        const event = new CustomEvent('toggle-shortcuts-dialog')
        window.dispatchEvent(event)
      },
    },
    {
      key: ',',
      ctrlOrMeta: true,
      description: 'لوحة تحكم المدير',
      action: () => {
        if (user?.role === 'admin') {
          navigate(currentView === 'admin' ? 'dashboard' : 'admin')
        }
      },
      enabled: () => user?.role === 'admin',
    },
    {
      key: 'Escape',
      description: 'العودة للوحة التحكم',
      action: () => {
        if (currentView === 'ide') {
          navigate('dashboard')
        }
      },
      enabled: () => currentView === 'ide',
    },
  ]

  useKeyboardShortcuts(shortcuts)
}
