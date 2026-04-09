'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FolderOpen,
  Rocket,
  Globe,
  Calendar,
  Plus,
  User,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Project } from '@/store'

interface Stats {
  projects: number
  deployments: number
  publicProjects: number
  activeDays: number
}

const templateLabels: Record<string, string> = {
  node: 'Node.js',
  react: 'React',
  python: 'Python',
  static: 'HTML ثابت',
}

const templateColors: Record<string, string> = {
  node: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  react: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  python: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  static: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-emerald-500' },
  archived: { label: 'مؤرشف', color: 'bg-gray-400' },
  frozen: { label: 'متجمد', color: 'bg-blue-400' },
}

export default function UserDashboard() {
  const { user, navigate, selectProject, setProjects } = useAppStore()
  const [projects, setLocalProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const arabicDate = today.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      try {
        const res = await fetch(`/api/projects?userId=${user.id}`)
        const data = await res.json()
        const projectList: Project[] = data.projects || []
        setLocalProjects(projectList)
        setProjects(projectList)

        const deployments = projectList.reduce(
          (acc: number, p: Project & { _count?: { deployments: number } }) =>
            acc + ((p as Record<string, unknown>)._count as Record<string, number>)?.deployments || 0,
          0
        )
        const publicCount = projectList.filter((p) => p.isPublic).length

        // Calculate active days from project creation dates
        const uniqueDays = new Set(
          projectList.map((p) => new Date(p.createdAt).toDateString())
        )
        const activeDays = Math.max(uniqueDays.size, 1)

        setStats({
          projects: projectList.length,
          deployments,
          publicProjects: publicCount,
          activeDays,
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const handleTogglePublic = async (project: Project) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id, isPublic: !project.isPublic }),
      })
      const data = await res.json()
      if (data.project) {
        const updatedList = projects.map((p) => (p.id === project.id ? { ...p, isPublic: !p.isPublic } : p))
        setLocalProjects(updatedList)
        setProjects(updatedList)
      }
    } catch (err) {
      console.error('Error toggling project visibility:', err)
    }
  }

  const handleOpenIde = (project: Project) => {
    selectProject(project)
    navigate('ide')
  }

  const statCards = [
    {
      title: 'مشاريعي',
      value: stats?.projects ?? 0,
      icon: FolderOpen,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'المنشورات',
      value: stats?.deployments ?? 0,
      icon: Rocket,
      color: 'blue',
      gradient: 'from-sky-500 to-blue-600',
      bgLight: 'bg-sky-50 dark:bg-sky-950/30',
      iconBg: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400',
    },
    {
      title: 'معرض الأعمال',
      value: stats?.publicProjects ?? 0,
      icon: Globe,
      color: 'purple',
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50 dark:bg-violet-950/30',
      iconBg: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400',
    },
    {
      title: 'أيام النشاط',
      value: stats?.activeDays ?? 0,
      icon: Calendar,
      color: 'orange',
      gradient: 'from-orange-500 to-amber-600',
      bgLight: 'bg-orange-50 dark:bg-orange-950/30',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
    },
  ]

  if (!user) return null

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              مرحباً، {user.name} 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{arabicDate}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('new-project')} className="gap-2">
              <Plus className="size-4" />
              <span className="hidden sm:inline">مشروع جديد</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('profile')} className="gap-2">
              <User className="size-4" />
              <span className="hidden sm:inline">الملف الشخصي</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">
                      {card.title}
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-12 mt-2 rounded-md" />
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold mt-2">{card.value}</p>
                    )}
                  </div>
                  <div className={`p-2.5 md:p-3 rounded-xl ${card.iconBg}`}>
                    <card.icon className="size-5 md:size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">مشاريعي الأخيرة</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('portfolio')}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <Globe className="size-4" />
            عرض الكل
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 md:gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">لا توجد مشاريع بعد</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                ابدأ بإنشاء مشروعك الأول
              </p>
              <Button
                onClick={() => navigate('new-project')}
                className="mt-4 gap-2"
                variant="outline"
              >
                <Plus className="size-4" />
                إنشاء مشروع
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {projects.slice(0, 5).map((project, index) => {
              const statusInfo = statusLabels[project.status] || statusLabels.active
              const tplColor = templateColors[project.template] || templateColors.node

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 group">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-2 h-10 rounded-full ${statusInfo.color} shrink-0`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm md:text-base truncate">
                                {project.name}
                              </h3>
                              <Badge variant="secondary" className={`text-xs ${tplColor}`}>
                                {templateLabels[project.template] || project.template}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>
                                {new Date(project.createdAt).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusInfo.color}`}
                                />
                                {statusInfo.label}
                              </span>
                              {project.isPublic && (
                                <Badge variant="outline" className="text-xs gap-1 py-0">
                                  <Globe className="size-3" />
                                  عام
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublic(project)}
                            className="gap-1 text-xs"
                            title={project.isPublic ? 'إلغاء النشر' : 'نشر'}
                          >
                            {project.isPublic ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                            <span className="hidden md:inline">
                              {project.isPublic ? 'إلغاء النشر' : 'نشر'}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!project.isDeployed}
                            className="gap-1 text-xs"
                            title="نشر المشروع"
                          >
                            <ExternalLink className="size-3.5" />
                            <span className="hidden md:inline">نشر</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenIde(project)}
                            className="gap-1 text-xs"
                          >
                            <Loader2 className="size-3.5 hidden" />
                            <span>فتح</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Quick Actions (Mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex sm:hidden gap-3"
      >
        <Button
          onClick={() => navigate('new-project')}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Plus className="size-4" />
          مشروع جديد
        </Button>
        <Button
          onClick={() => navigate('profile')}
          variant="outline"
          className="flex-1 gap-2"
        >
          <User className="size-4" />
          عرض الملف الشخصي
        </Button>
      </motion.div>
    </div>
  )
}
