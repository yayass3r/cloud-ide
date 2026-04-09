'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store'
import AppHeader from '@/components/layout/AppHeader'
import LandingPage from '@/components/auth/LandingPage'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import UserDashboard from '@/components/dashboard/UserDashboard'
import UserProfile from '@/components/dashboard/UserProfile'
import AdminDashboard from '@/components/admin/AdminDashboard'
import PortfolioView from '@/components/portfolio/PortfolioView'
import IDEView from '@/components/ide/IDEView'
import ProjectTemplates from '@/components/ide/ProjectTemplates'
import { AiChatPanel } from '@/components/chat/AiChatPanel'
import SetupWizard from '@/components/SetupWizard'

// Mock admin user for demo
const demoAdmin = {
  id: 'demo-admin-1',
  email: 'admin@codestudio.dev',
  name: 'أحمد المدير',
  avatar: null,
  bio: 'مطور ويب متحمس وخبير في هندسة البرمجيات',
  role: 'admin' as const,
  skills: '["React","Node.js","TypeScript","Python","Next.js"]',
  githubUrl: 'https://github.com/ahmed',
  isFrozen: false,
  isOnline: true,
  createdAt: new Date('2024-01-15').toISOString(),
  updatedAt: new Date('2025-04-10').toISOString(),
}

export default function Home() {
  const { currentView, user, setUser, aiChatOpen } = useAppStore()
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

  // Auto-login with demo user for quick testing
  useEffect(() => {
    if (!user && dbReady === true) {
      // Check localStorage first
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('codeStudio_user') : null
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          // Ignore parse errors
        }
      } else {
        // Auto-login with demo user
        setUser(demoAdmin)
        if (typeof window !== 'undefined') {
          localStorage.setItem('codeStudio_user', JSON.stringify(demoAdmin))
        }
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
