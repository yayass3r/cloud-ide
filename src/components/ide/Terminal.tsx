'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal as TerminalIcon, X, Minus2, Maximize2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'info'
  content: string
}

interface TerminalProps {
  template: string
}

const COMMANDS: Record<string, (args: string[], template: string) => string[]> = {
  help: () => [
    'الأوامر المتاحة:',
    '  ls          - عرض الملفات',
    '  pwd         - مسار العمل الحالي',
    '  clear       - مسح الطرفية',
    '  help        - عرض المساعدة',
    '  node        - تشغيل Node.js',
    '  npm start   - بدء خادم التطوير',
    '  npm install - تثبيت الحزم',
    '  python      - تشغيل Python',
    '  echo        - طباعة نص',
    '  date        - التاريخ والوقت',
    '  whoami      - المستخدم الحالي',
  ],
  ls: () => [
    '📁 node_modules/',
    '📁 src/',
    '📁 public/',
    '📄 package.json',
    '📄 index.js',
    '📄 .env',
    '📄 README.md',
  ],
  pwd: () => ['/home/codestudio/project'],
  whoami: () => ['codestudio'],
  date: () => [new Intl.DateTimeFormat('ar-SA', { dateStyle: 'full', timeStyle: 'long' }).format(new Date())],
  echo: (args) => [args.join(' ')],
  'npm install': () => [
    '📦 جارٍ تثبيت الحزم...',
    'added 156 packages in 3.2s',
    '',
    '✅ تم التثبيت بنجاح!',
  ],
  'npm start': (args, template) => {
    if (template === 'react') {
      return [
        '',
        '  ⚛️  تطبيق React',
        '',
        '  المحلي:    http://localhost:3000',
        '  الشبكة:    http://192.168.1.5:3000',
        '',
        '  ملاحظة: التطوير جاهز!',
        '  ⌨️  اضغط a لفتح في المتصفح',
        '',
      ]
    }
    return [
      '',
      '  🚀 الخادم يعمل...',
      '',
      '  > node index.js',
      '  الخادم يعمل على المنفذ 3000',
      '  http://localhost:3000',
      '',
    ]
  },
  node: (args) => {
    if (args.length === 0) return ['مرحبًا بك في Node.js v20.10.0.']
    if (args[0] === 'index.js') {
      return [
        '',
        '  > const express = require(\'express\');',
        '  > الخادم يعمل على المنفذ 3000',
        '  > مرجبا بالعالم!',
        '',
        '  ✅ تم التشغيل بنجاح',
        '',
      ]
    }
    if (args[0] === '-v' || args[0] === '--version') return ['v20.10.0']
    return [`${args[0]}: لا يوجد ملف بهذا الاسم`]
  },
  python: (args) => {
    if (args.length === 0) return ['Python 3.12.0 (main, Oct 2 2023, 12:00:00)']
    if (args[0] === 'app.py') {
      return [
        'مرحبًا العالم!',
        'أول 10 أرقام من فيبوناتشي:',
        '  F(0) = 0',
        '  F(1) = 1',
        '  F(2) = 1',
        '  F(3) = 2',
        '  F(4) = 3',
        '  F(5) = 5',
        '  F(6) = 8',
        '  F(7) = 13',
        '  F(8) = 21',
        '  F(9) = 34',
        '',
      ]
    }
    if (args[0] === '--version') return ['Python 3.12.0']
    return [`${args[0]}: لا يوجد ملف بهذا الاسم`]
  },
  clear: () => ['__CLEAR__'],
  cat: (args) => {
    if (args.length === 0) return ['cat: يرجى تحديد ملف']
    return [`// محتوى ${args[0]}\n// ... (محاكاة)`]
  },
}

export default function Terminal({ template }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', content: 'مرحبًا بك في طرفية CodeStudio 🚀' },
    { type: 'info', content: 'اكتب "help" لعرض الأوامر المتاحة' },
    { type: 'info', content: '─────────────────────────────────────' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    const inputLine: TerminalLine = { type: 'input', content: `user@codestudio:~$ ${trimmed}` }

    const parts = trimmed.split(/\s+/)
    const command = parts[0]
    const args = parts.slice(1)
    const fullCommand = `${command}${args.length > 0 ? ' ' + args.join(' ') : ''}`

    // Find matching command
    let result: string[] | null = null
    if (COMMANDS[fullCommand]) {
      result = COMMANDS[fullCommand](args, template)
    } else if (COMMANDS[command]) {
      result = COMMANDS[command](args, template)
    } else {
      result = [`${command}: أمر غير موجود. اكتب "help" للمساعدة.`]
    }

    if (result && result[0] === '__CLEAR__') {
      setLines([])
      return
    }

    const outputLines: TerminalLine[] = result.map((line) => ({
      type: 'output' as const,
      content: line,
    }))

    setLines((prev) => [...prev, inputLine, ...outputLines])
    setHistory((prev) => [trimmed, ...prev])
    setHistoryIndex(-1)
  }, [template])

  useEffect(() => {
    scrollToBottom()
  }, [lines, scrollToBottom])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? 0 : Math.min(historyIndex + 1, history.length - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-emerald-400'
      case 'output': return 'text-zinc-300'
      case 'error': return 'text-red-400'
      case 'success': return 'text-green-400'
      case 'info': return 'text-cyan-400'
      default: return 'text-zinc-300'
    }
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
      {/* Terminal Header */}
      <div className="flex items-center justify-between h-8 px-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <TerminalIcon className="h-3.5 w-3.5 text-zinc-500 mr-2" />
          <span className="text-xs text-zinc-500 font-medium">طرفية الأوامر</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            onClick={() => inputRef.current?.focus()}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
            onClick={() => setLines([])}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm leading-5 custom-scrollbar"
        onClick={() => inputRef.current?.focus()}
        dir="ltr"
      >
        {lines.map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} whitespace-pre-wrap break-all`}>
            {line.content}
          </div>
        ))}

        {/* Input Line */}
        <div className="flex items-center text-emerald-400">
          <span className="text-cyan-500">user@codestudio</span>
          <span className="text-zinc-500 mx-1">:</span>
          <span className="text-blue-400">~</span>
          <span className="text-zinc-500 mx-1">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-zinc-100 font-mono text-sm ml-1 caret-emerald-400"
            autoFocus
            spellCheck={false}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  )
}
