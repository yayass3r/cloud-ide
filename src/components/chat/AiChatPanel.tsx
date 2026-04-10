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
  Settings,
  WifiOff,
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
  provider?: string
  codeBlocks?: { code: string; language: string }[]
}

type ModelOption = 'gpt-4o' | 'llama-3' | 'claude-3' | 'mixtral' | 'gemma2'

interface ModelInfo {
  id: ModelOption
  label: string
  provider: string
  description: string
}

// Available models with provider info
const MODELS: ModelInfo[] = [
  { id: 'gpt-4o', label: 'GPT-4o Mini', provider: 'OpenAI', description: 'نموذج OpenAI السريع' },
  { id: 'llama-3', label: 'Llama 3 70B', provider: 'Groq', description: 'نموذج مفتوح المصدر سريع جداً' },
  { id: 'claude-3', label: 'Claude 3 Haiku', provider: 'Groq', description: 'نموذج Anthropic عبر Groq' },
  { id: 'mixtral', label: 'Mixtral 8x7B', provider: 'Groq', description: 'نموذج Mistral سريع' },
  { id: 'gemma2', label: 'Gemma 2 9B', provider: 'Groq', description: 'نموذج Google سريع' },
]

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
  closed: { x: '100%', opacity: 0 },
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
  const aiEnabled = useAppStore((s) => s.aiEnabled)
  const setAiEnabled = useAppStore((s) => s.setAiEnabled)
  const toggleAiChat = useAppStore((s) => s.toggleAiChat)
  const currentProject = useAppStore((s) => s.currentProject)
  const user = useAppStore((s) => s.user)
  const apiFetch = useAppStore((s) => s.apiFetch)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelOption>('llama-3')
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null) // null = not checked yet

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentModelInfo = MODELS.find((m) => m.id === selectedModel) || MODELS[0]

  // Check AI availability on mount
  useEffect(() => {
    if (aiChatOpen && aiAvailable === null) {
      // Check availability via the public settings endpoint
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAiAvailable(data.settings?.aiEnabled ? true : false)
            setAiEnabled(data.settings?.aiEnabled !== false)
          }
        })
        .catch(() => setAiAvailable(false))
    }
  }, [aiChatOpen, aiAvailable, setAiEnabled])

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

        const response = await apiFetch('/api/ai', {
          method: 'POST',
          body: JSON.stringify({
            messages: apiMessages,
            projectId: currentProject?.id || null,
            userId: user?.id || null,
            model: selectedModel,
          }),
        })

        const data = await response.json()

        if (!response.ok || data.success === false) {
          if (data.code === 'AI_DISABLED') {
            throw new Error('خدمة الذكاء الاصطناعي معطلة حالياً من قبل المدير.')
          }
          const errorMsg = data.error || data.code === 'AI_SERVICE_UNAVAILABLE'
            ? 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يتم إعدادها لتعمل في بيئة الإنتاج قريباً.'
            : 'عذراً، حدث خطأ أثناء معالجة طلبك.'
          throw new Error(errorMsg)
        }

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.message || data.content || 'عذراً، لم أتمكن من معالجة طلبك.',
          timestamp: new Date(),
          provider: data.provider || 'openai',
        }

        setMessages((prev) => [...prev, assistantMessage])
        setAiAvailable(true)
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.'
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: errMessage,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, currentProject, user, apiFetch, selectedModel]
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
  // Show AI unavailable state
  const showAiDisabled = !aiEnabled
  const showAiUnavailable = aiAvailable === false && isEmpty && aiEnabled

  return (
    <AnimatePresence>
      {aiChatOpen && (
        <motion.div
          className="fixed top-0 right-0 z-50 h-full flex w-full max-w-[380px] sm:max-w-[400px]"
          variants={panelVariants}
          initial="closed"
          animate="open"
          exit="closed"
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          dir="rtl"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleAiChat}
          />

          {/* Panel */}
          <motion.div
            className="relative h-full w-full flex flex-col bg-background border-l border-border shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex items-center justify-center size-8 rounded-lg text-white shadow-md",
                  aiEnabled
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-gray-400 to-gray-500"
                )}>
                  <Brain className="size-4.5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-foreground leading-tight">
                    مساعد الذكاء الاصطناعي
                  </h2>
                  <span className={cn(
                    "text-[10px]",
                    aiEnabled ? "text-muted-foreground" : "text-red-500"
                  )}>
                    {aiEnabled
                      ? `${currentModelInfo.provider} — ${currentModelInfo.description}`
                      : 'معطل من قبل المدير'
                    }
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Model selector */}
                {aiEnabled && (
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
                      {MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <span className={cn(
                                "size-1.5 rounded-full",
                                model.provider === 'Groq' ? "bg-orange-400" : "bg-green-400"
                              )} />
                              {model.label}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{model.provider}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

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
                  {showAiDisabled ? (
                    /* AI Disabled by admin */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                      <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 mb-4">
                        <WifiOff className="size-8 text-red-500" />
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1.5">
                        المساعد الذكي معطل
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
                        خدمة الذكاء الاصطناعي معطلة حالياً من قبل مدير المنصة. يرجى التواصل مع المدير لتفعيلها.
                      </p>
                    </div>
                  ) : showAiUnavailable ? (
                    /* AI Unavailable state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                      <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 mb-4">
                        <Settings className="size-8 text-amber-500 animate-pulse" />
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1.5">
                        المساعد الذكي قيد الإعداد
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
                        خدمة الذكاء الاصطناعي غير متاحة حالياً. يتم إعدادها لتكون جاهزة قريباً.
                      </p>
                    </div>
                  ) : isEmpty ? (
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

                      {/* Current model indicator */}
                      <div className="mt-4 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                        <p className="text-[11px] text-muted-foreground">
                          النموذج الحالي:{' '}
                          <span className="font-medium text-foreground">{currentModelInfo.label}</span>
                          <span className="text-muted-foreground"> ({currentModelInfo.provider})</span>
                        </p>
                      </div>

                      {/* Quick actions grid */}
                      <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-[280px]">
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
            {!isEmpty && aiEnabled && (
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
            {aiEnabled && (
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
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <p className="text-[10px] text-muted-foreground/50">
                    اضغط Enter للإرسال • Shift+Enter لسطر جديد
                  </p>
                  <p className="text-[10px] text-muted-foreground/40">
                    {currentModelInfo.label}
                  </p>
                </div>
              </div>
            )}
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

        {/* Timestamp + Provider */}
        <span className="text-[10px] text-muted-foreground/60 px-1 mt-0.5 flex items-center gap-1.5">
          {formatTime(message.timestamp)}
          {!isUser && message.provider && (
            <span className="text-[9px] px-1 py-0 rounded bg-muted/50">
              {message.provider === 'groq' ? '⚡ Groq' : message.provider}
            </span>
          )}
        </span>
      </div>
    </motion.div>
  )
}

export default AiChatPanel
