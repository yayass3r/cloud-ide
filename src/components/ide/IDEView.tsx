'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import {
  Play,
  Rocket,
  Bot,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Loader2,
  Code2,
  Eye,
  TerminalSquare,
  FolderTree,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store'
import FileExplorer from './FileExplorer'
import CodeEditor, { OpenFile } from './CodeEditor'
import { getLanguageFromFileName } from './MonacoEditor'
import Terminal from './Terminal'
import LivePreview from './LivePreview'

function getLanguage(name: string): string {
  return getLanguageFromFileName(name, 'plaintext')
}

function getTemplateLabel(template: string): string {
  switch (template) {
    case 'node': return 'Node.js'
    case 'react': return 'React'
    case 'static': return 'HTML/CSS/JS'
    case 'python': return 'Python'
    default: return template
  }
}

function getTemplateColor(template: string): string {
  switch (template) {
    case 'node': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'react': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
    case 'static': return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    case 'python': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    default: return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
  }
}

type MobileTab = 'editor' | 'preview' | 'terminal'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}

export default function IDEView() {
  const { currentProject, navigate, toggleAiChat, aiChatOpen, apiFetch } = useAppStore()
  const [explorerOpen, setExplorerOpen] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [deployLogs, setDeployLogs] = useState<string[]>([])
  const [deployStatus, setDeployStatus] = useState<'idle' | 'pending' | 'building' | 'deployed' | 'failed'>('idle')
  const [terminalKey, setTerminalKey] = useState(0)
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor')
  const [showExplorerSheet, setShowExplorerSheet] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const isMobile = useIsMobile()

  // File state
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})

  const template = currentProject?.template || 'static'

  const activeFile = useMemo(() => {
    return openFiles.find((f) => f.path === activeFilePath) || null
  }, [openFiles, activeFilePath])

  const handleFileSelect = useCallback((filePath: string, content: string) => {
    setFileContents((prev) => ({ ...prev, [filePath]: content }))
    if (openFiles.find((f) => f.path === filePath)) {
      setActiveFilePath(filePath)
      return
    }
    const name = filePath.split('/').pop() || filePath
    const language = getLanguage(name)
    const newFile: OpenFile = { path: filePath, name, content, language }
    setOpenFiles((prev) => [...prev, newFile])
    setActiveFilePath(filePath)
    // Auto-switch to editor tab on mobile
    setMobileTab('editor')
    setShowExplorerSheet(false)
  }, [openFiles])

  const handleContentChange = useCallback((path: string, content: string) => {
    setFileContents((prev) => ({ ...prev, [path]: content }))
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content } : f))
    )
  }, [])

  const handleCloseFile = useCallback((path: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== path))
    setActiveFilePath((prev) => {
      if (prev === path) {
        const remaining = openFiles.filter((f) => f.path !== path)
        return remaining.length > 0 ? remaining[remaining.length - 1].path : null
      }
      return prev
    })
  }, [openFiles])

  const handleSelectFile = useCallback((path: string) => {
    setActiveFilePath(path)
  }, [])

  const handleSave = useCallback(async (path: string, content: string) => {
    setFileContents((prev) => ({ ...prev, [path]: content }))
    if (!currentProject) return
    try {
      const updatedFiles = { ...fileContents, [path]: content }
      await apiFetch('/api/projects', {
        method: 'PUT',
        body: JSON.stringify({
          id: currentProject.id,
          userId: currentProject.userId,
          files: JSON.stringify(updatedFiles),
        }),
      })
    } catch {
      // Silently handle save errors
    }
  }, [currentProject, fileContents, apiFetch])

  const handleRun = useCallback(() => {
    setIsRunning(true)
    setDeployed(false)
    setTerminalKey((k) => k + 1)
    setMobileTab('preview')
  }, [])

  const handleDeploy = useCallback(async () => {
    if (!currentProject) return
    setIsDeploying(true)
    setDeployStatus('pending')
    setDeployLogs(['بدء عملية النشر...'])
    setDeployUrl(null)
    setShowMobileMenu(false)

    try {
      setDeployStatus('building')
      setDeployLogs(prev => [...prev, 'تحليل الملفات وإنشاء حزمة النشر...'])

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          userId: currentProject.userId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setDeployStatus('deployed')
        setDeployed(true)
        setDeployUrl(data.deployUrl || null)
        setDeployLogs(prev => [...prev, ...(data.logs?.map((l: { message: string }) => l.message) || []), data.message])
        setTimeout(() => setDeployed(false), 5000)
      } else {
        setDeployStatus('failed')
        setDeployLogs(prev => [...prev, data.error || 'فشل في النشر'])
        setTimeout(() => setDeployStatus('idle'), 4000)
      }
    } catch {
      setDeployStatus('failed')
      setDeployLogs(prev => [...prev, 'خطأ في الاتصال بالخادم'])
      setTimeout(() => setDeployStatus('idle'), 4000)
    } finally {
      setIsDeploying(false)
    }
  }, [currentProject])

  const handleRefreshPreview = useCallback(() => {
    setTerminalKey((k) => k + 1)
    setIsRunning(false)
    setTimeout(() => setIsRunning(true), 100)
  }, [])

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-zinc-400">
        <p>لا يوجد مشروع محدد</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // MOBILE VIEW
  // ─────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="h-dvh flex flex-col bg-zinc-900 text-zinc-100" dir="rtl">
        {/* Mobile Top Bar */}
        <div className="h-12 flex items-center justify-between px-3 bg-zinc-950 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 shrink-0"
              onClick={() => setShowExplorerSheet(true)}
            >
              <FolderTree className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold text-zinc-200 truncate">{currentProject.name}</h2>
            <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${getTemplateColor(template)}`}>
              {getTemplateLabel(template)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {deployed && deployUrl && (
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  تم ✓
                </Badge>
              </a>
            )}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-zinc-400"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute top-full left-0 mt-1 z-50 w-44 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                      onClick={() => { handleRun(); setShowMobileMenu(false) }}
                    >
                      <Play className="h-3.5 w-3.5 text-emerald-400" />
                      تشغيل
                    </button>
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                      onClick={() => { handleDeploy(); }}
                      disabled={isDeploying}
                    >
                      {isDeploying ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" /> : <Rocket className="h-3.5 w-3.5 text-amber-400" />}
                      {isDeploying ? 'جاري النشر...' : 'نشر'}
                    </button>
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                      onClick={() => { toggleAiChat(); setShowMobileMenu(false) }}
                    >
                      <Bot className="h-3.5 w-3.5 text-purple-400" />
                      مساعد AI
                    </button>
                    <div className="border-t border-zinc-700 my-1" />
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-400 hover:bg-zinc-700 transition-colors"
                      onClick={() => { navigate('dashboard'); setShowMobileMenu(false) }}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      لوحة التحكم
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex items-center bg-zinc-950 border-b border-zinc-800 shrink-0">
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              mobileTab === 'editor'
                ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Code2 className="h-4 w-4" />
            محرر
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              mobileTab === 'preview'
                ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Eye className="h-4 w-4" />
            معاينة
          </button>
          <button
            onClick={() => setMobileTab('terminal')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              mobileTab === 'terminal'
                ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <TerminalSquare className="h-4 w-4" />
            طرفية
          </button>
        </div>

        {/* Mobile Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Editor Tab */}
          <div className={`absolute inset-0 ${mobileTab === 'editor' ? 'z-10' : 'z-0 pointer-events-none'}`}>
            <CodeEditor
              files={openFiles}
              activeFile={activeFile}
              onContentChange={handleContentChange}
              onCloseFile={handleCloseFile}
              onSelectFile={handleSelectFile}
              onSave={handleSave}
            />
          </div>

          {/* Preview Tab */}
          <div className={`absolute inset-0 ${mobileTab === 'preview' ? 'z-10' : 'z-0 pointer-events-none'}`}>
            <LivePreview
              files={fileContents}
              template={template}
              projectName={currentProject.name}
              isRunning={isRunning}
              onRefresh={handleRefreshPreview}
            />
          </div>

          {/* Terminal Tab */}
          <div className={`absolute inset-0 ${mobileTab === 'terminal' ? 'z-10' : 'z-0 pointer-events-none'}`}>
            <Terminal
              key={terminalKey}
              template={template}
            />
          </div>
        </div>

        {/* Mobile Explorer Sheet */}
        {showExplorerSheet && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowExplorerSheet(false)} />
            <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-50 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between h-12 px-3 bg-zinc-950 border-b border-zinc-800">
                <span className="text-sm font-medium text-zinc-300">مستعرض الملفات</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400"
                  onClick={() => setShowExplorerSheet(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-[calc(100%-48px)] overflow-auto">
                <FileExplorer
                  template={template}
                  onFileSelect={handleFileSelect}
                  activeFile={activeFilePath}
                />
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // DESKTOP VIEW (original)
  // ─────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-zinc-100" dir="rtl">
      {/* Top Toolbar */}
      <div className="h-11 flex items-center justify-between px-3 bg-zinc-950 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            onClick={() => setExplorerOpen(!explorerOpen)}
          >
            {explorerOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">{currentProject.name}</h2>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTemplateColor(template)}`}>
              {getTemplateLabel(template)}
            </Badge>
          </div>

          {deployed && (
            <a href={deployUrl || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex">
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 cursor-pointer hover:bg-emerald-500/25 transition-colors">
                <CheckCircle2 className="h-3 w-3" />
                تم النشر {deployUrl && '↗'}
              </Badge>
            </a>
          )}
          {deployStatus === 'failed' && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              فشل النشر
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleRun}
            className={`h-7 gap-1.5 text-xs px-3 ${isRunning ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
            <Play className="h-3.5 w-3.5" /> تشغيل
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDeploy} disabled={isDeploying}
            className={`h-7 gap-1.5 text-xs px-3 ${isDeploying ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/15' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
            {isDeploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            {isDeploying ? 'جاري النشر...' : 'نشر'}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleAiChat}
            className={`h-7 gap-1.5 text-xs px-3 ${aiChatOpen ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/15' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
            <Bot className="h-3.5 w-3.5" /> مساعد AI
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('dashboard')}
            className="h-7 gap-1.5 text-xs px-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
            <ArrowRight className="h-3.5 w-3.5" /> لوحة التحكم
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {explorerOpen && (
            <>
              <Panel defaultSize={18} minSize={12} maxSize={30}>
                <FileExplorer template={template} onFileSelect={handleFileSelect} activeFile={activeFilePath} />
              </Panel>
              <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-zinc-700 transition-colors active:bg-emerald-500/50" />
            </>
          )}

          <Panel minSize={30}>
            <PanelGroup direction="vertical" className="h-full">
              <PanelGroup direction="horizontal" className="flex-1">
                <Panel defaultSize={60} minSize={25}>
                  <CodeEditor files={openFiles} activeFile={activeFile} onContentChange={handleContentChange} onCloseFile={handleCloseFile} onSelectFile={handleSelectFile} onSave={handleSave} />
                </Panel>
                <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-zinc-700 transition-colors active:bg-emerald-500/50" />
                <Panel defaultSize={40} minSize={20}>
                  <LivePreview files={fileContents} template={template} projectName={currentProject.name} isRunning={isRunning} onRefresh={handleRefreshPreview} />
                </Panel>
              </PanelGroup>

              <PanelResizeHandle className="h-1 bg-zinc-800 hover:bg-zinc-700 transition-colors active:bg-emerald-500/50" />
              <Panel defaultSize={25} minSize={12} maxSize={50}>
                <Terminal key={terminalKey} template={template} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
