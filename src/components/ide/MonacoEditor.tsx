'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import type { editor as MonacoEditorType, OnMount } from 'monaco-editor'

// Dynamic import the Monaco Editor component — MUST be ssr: false because Monaco requires browser APIs
const MonacoEditorLib = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500">جاري تحميل المحرر...</span>
        </div>
      </div>
    ),
  }
)

// ─── File Extension → Language Mapping ─────────────────────────────────────
const extensionToLanguage: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  htm: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  svg: 'xml',
  graphql: 'graphql',
  gql: 'graphql',
  vue: 'html',
  svelte: 'html',
}

export function getLanguageFromFileName(
  fileName: string,
  fallback?: string
): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return extensionToLanguage[ext] || fallback || 'plaintext'
}

// ─── Props ──────────────────────────────────────────────────────────────────
/* eslint-disable no-unused-vars */
export interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  fileName?: string
  readOnly?: boolean
  onSave?: () => void
  onCursorChange?: (position: { line: number; col: number }) => void
  className?: string
}
/* eslint-enable no-unused-vars */

// ─── Component ──────────────────────────────────────────────────────────────
export default function MonacoEditor({
  value,
  onChange,
  language,
  fileName,
  readOnly = false,
  onSave,
  onCursorChange,
  className = '',
}: MonacoEditorProps) {
  const { theme, resolvedTheme } = useTheme()
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)

  const isDark = resolvedTheme === 'dark' || theme === 'dark'

  // Determine language from fileName or explicit language prop
  const detectedLanguage =
    language || (fileName ? getLanguageFromFileName(fileName) : 'plaintext')

  // ─── Theme registration & editor mount ──────────────────────────────────
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco

      // ── Dark theme: emerald/teal accents on zinc background ──
      monaco.editor.defineTheme('cloud-ide-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'c084fc' },
          { token: 'string', foreground: 'fbbf24' },
          { token: 'number', foreground: 'fb923c' },
          { token: 'type', foreground: '60a5fa' },
          { token: 'function', foreground: '34d399' },
          { token: 'variable', foreground: 'e2e8f0' },
          { token: 'operator', foreground: '94a3b8' },
          { token: 'delimiter', foreground: '94a3b8' },
          { token: 'tag', foreground: 'f472b6' },
          { token: 'attribute.name', foreground: '60a5fa' },
          { token: 'attribute.value', foreground: 'fbbf24' },
          { token: 'metatag', foreground: 'c084fc' },
          { token: 'metatag.content', foreground: 'e2e8f0' },
          { token: 'metatag.html', foreground: 'c084fc' },
          { token: 'metatag.xml', foreground: 'c084fc' },
          { token: 'metatag.attribute', foreground: 'f472b6' },
          { token: 'metatag.attribute.value', foreground: 'fbbf24' },
          { token: 'selector', foreground: '60a5fa' },
          { token: 'property', foreground: 'c084fc' },
          { token: 'property.value', foreground: 'fbbf24' },
          { token: 'constructor', foreground: 'fbbf24' },
          { token: 'namespace', foreground: 'e2e8f0' },
          { token: 'module', foreground: 'e2e8f0' },
          { token: 'interface', foreground: '60a5fa' },
        ],
        colors: {
          'editor.background': '#09090b',
          'editor.foreground': '#e2e8f0',
          'editor.lineHighlightBackground': '#18181b',
          'editor.selectionBackground': '#10b98133',
          'editor.inactiveSelectionBackground': '#10b9811a',
          'editorCursor.foreground': '#10b981',
          'editorLineNumber.foreground': '#52525b',
          'editorLineNumber.activeForeground': '#d4d4d8',
          'editorIndentGuide.background': '#27272a',
          'editorIndentGuide.activeBackground': '#3f3f46',
          'editor.selectionHighlightBackground': '#10b98122',
          'editorBracketMatch.background': '#10b98133',
          'editorBracketMatch.border': '#10b98155',
          'editorOverviewRuler.border': '#18181b',
          'scrollbarSlider.background': '#52525b55',
          'scrollbarSlider.hoverBackground': '#71717a55',
          'scrollbarSlider.activeBackground': '#a1a1aa55',
          'editorWidget.background': '#18181b',
          'editorWidget.border': '#27272a',
          'editorSuggestWidget.background': '#18181b',
          'editorSuggestWidget.border': '#27272a',
          'editorSuggestWidget.selectedBackground': '#10b98122',
          'editorSuggestWidget.highlightForeground': '#34d399',
          'minimap.background': '#09090b',
          'editorGutter.background': '#09090b',
          'editorError.foreground': '#f87171',
          'editorWarning.foreground': '#fbbf24',
          'editorInfo.foreground': '#60a5fa',
        },
      })

      // ── Light theme ──
      monaco.editor.defineTheme('cloud-ide-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
          { token: 'keyword', foreground: '7c3aed' },
          { token: 'string', foreground: 'd97706' },
          { token: 'number', foreground: 'ea580c' },
          { token: 'type', foreground: '2563eb' },
          { token: 'function', foreground: '059669' },
          { token: 'variable', foreground: '#1f2937' },
          { token: 'operator', foreground: '#6b7280' },
          { token: 'delimiter', foreground: '#6b7280' },
          { token: 'tag', foreground: '#db2777' },
          { token: 'attribute.name', foreground: '#2563eb' },
          { token: 'attribute.value', foreground: '#d97706' },
          { token: 'property', foreground: '#7c3aed' },
          { token: 'property.value', foreground: '#d97706' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#1f2937',
          'editor.lineHighlightBackground': '#f4f4f5',
          'editor.selectionBackground': '#10b98133',
          'editor.inactiveSelectionBackground': '#10b9811a',
          'editorCursor.foreground': '#059669',
          'editorLineNumber.foreground': '#a1a1aa',
          'editorLineNumber.activeForeground': '#3f3f46',
          'editorIndentGuide.background': '#e4e4e7',
          'editorIndentGuide.activeBackground': '#d4d4d8',
          'editor.selectionHighlightBackground': '#10b98122',
          'editorBracketMatch.background': '#10b98122',
          'editorBracketMatch.border': '#10b98144',
          'scrollbarSlider.background': '#d4d4d855',
          'scrollbarSlider.hoverBackground': '#a1a1aa55',
          'scrollbarSlider.activeBackground': '#71717a55',
          'editorWidget.background': '#ffffff',
          'editorWidget.border': '#e4e4e7',
          'editorSuggestWidget.background': '#ffffff',
          'editorSuggestWidget.border': '#e4e4e7',
          'editorSuggestWidget.selectedBackground': '#10b98115',
          'editorSuggestWidget.highlightForeground': '#059669',
          'minimap.background': '#ffffff',
          'editorGutter.background': '#fafafa',
        },
      })

      // Apply the initial theme
      monaco.editor.setTheme(isDark ? 'cloud-ide-dark' : 'cloud-ide-light')

      // ── Register save shortcut (Ctrl+S / Cmd+S) ──
      editor.addAction({
        id: 'save-file',
        label: 'Save File',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          onSave?.()
        },
      })

      // Track cursor position changes
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange?.({
          line: e.position.lineNumber,
          col: e.position.column,
        })
      })

      // Focus the editor
      editor.focus()
    },
    [isDark, onSave, onCursorChange]
  )

  // Update theme when resolved theme changes
  useEffect(() => {
    const monaco = monacoRef.current
    if (monaco) {
      monaco.editor.setTheme(isDark ? 'cloud-ide-dark' : 'cloud-ide-light')
    }
  }, [isDark])

  // Handle Monaco's onChange (value can be string | undefined)
  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? '')
    },
    [onChange]
  )

  return (
    <div className={`h-full w-full overflow-hidden ${className}`} dir="ltr">
      <MonacoEditorLib
        height="100%"
        language={detectedLanguage}
        value={value}
        theme={isDark ? 'cloud-ide-dark' : 'cloud-ide-light'}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily:
            "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          tabSize: 2,
          insertSpaces: true,
          autoIndent: 'advanced',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          parameterHints: { enabled: true },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          renderWhitespace: 'selection',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 8, bottom: 8 },
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            vertical: 'auto',
            horizontal: 'auto',
          },
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'mouseover',
          matchBrackets: 'always',
          renderLineHighlight: 'all',
          renderLineHighlightOnlyWhenFocus: false,
          occurrencesHighlight: 'singleFile',
          selectionHighlight: true,
          codeLens: true,
          lightbulb: { enabled: 'on' as const },
          inlineSuggest: { enabled: true },
          linkedEditing: true,
          stickyScroll: { enabled: true },
        }}
      />
    </div>
  )
}
