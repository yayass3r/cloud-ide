'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Code2, Globe, TerminalSquare, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store'

interface Template {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  badge: string
}

const templates: Template[] = [
  {
    id: 'node',
    title: 'خادم Node.js',
    description: 'مشروع خادم مع Express',
    icon: <TerminalSquare className="h-8 w-8" />,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Node.js',
  },
  {
    id: 'react',
    title: 'تطبيق React',
    description: 'تطبيق ويب تفاعلي',
    icon: <Code2 className="h-8 w-8" />,
    color: 'from-cyan-500 to-blue-600',
    badge: 'React',
  },
  {
    id: 'static',
    title: 'صفحة ويب ثابتة',
    description: 'موقع ثابت بـ HTML',
    icon: <Globe className="h-8 w-8" />,
    color: 'from-orange-500 to-red-600',
    badge: 'HTML/CSS/JS',
  },
  {
    id: 'python',
    title: 'سكريبت Python',
    description: 'تطبيق Python بسيط',
    icon: <Play className="h-8 w-8" />,
    color: 'from-yellow-500 to-amber-600',
    badge: 'Python',
  },
]

export default function ProjectTemplates() {
  const { user, selectProject, navigate } = useAppStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')

  const handleCreate = async (templateId: string, title: string) => {
    if (!user) return
    setLoading(templateId)

    const name = projectName.trim() || title
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, template: templateId, userId: user.id }),
      })
      if (res.ok) {
        const data = await res.json()
        selectProject(data.project)
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('dashboard')}
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-l from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            إنشاء مشروع جديد
          </h1>
          <p className="text-zinc-400 text-lg">
            اختر قالبًا لبدء مشروعك السريع
          </p>
        </motion.div>

        {/* Project Name Input */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="اسم المشروع (اختياري)"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-center"
            dir="rtl"
          />
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-600 transition-all duration-300 group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${template.color} text-white shadow-lg`}>
                      {template.icon}
                    </div>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">
                      {template.badge}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-100 mb-2">
                    {template.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    {template.description}
                  </p>

                  <Button
                    onClick={() => handleCreate(template.id, template.title)}
                    disabled={loading === template.id}
                    className={`w-full bg-gradient-to-l ${template.color} text-white hover:opacity-90 transition-all duration-300`}
                  >
                    {loading === template.id ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جارٍ الإنشاء...
                      </span>
                    ) : (
                      'إنشاء'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
