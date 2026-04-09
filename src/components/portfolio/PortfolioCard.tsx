'use client'

import { motion } from 'framer-motion'
import {
  ExternalLink,
  Code2,
  Eye,
  GitFork,
  MonitorSmartphone,
  Server,
  FileCode,
  Globe,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PublicProject } from '@/store'

interface PortfolioCardProps {
  project: PublicProject
  isOwner?: boolean
  onOpenIde?: (project: PublicProject) => void
  onView?: (project: PublicProject) => void
}

const templateConfig: Record<
  string,
  {
    label: string
    icon: typeof Code2
    gradient: string
    bgPattern: string
  }
> = {
  node: {
    label: 'Node.js',
    icon: Server,
    gradient: 'from-emerald-500 to-teal-600',
    bgPattern: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  react: {
    label: 'React',
    icon: MonitorSmartphone,
    gradient: 'from-sky-500 to-blue-600',
    bgPattern: 'bg-sky-50 dark:bg-sky-950/30',
  },
  python: {
    label: 'Python',
    icon: Code2,
    gradient: 'from-amber-500 to-yellow-600',
    bgPattern: 'bg-amber-50 dark:bg-amber-950/30',
  },
  static: {
    label: 'HTML ثابت',
    icon: FileCode,
    gradient: 'from-violet-500 to-purple-600',
    bgPattern: 'bg-violet-50 dark:bg-violet-950/30',
  },
}

export default function PortfolioCard({
  project,
  isOwner = false,
  onOpenIde,
  onView,
}: PortfolioCardProps) {
  const config = templateConfig[project.template] || templateConfig.node
  const TemplateIcon = config.icon

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500',
    archived: 'bg-gray-400',
    frozen: 'bg-blue-400',
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl group">
        {/* Preview Area */}
        <div
          className={`relative h-40 md:h-48 ${config.bgPattern} overflow-hidden`}
        >
          {/* Gradient overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
          />

          {/* Decorative elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Background circle */}
              <motion.div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`p-4 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-lg`}
                >
                  <TemplateIcon className="size-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${statusColors[project.status] || statusColors.active}`}
            />
            <Badge
              variant="secondary"
              className="text-xs backdrop-blur-sm bg-background/80"
            >
              {config.label}
            </Badge>
          </div>

          {/* Public badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="outline" className="text-xs gap-1 backdrop-blur-sm bg-background/80">
              <Globe className="size-3" />
              عام
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-base md:text-lg truncate">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Author info */}
          {project.user && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{project.user.name}</span>
              <span>•</span>
              <span>
                {new Date(project.updatedAt).toLocaleDateString('ar-EG', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1 text-xs h-8"
              onClick={() => onView?.(project)}
            >
              <Eye className="size-3.5" />
              عرض المشروع
            </Button>
            {isOwner && (
              <>
                <Button
                  size="sm"
                  className="flex-1 gap-1 text-xs h-8"
                  onClick={() => onOpenIde?.(project)}
                >
                  <ExternalLink className="size-3.5" />
                  فتح في IDE
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0"
                  title="نسخ المشروع"
                >
                  <GitFork className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
