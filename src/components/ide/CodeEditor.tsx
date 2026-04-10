'use client'

import React, { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { X, FileCode, FileText, FileJson } from 'lucide-react'

// Dynamic import MonacoEditor with ssr: false — Monaco requires browser APIs
const MonacoEditor = dynamic(() => import('./MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-zinc-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-zinc-500">جاري تحميل المحرر...</span>
      </div>
    </div>
  ),
})

export interface OpenFile {
  path: string
  name: string
  content: string
  language: string
}

/* eslint-disable no-unused-vars */
interface CodeEditorProps {
  files: OpenFile[]
  activeFile: OpenFile | null
  onContentChange: (path: string, content: string) => void
  onCloseFile: (path: string) => void
  onSelectFile: (path: string) => void
  onSave: (path: string, content: string) => void
}
/* eslint-enable no-unused-vars */

function getFileTabIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'json':
      return <FileJson className="h-3.5 w-3.5 text-green-400" />
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'css':
    case 'html':
      return <FileCode className="h-3.5 w-3.5 text-blue-400" />
    default:
      return <FileText className="h-3.5 w-3.5 text-zinc-400" />
  }
}

export default function CodeEditor({
  files,
  activeFile,
  onContentChange,
  onCloseFile,
  onSelectFile,
  onSave,
}: CodeEditorProps) {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  const handleCursorChange = useCallback(
    (position: { line: number; col: number }) => {
      setCursorPos(position)
    },
    []
  )

  const lines = useMemo(() => {
    if (!activeFile) return 0
    return activeFile.content.split('\n').length
  }, [activeFile?.content, activeFile])

  const handleEditorChange = useCallback(
    (value: string) => {
      if (activeFile) {
        onContentChange(activeFile.path, value)
      }
    },
    [activeFile, onContentChange]
  )

  const handleSave = useCallback(() => {
    if (activeFile) {
      onSave(activeFile.path, activeFile.content)
    }
  }, [activeFile, onSave])

  // ─── Empty state: no active file ────────────────────────────────────────
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

  // ─── Main editor view ───────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* ── Tab Bar ── */}
      <div className="flex items-center h-9 bg-zinc-950 border-b border-zinc-800 overflow-x-auto shrink-0">
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
            <span className="truncate max-w-[80px] sm:max-w-[100px]" dir="ltr">
              {file.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseFile(file.path)
              }}
              className="ml-0.5 p-1 rounded hover:bg-zinc-700 transition-colors active:bg-zinc-600"
              aria-label="إغلاق الملف"
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>

      {/* ── Monaco Editor Area ── */}
      <div className="flex-1 relative overflow-hidden">
        <MonacoEditor
          value={activeFile.content}
          onChange={handleEditorChange}
          language={activeFile.language}
          fileName={activeFile.name}
          onSave={handleSave}
          onCursorChange={handleCursorChange}
        />
      </div>

      {/* ── Status Bar ── */}
      <div className="h-6 flex items-center justify-between px-3 bg-zinc-950 border-t border-zinc-800 text-[10px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-3">
          <span>سطر {cursorPos.line}</span>
          <span>عمود {cursorPos.col}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{activeFile.language}</span>
          <span>UTF-8</span>
          <span>{lines} سطر</span>
        </div>
      </div>
    </div>
  )
}
