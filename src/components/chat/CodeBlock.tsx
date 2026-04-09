'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  jsx: 'JSX',
  tsx: 'TSX',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
  shell: 'Shell',
  sql: 'SQL',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  yaml: 'YAML',
  yml: 'YAML',
  markdown: 'Markdown',
  md: 'Markdown',
}

export function CodeBlock({ code, language = 'text', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  const displayLabel = languageLabels[language.toLowerCase()] || language.toUpperCase()

  const lineCount = code.split('\n').length

  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700/50 my-3',
        className
      )}
      dir="ltr"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/50">
        {/* Language badge */}
        <span className="text-xs font-medium text-zinc-400 bg-zinc-700/50 px-2.5 py-0.5 rounded-md">
          {displayLabel}
        </span>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-700/50"
          aria-label={copied ? 'تم النسخ!' : 'نسخ الكود'}
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={oneDark}
          showLineNumbers={lineCount > 2}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#52525b',
            userSelect: 'none',
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            },
          }}
        >
          {code.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export default CodeBlock
