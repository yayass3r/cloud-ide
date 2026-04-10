'use client'

import { useAppStore, type AppView } from '@/store'
import { cn } from '@/lib/utils'
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
      <div className="flex items-center justify-around px-2 py-1">
        {visibleItems.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon

          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-lg transition-all touch-target',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'flex items-center justify-center size-8 rounded-lg transition-all',
                isActive
                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                  : 'hover:bg-muted/50'
              )}>
                <Icon className="size-4.5" />
              </div>
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
