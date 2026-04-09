'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Brain,
  Send,
  Sparkles,
  Bug,
  Zap,
  MessageSquare,
  User,
  Bot,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodeBlock } from '@/components/chat/CodeBlock'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  codeBlocks?: { code: string; language: string }[]
}

type ModelOption = 'gpt-4o' | 'claude-3' | 'llama-3'

// Helpers
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Parse markdown-like code blocks from AI content */
function parseCodeBlocks(content: string): {
  textParts: string[]
  codeBlocks: { code: string; language: string }[]
} {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const textParts: string[] = []
  const codeBlocks: { code: string; language: string }[] = []

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      textParts.push(content.slice(lastIndex, match.index))
    }
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    textParts.push(content.slice(lastIndex))
  }

  return { textParts, codeBlocks }
}

// Animation variants
const panelVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: 380, opacity: 0 },
}

const messageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
}

const loadingDotsVariants = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const dotVariants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Quick action buttons
const quickActions = [
  {
    label: 'شرح هذا الكود',
    icon: MessageSquare,
    prompt: 'شرح هذا الكود بشكل مفصل:',
  },
  {
    label: 'إصلاح الأخطاء',
    icon: Bug,
    prompt: 'إصلاح الأخطاء في هذا الكود:',
  },
  {
    label: 'تحسين الأداء',
    icon: Zap,
    prompt: 'تحسين أداء هذا الكود:',
  },
  {
    label: 'كتابة تعليقات',
    icon: Sparkles,
    prompt: 'أضف تعليقات توثيقية لهذا الكود:',
  },
]

export function AiChatPanel() {
  const aiChatOpen = useAppStore((s) => s.aiChatOpen)
  const toggleAiChat = useAppStore((s) => s.toggleAiChat)
  const currentProject = useAppStore((s) => s.currentProject)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelOption>('gpt-4o')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Focus textarea when panel opens
  useEffect(() => {
    if (aiChatOpen) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
    }
  }, [aiChatOpen])

  // Send message handler
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)

      try {
        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            projectId: currentProject?.id || null,
          }),
        })

        if (!response.ok) {
          throw new Error('فشل في الاتصال بالخادم')
        }

        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.message || data.content || 'عذراً، لم أتمكن من معالجة طلبك.',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, currentProject]
  )

  // Handle keyboard submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage(inputValue)
      }
    },
    [inputValue, sendMessage]
  )

  // Handle quick action
  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage(prompt)
    },
    [sendMessage]
  )

  // Empty state
  const isEmpty = messages.length === 0

  return (
    <AnimatePresence>
      {aiChatOpen && (
        <motion.div
          className="fixed top-0 right-0 z-50 h-full flex"
          style={{ width: 380 }}
          variants={panelVariants}
          initial="closed"
          animate="open"
          exit="closed"
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          dir="rtl"
        >
          {/* Backdrop on mobile */}
          <motion.div
            className="fixed inset-0 bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleAiChat}
          />

          {/* Panel */}
          <motion.div
            className="relative h-full w-full flex flex-col bg-background border-l border-border shadow-2xl"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <Brain className="size-4.5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-foreground leading-tight">
                    مساعد الذكاء الاصطناعي
                  </h2>
                  <span className="text-[10px] text-muted-foreground">
                    مدعوم بالذكاء الاصطناعي
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Model selector */}
                <Select
                  value={selectedModel}
                  onValueChange={(val) => setSelectedModel(val as ModelOption)}
                >
                  <SelectTrigger
                    className="h-7 text-[11px] gap-1 border-zinc-200 dark:border-zinc-700 bg-background w-auto px-2"
                    size="sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                    <SelectItem value="llama-3">Llama 3</SelectItem>
                  </SelectContent>
                </Select>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={toggleAiChat}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* ===== Messages Area ===== */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 flex flex-col gap-4 min-h-full">
                  {isEmpty ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                      <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 mb-4">
                        <Sparkles className="size-8 text-emerald-500" />
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1.5">
                        مرحباً بك في المساعد الذكي
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
                        يمكنني مساعدتك في كتابة الكود، شرحه، إصلاح الأخطاء، وتحسين الأداء. اطرح سؤالك أو اختر إجراءً سريعاً أدناه.
                      </p>

                      {/* Quick actions grid */}
                      <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-[280px]">
                        {quickActions.map((action) => {
                          const Icon = action.icon
                          return (
                            <button
                              key={action.label}
                              onClick={() => handleQuickAction(action.prompt)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all text-xs font-medium text-foreground group"
                            >
                              <Icon className="size-3.5 text-emerald-500 group-hover:text-emerald-600 transition-colors shrink-0" />
                              <span className="truncate">{action.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Message list */}
                      <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                          <MessageBubble key={message.id} message={message} />
                        ))}
                      </AnimatePresence>

                      {/* Loading indicator */}
                      {isLoading && (
                        <motion.div
                          className="flex items-start gap-2.5 self-start"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          <Avatar className="size-8 mt-0.5">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                              <Bot className="size-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tr-sm bg-zinc-100 dark:bg-zinc-800">
                            <motion.div
                              className="flex gap-1"
                              variants={loadingDotsVariants}
                              animate="animate"
                            >
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  className="size-2 rounded-full bg-emerald-500"
                                  variants={dotVariants}
                                  animate="animate"
                                />
                              ))}
                            </motion.div>
                            <span className="text-[11px] text-muted-foreground mr-1">
                              يفكر...
                            </span>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* ===== Quick Actions (when messages exist) ===== */}
            {!isEmpty && (
              <div className="px-4 pt-2 border-t border-border bg-card/30">
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-accent transition-all text-[11px] font-medium text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
                      >
                        <Icon className="size-3 text-emerald-500" />
                        <span>{action.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ===== Input Area ===== */}
            <div className="p-3 border-t border-border bg-card/50 backdrop-blur-sm">
              <div className="relative flex items-end gap-2 rounded-xl border border-border bg-background shadow-sm focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اسأل عن الكود الخاص بك..."
                  disabled={isLoading}
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm leading-relaxed py-3 px-4 placeholder:text-muted-foreground/60"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="size-9 rounded-lg m-1.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm disabled:opacity-40 transition-all shrink-0"
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
                اضغط Enter للإرسال • Shift+Enter لسطر جديد
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ===== Message Bubble Component =====
interface MessageBubbleProps {
  message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const { textParts, codeBlocks } = useMemo(
    () => parseCodeBlocks(message.content),
    [message.content]
  )

  return (
    <motion.div
      className={cn(
        'flex items-start gap-2.5 w-full',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
    >
      {/* Avatar */}
      <Avatar className="size-8 mt-0.5 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
          )}
        >
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-0.5 max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-emerald-600 text-white rounded-tl-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-tr-sm'
          )}
          dir="rtl"
        >
          {/* Render text parts and code blocks */}
          {codeBlocks.length > 0 ? (
            <div className="flex flex-col gap-1">
              {textParts.map((part, idx) => (
                <p key={idx} className={cn(!part.trim() && 'hidden')}>
                  {part}
                </p>
              ))}
              {codeBlocks.map((block, idx) => (
                <CodeBlock
                  key={idx}
                  code={block.code}
                  language={block.language}
                />
              ))}
            </div>
          ) : (
            message.content.split('\n').map((line, idx) => (
              <p key={idx} className={cn(!line.trim() && idx > 0 && 'h-3')}>
                {line}
              </p>
            ))
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/60 px-1 mt-0.5">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  )
}

export default AiChatPanel
