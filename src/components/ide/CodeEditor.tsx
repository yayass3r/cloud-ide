'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { X, Save, FileCode, FileText, FileJson } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface OpenFile {
  path: string
  name: string
  content: string
  language: string
}

interface CodeEditorProps {
  files: OpenFile[]
  activeFile: OpenFile | null
  onContentChange: (path: string, content: string) => void
  onCloseFile: (path: string) => void
  onSelectFile: (path: string) => void
  onSave: (path: string, content: string) => void
}

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

function getFileTabIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'json': return <FileJson className="h-3.5 w-3.5 text-green-400" />
    case 'js': case 'jsx': case 'ts': case 'tsx': case 'py': case 'css': case 'html':
      return <FileCode className="h-3.5 w-3.5 text-blue-400" />
    default:
      return <FileText className="h-3.5 w-3.5 text-zinc-400" />
  }
}

function simpleHighlight(code: string, language: string): string {
  // Very basic syntax highlighting for visual effect
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (language === 'javascript' || language === 'typescript' || language === 'jsx' || language === 'tsx') {
    // Strings
    highlighted = highlighted.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span style="color:#fbbf24">$&</span>')
    // Keywords
    highlighted = highlighted.replace(/\b(const|let|var|function|return|if|else|for|while|import|from|export|default|class|extends|new|this|async|await|try|catch|throw|typeof|instanceof|switch|case|break|continue|require)\b/g, '<span style="color:#c084fc">$&</span>')
    // Comments
    highlighted = highlighted.replace(/(\/\/.*)/g, '<span style="color:#6b7280">$&</span>')
    // Numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color:#fb923c">$&</span>')
    // Functions
    highlighted = highlighted.replace(/(\w+)(?=\s*\()/g, '<span style="color:#60a5fa">$&</span>')
  } else if (language === 'html') {
    // Tags
    highlighted = highlighted.replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#f472b6">$2</span>')
    // Attributes
    highlighted = highlighted.replace(/\s([\w-]+)(=)/g, ' <span style="color:#60a5fa">$1</span><span style="color:#94a3b8">$2</span>')
    // Strings in tags
    highlighted = highlighted.replace(/(["'])(?:(?!\1|\\).|\\.)*?\1/g, '<span style="color:#fbbf24">$&</span>')
  } else if (language === 'css') {
    // Selectors (before {)
    highlighted = highlighted.replace(/([.#][\w-]+)/g, '<span style="color:#60a5fa">$&</span>')
    // Properties (before :)
    highlighted = highlighted.replace(/([\w-]+)(\s*:)/g, '<span style="color:#c084fc">$1</span>$2')
    // Values after :
    highlighted = highlighted.replace(/(:\s*)([^;]+)/g, '$1<span style="color:#fbbf24">$2</span>')
  } else if (language === 'python') {
    highlighted = highlighted.replace(/(#.*)/g, '<span style="color:#6b7280">$&</span>')
    highlighted = highlighted.replace(/(["']{3}[\s\S]*?["']{3})/g, '<span style="color:#fbbf24">$&</span>')
    highlighted = highlighted.replace(/(["'](?:(?!\1|\\).|\\.)*?\1)/g, '<span style="color:#fbbf24">$&</span>')
    highlighted = highlighted.replace(/\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|with|as|try|except|finally|raise|pass|break|continue|yield|lambda|True|False|None|print|self)\b/g, '<span style="color:#c084fc">$&</span>')
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color:#fb923c">$&</span>')
    highlighted = highlighted.replace(/(\w+)(?=\s*\()/g, '<span style="color:#60a5fa">$&</span>')
  } else if (language === 'json') {
    highlighted = highlighted.replace(/("[\w@/._-]*")(\s*:)/g, '<span style="color:#60a5fa">$1</span>$2')
    highlighted = highlighted.replace(/:\s*(".*?")/g, ': <span style="color:#fbbf24">$1</span>')
  }

  return highlighted
}

export default function CodeEditor({ files, activeFile, onContentChange, onCloseFile, onSelectFile, onSave }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  const lines = useMemo(() => {
    if (!activeFile) return []
    return activeFile.content.split('\n')
  }, [activeFile?.content, activeFile])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onContentChange(activeFile!.path, newValue)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (activeFile) {
        onSave(activeFile.path, activeFile.content)
      }
    }
  }, [activeFile, onContentChange, onSave])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    onContentChange(activeFile!.path, value)

    const beforeCursor = value.substring(0, e.target.selectionStart)
    const line = beforeCursor.split('\n').length
    const col = beforeCursor.split('\n').pop()?.length || 0
    setCursorPos({ line, col })
  }, [activeFile, onContentChange])

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [activeFile?.path])

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col bg-zinc-900">
        <div className="h-9 border-b border-zinc-800 flex items-center px-3">
          <span className="text-xs text-zinc-500">محرر الأكواد</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-600">
          <div className="text-center">
            <FileCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">اختر ملفًا من المستعرض لبدء التحرير</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Tab Bar */}
      <div className="flex items-center h-9 bg-zinc-950 border-b border-zinc-800 overflow-x-auto">
        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => onSelectFile(file.path)}
            className={`flex items-center gap-1.5 px-3 h-full text-xs border-l border-zinc-800 transition-colors min-w-0 shrink-0 ${
              file.path === activeFile.path
                ? 'bg-zinc-900 text-zinc-100'
                : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {getFileTabIcon(file.name)}
            <span className="truncate max-w-[100px]" dir="ltr">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseFile(file.path)
              }}
              className="ml-1 p-0.5 rounded hover:bg-zinc-700 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Highlighted code backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" dir="ltr">
          <pre
            className="absolute top-0 right-10 p-3 text-sm font-mono leading-6 whitespace-pre-wrap break-words overflow-hidden"
            aria-hidden="true"
            style={{ color: '#e2e8f0' }}
            dangerouslySetInnerHTML={{
              __html: simpleHighlight(activeFile.content, activeFile.language),
            }}
          />
        </div>

        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="absolute top-0 right-0 w-10 bg-zinc-950 border-l border-zinc-800 overflow-hidden pt-3 pb-3 select-none"
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className={`px-2 text-right text-xs font-mono leading-6 ${
                i + 1 === cursorPos.line ? 'text-zinc-100' : 'text-zinc-600'
              }`}
              dir="ltr"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={activeFile.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-emerald-400 resize-none outline-none font-mono text-sm leading-6 p-3 pr-12 selection:bg-emerald-500/30"
          dir="ltr"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 flex items-center justify-between px-3 bg-zinc-950 border-t border-zinc-800 text-[10px] text-zinc-500">
        <div className="flex items-center gap-3">
          <span>سطر {cursorPos.line}</span>
          <span>عمود {cursorPos.col}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{activeFile.language}</span>
          <span>UTF-8</span>
          <span>{lines.length} سطر</span>
        </div>
      </div>
    </div>
  )
}
