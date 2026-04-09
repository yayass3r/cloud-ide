'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, initAuthFromStorage } from '@/store'
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

export default function Home() {
  const { currentView, user, setUser } = useAppStore()
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
  }, [])

  // Restore user session from localStorage (including token)
  useEffect(() => {
    if (!user && dbReady === true) {
      initAuthFromStorage()

      // Verify the stored token is still valid
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('codeStudio_token') : null
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('codeStudio_user') : null

      if (storedUser && storedToken) {
        // Verify token with server
        fetch('/api/auth', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((res) => {
            if (res.ok) return res.json()
            // Token invalid — clear everything
            localStorage.removeItem('codeStudio_user')
            localStorage.removeItem('codeStudio_token')
            return null
          })
          .then((data) => {
            if (data && data.user) {
              setUser(data.user)
            }
          })
          .catch(() => {
            // On network error, still try to use cached user
            try {
              setUser(JSON.parse(storedUser))
            } catch {
              // ignore
            }
          })
      } else if (storedUser) {
        // No token but have user — clear user (need re-login)
        localStorage.removeItem('codeStudio_user')
      }
    }
  }, [user, setUser, dbReady])

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
          className="flex flex-col items-center gap-4"
        >
          <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <svg className="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </motion.div>
          </div>
          <p className="text-sm text-muted-foreground">جاري تحميل التطبيق...</p>
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
    <div className="min-h-screen bg-background">
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
    </div>
  )
}
