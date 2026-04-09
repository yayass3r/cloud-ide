'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Filter, ArrowRight, FolderOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type PublicProject } from '@/store'
import PortfolioCard from './PortfolioCard'

const templateFilters = [
  { value: 'all', label: 'الكل' },
  { value: 'node', label: 'Node.js' },
  { value: 'react', label: 'React' },
  { value: 'python', label: 'Python' },
  { value: 'static', label: 'HTML ثابت' },
]

export default function PortfolioView() {
  const { user, navigate, selectProject } = useAppStore()
  const [projects, setProjects] = useState<PublicProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects/public')
        const data = await res.json()
        setProjects(data.projects || [])
      } catch (err) {
        console.error('Error fetching public projects:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const filteredProjects =
    filter === 'all'
      ? projects
      : projects.filter((p) => p.template === filter)

  const handleOpenIde = (project: PublicProject) => {
    selectProject(project)
    navigate('ide')
  }

  const handleView = (project: PublicProject) => {
    if (project.deployUrl) {
      window.open(project.deployUrl, '_blank')
    } else {
      selectProject(project)
      navigate('ide')
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
              <Globe className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">معرض الأعمال</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                استعرض المشاريع العامة للمستخدمين
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('dashboard')} className="gap-2">
            <ArrowRight className="size-4" />
            العودة
          </Button>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="size-4" />
                <span>تصفية حسب القالب:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {templateFilters.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={filter === tf.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(tf.value)}
                    className="text-xs h-8"
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FolderOpen className="size-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-semibold text-lg mb-1">لا توجد مشاريع عامة حتى الآن</h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm">
                لم يتم نشر أي مشاريع في معرض الأعمال بعد. كن أول من يشارك عمله!
              </p>
              {user && (
                <Button
                  onClick={() => navigate('new-project')}
                  className="mt-4 gap-2"
                  variant="outline"
                >
                  إنشاء مشروع جديد
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredProjects.length} مشروع
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PortfolioCard
                    project={project}
                    isOwner={user?.id === project.userId}
                    onOpenIde={handleOpenIde}
                    onView={handleView}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
