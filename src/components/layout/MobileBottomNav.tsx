'use client'

import { useAppStore, type AppView } from '@/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FolderPlus,
  User,
  Shield,
  Code2,
  Globe,
} from 'lucide-react'

interface NavItem {
  view: AppView
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { view: 'new-project', label: 'مشروع جديد', icon: FolderPlus },
  { view: 'portfolio', label: 'المعرض', icon: Globe },
  { view: 'profile', label: 'ملفي', icon: User },
  { view: 'admin', label: 'المدير', icon: Shield, adminOnly: true },
]

export default function MobileBottomNav() {
  const { currentView, navigate, user } = useAppStore()

  // Don't show on IDE, landing, or auth pages
  const hiddenViews: AppView[] = ['ide', 'landing', 'login', 'register', 'forgot-password']
  if (hiddenViews.includes(currentView)) return null
  if (!user) return null

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {visibleItems.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon

          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-2.5 rounded-xl transition-all touch-target min-w-[56px]"
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="navActivePill"
                  className="absolute inset-x-2 -inset-y-0.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Icon container */}
              <div className={cn(
                'relative flex items-center justify-center size-7 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
                <Icon className="size-4.5" />
              </div>

              {/* Label */}
              <span className={cn(
                'relative text-[10px] font-medium leading-tight transition-all duration-200',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-muted-foreground'
              )}>
                {item.label}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="navActiveDot"
                  className="absolute -bottom-0.5 size-1 rounded-full bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
