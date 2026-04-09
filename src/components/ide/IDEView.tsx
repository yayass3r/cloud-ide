'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import {
  Play,
  Rocket,
  Bot,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  TerminalSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store'
import FileExplorer from './FileExplorer'
import CodeEditor, { OpenFile } from './CodeEditor'
import Terminal from './Terminal'
import LivePreview from './LivePreview'

function getLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js': case 'jsx': return 'javascript'
    case 'ts': case 'tsx': return 'typescript'
    case 'html': return 'html'
    case 'css': return 'css'
    case 'json': return 'json'
    case 'py': return 'python'
    case 'md': return 'markdown'
    default: return 'text'
  }
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

export default function IDEView() {
  const { currentProject, navigate, toggleAiChat, aiChatOpen } = useAppStore()
  const [explorerOpen, setExplorerOpen] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [terminalKey, setTerminalKey] = useState(0)

  // File state
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})

  const template = currentProject?.template || 'static'

  const activeFile = useMemo(() => {
    return openFiles.find((f) => f.path === activeFilePath) || null
  }, [openFiles, activeFilePath])

  const handleFileSelect = useCallback((filePath: string, content: string) => {
    // Store the content
    setFileContents((prev) => ({ ...prev, [filePath]: content }))

    // If file is already open, just activate it
    if (openFiles.find((f) => f.path === filePath)) {
      setActiveFilePath(filePath)
      return
    }

    const name = filePath.split('/').pop() || filePath
    const language = getLanguage(name)
    const newFile: OpenFile = { path: filePath, name, content, language }
    setOpenFiles((prev) => [...prev, newFile])
    setActiveFilePath(filePath)
  }, [openFiles])

  const handleContentChange = useCallback((path: string, content: string) => {
    setFileContents((prev) => ({ ...prev, [path]: content }))
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content } : f))
    )
  }, [])

  const handleCloseFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const filtered = prev.filter((f) => f.path !== path)
      return filtered
    })
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
    // Update local state immediately
    setFileContents((prev) => ({ ...prev, [path]: content }))

    // Persist to database
    if (!currentProject) return
    try {
      const updatedFiles = { ...fileContents, [path]: content }
      await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentProject.id,
          userId: currentProject.userId,
          files: JSON.stringify(updatedFiles),
        }),
      })
    } catch {
      // Silently handle save errors
    }
  }, [currentProject, fileContents])

  const handleRun = useCallback(() => {
    setIsRunning(true)
    setDeployed(false)
    setTerminalKey((k) => k + 1)
  }, [])

  const handleDeploy = useCallback(() => {
    setIsDeploying(true)
    setTimeout(() => {
      setIsDeploying(false)
      setDeployed(true)
      setTimeout(() => setDeployed(false), 3000)
    }, 2500)
  }, [])

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

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-zinc-100" dir="rtl">
      {/* Top Toolbar */}
      <div className="h-11 flex items-center justify-between px-3 bg-zinc-950 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* Explorer Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            onClick={() => setExplorerOpen(!explorerOpen)}
          >
            {explorerOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>

          {/* Project Name */}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">{currentProject.name}</h2>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTemplateColor(template)}`}>
              {getTemplateLabel(template)}
            </Badge>
          </div>

          {deployed && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" />
              تم النشر
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Run Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            className={`h-7 gap-1.5 text-xs px-3 ${
              isRunning
                ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            تشغيل
          </Button>

          {/* Deploy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeploy}
            disabled={isDeploying}
            className="h-7 gap-1.5 text-xs px-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            {isDeploying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            نشر
          </Button>

          {/* AI Assistant */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAiChat}
            className={`h-7 gap-1.5 text-xs px-3 ${
              aiChatOpen
                ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/15'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            مساعد AI
          </Button>

          {/* Back to Dashboard */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('dashboard')}
            className="h-7 gap-1.5 text-xs px-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            لوحة التحكم
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Explorer */}
          {explorerOpen && (
            <>
              <Panel defaultSize={18} minSize={12} maxSize={30}>
                <FileExplorer
                  template={template}
                  onFileSelect={handleFileSelect}
                  activeFile={activeFilePath}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-zinc-700 transition-colors active:bg-emerald-500/50" />
            </>
          )}

          {/* Editor + Preview/Terminal */}
          <Panel minSize={30}>
            <PanelGroup direction="vertical" className="h-full">
              {/* Editor + Preview */}
              <PanelGroup direction="horizontal" className="flex-1">
                {/* Code Editor */}
                <Panel defaultSize={60} minSize={25}>
                  <CodeEditor
                    files={openFiles}
                    activeFile={activeFile}
                    onContentChange={handleContentChange}
                    onCloseFile={handleCloseFile}
                    onSelectFile={handleSelectFile}
                    onSave={handleSave}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-zinc-700 transition-colors active:bg-emerald-500/50" />

                {/* Live Preview */}
                <Panel defaultSize={40} minSize={20}>
                  <LivePreview
                    files={fileContents}
                    template={template}
                    projectName={currentProject.name}
                    isRunning={isRunning}
                    onRefresh={handleRefreshPreview}
                  />
                </Panel>
              </PanelGroup>

              <PanelResizeHandle className="h-1 bg-zinc-800 hover:bg-zinc-700 transition-colors active:bg-emerald-500/50" />

              {/* Terminal */}
              <Panel defaultSize={25} minSize={12} maxSize={50}>
                <Terminal
                  key={terminalKey}
                  template={template}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
