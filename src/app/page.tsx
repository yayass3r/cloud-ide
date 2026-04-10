'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, initAuthFromStorage } from '@/store'
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts'
import { KeyboardShortcutsDialog } from '@/components/ui/KeyboardShortcutsDialog'
import AppHeader from '@/components/layout/AppHeader'
import LandingPage from '@/components/auth/LandingPage'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import UserDashboard from '@/components/dashboard/UserDashboard'
import UserProfile from '@/components/dashboard/UserProfile'
import AdminDashboard from '@/components/admin/AdminDashboard'
import PortfolioView from '@/components/portfolio/PortfolioView'
import IDEView from '@/components/ide/IDEView'
import ProjectTemplates from '@/components/ide/ProjectTemplates'
import { AiChatPanel } from '@/components/chat/AiChatPanel'
import SetupWizard from '@/components/SetupWizard'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

export default function Home() {
  const { currentView, user, setUser, logout, setAiEnabled } = useAppStore()

  // Register global keyboard shortcuts
  useGlobalShortcuts()
  const [dbReady, setDbReady] = useState<boolean | null>(null) // null = checking

  // Check database setup status on mount
  useEffect(() => {
    async function checkDb() {
      try {
        const res = await fetch('/api/setup')
        const data = await res.json()
        setDbReady(data.ready === true)
      } catch {
        // If the request fails, assume not ready
        setDbReady(false)
      }
    }
    checkDb()

    // Fetch platform settings (AI enabled, etc.)
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setAiEnabled(data.settings.aiEnabled !== false)
        }
      })
      .catch(() => {})
  }, [])

  // Restore user session from localStorage and verify JWT with server
  useEffect(() => {
    if (!user && dbReady === true) {
      // Hydrate Zustand from localStorage first (instant UI restore)
      initAuthFromStorage()

      // Then verify the JWT token with the server
      const storedToken = typeof window !== 'undefined'
        ? localStorage.getItem('codeStudio_token')
        : null

      if (storedToken) {
        // Call the session endpoint which verifies the JWT and returns fresh user data
        fetch('/api/auth?action=session', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((res) => {
            if (res.ok) return res.json()
            // Token invalid or expired — clear session completely
            return null
          })
          .then((data) => {
            if (data && data.user) {
              // JWT is valid — update with fresh user data from DB
              setUser(data.user)
            } else {
              // JWT invalid — full logout
              logout()
            }
          })
          .catch(() => {
            // Network error: keep cached session (user was already hydrated by initAuthFromStorage)
            // The cached data is a reasonable fallback when offline
          })
      } else {
        // No token at all — ensure clean state
        logout()
      }
    }
  }, [user, setUser, logout, dbReady])

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  }

  // Show setup wizard while database is not ready
  if (dbReady === false) {
    return <SetupWizard />
  }

  // Show loading while checking
  if (dbReady === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
              <svg className="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 18l6-6-6-6" />
                <path d="M8 6l-6 6 6 6" />
              </svg>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="text-center space-y-2">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-medium text-foreground"
            >
              كود ستوديو
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5"
            >
              <div className="flex gap-1">
                <div className="size-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="size-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="size-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-xs text-muted-foreground">جاري تحميل التطبيق...</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  // IDE view is fullscreen (no header)
  const isFullView = currentView === 'ide'
  // Auth pages show minimal header
  const isAuthPage = currentView === 'landing'
  // New project page has its own dark background
  const isNewProject = currentView === 'new-project'

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />
      case 'login':
        return <LoginForm />
      case 'register':
        return <RegisterForm />
      case 'forgot-password':
        return <ForgotPasswordForm />
      case 'dashboard':
        return <UserDashboard />
      case 'ide':
        return <IDEView />
      case 'profile':
        return <UserProfile />
      case 'admin':
        return <AdminDashboard />
      case 'portfolio':
        return <PortfolioView />
      case 'new-project':
        return <ProjectTemplates />
      default:
        return <LandingPage />
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Header - hidden for fullscreen IDE and landing page */}
      {!isFullView && !isAuthPage && <AppHeader />}

      {/* Main Content */}
      {isFullView || isNewProject ? (
        // Full screen views (IDE, New Project) - no animation wrapper
        renderView()
      ) : isAuthPage ? (
        // Landing page - full bleed
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      ) : (
        // Regular views with padding
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      )}

      {/* AI Chat Panel - floating overlay */}
      <AiChatPanel />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

