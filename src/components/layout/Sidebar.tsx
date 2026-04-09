'use client'

import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  FolderOpen,
  Plus,
  Code,
  Globe,
  Archive,
  FileCode2,
  FlaskConical,
  LayoutGrid,
  X,
} from 'lucide-react'

const templateIcons: Record<string, React.ReactNode> = {
  react: <FileCode2 className="size-4 text-cyan-500" />,
  node: <Code className="size-4 text-green-500" />,
  python: <FlaskConical className="size-4 text-yellow-500" />,
  static: <LayoutGrid className="size-4 text-orange-500" />,
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  archived: { label: 'مؤرشف', variant: 'secondary' },
  frozen: { label: 'مجمد', variant: 'destructive' },
}

export default function Sidebar() {
  const { projects, currentProject, selectProject, sidebarOpen, toggleSidebar, currentView, navigate } = useAppStore()

  const visibleViews = ['dashboard', 'ide', 'portfolio']
  if (!visibleViews.includes(currentView)) return null

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 right-0 z-40 h-[calc(100vh-4rem)] w-72 border-l border-border bg-card
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          md:translate-x-0 md:relative md:top-0 md:h-full md:z-0
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="size-5 text-emerald-500" />
              <h2 className="text-sm font-semibold">المشاريع النشطة</h2>
              <Badge variant="secondary" className="text-xs">
                {projects.filter(p => p.status === 'active').length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={() => {
                  navigate('dashboard')
                  if (window.innerWidth < 768) toggleSidebar()
                }}
                title="مشروع جديد"
              >
                <Plus className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 md:hidden"
                onClick={toggleSidebar}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Project list */}
          <ScrollArea className="flex-1 p-2">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                <FolderOpen className="size-12 opacity-30" />
                <p className="text-sm">لا توجد مشاريع بعد</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={() => navigate('dashboard')}
                >
                  <Plus className="size-4" />
                  إنشاء مشروع
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {projects.map((project) => {
                  const isActive = currentProject?.id === project.id
                  const status = statusConfig[project.status] || statusConfig.active
                  const templateIcon = templateIcons[project.template] || templateIcons.node

                  return (
                    <button
                      key={project.id}
                      onClick={() => {
                        selectProject(project)
                        navigate('ide')
                        if (window.innerWidth < 768) toggleSidebar()
                      }}
                      className={`
                        group flex items-start gap-3 rounded-lg p-3 text-right transition-colors
                        ${isActive
                          ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
                          : 'hover:bg-muted/50 text-foreground'
                        }
                      `}
                    >
                      <div className={`
                        mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg
                        ${isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900'
                          : 'bg-muted'
                        }
                      `}>
                        {templateIcon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${isActive ? '' : ''}`}>
                            {project.name}
                          </p>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                            {status.label}
                          </Badge>
                          {project.isPublic && (
                            <Globe className="size-3 text-muted-foreground" />
                          )}
                          {project.status === 'archived' && (
                            <Archive className="size-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {projects.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={() => navigate('dashboard')}
                >
                  <Plus className="size-4" />
                  مشروع جديد
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
