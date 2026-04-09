'use client'

import { useEffect } from 'react'
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

  // Auto-login with demo user for quick testing
  useEffect(() => {
    if (!user) {
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
  }, [user, setUser])

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
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
