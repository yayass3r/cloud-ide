'use client'

import React, { useState, useMemo } from 'react'
import { RefreshCw, ExternalLink, Eye, Code2, Globe, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface LivePreviewProps {
  files: Record<string, string>
  template: string
  projectName: string
  isRunning: boolean
  onRefresh: () => void
}

export default function LivePreview({ files, template, projectName, isRunning, onRefresh }: LivePreviewProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const previewHtml = useMemo(() => {
    // Try to find HTML file in the project files
    const htmlFile = Object.entries(files).find(([path]) =>
      path.endsWith('index.html') || path.endsWith('.html')
    )

    if (htmlFile) {
      // If it's a CSS file path, we need to inline the CSS
      let html = htmlFile[1]
      // Try to find and inline CSS
      const cssFile = Object.entries(files).find(([path]) => path.endsWith('style.css') || path.endsWith('.css'))
      if (cssFile) {
        html = html.replace(
          /<link[^>]*href=["']([^"']*\.css)["'][^>]*>/gi,
          `<style>${cssFile[1]}</style>`
        )
      }
      // Try to find and inline JS
      const jsFile = Object.entries(files).find(([path]) =>
        path.endsWith('script.js') && !path.includes('node_modules')
      )
      if (jsFile) {
        html = html.replace(
          /<script[^>]*src=["']([^"']*\.js)["'][^>]*><\/script>/gi,
          `<script>${jsFile[1]}<\/script>`
        )
      }
      return html
    }

    // For non-HTML templates, generate a demo preview
    if (template === 'node') {
      return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; direction: rtl; }
    .container { text-align: center; padding: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { color: #10b981; font-size: 1.8rem; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 1.1rem; }
    .badge { display: inline-block; background: rgba(16,185,129,0.15); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.85rem; margin-top: 1rem; }
    .response { background: #1e293b; padding: 1.5rem; border-radius: 0.75rem; margin-top: 1.5rem; border: 1px solid #334155; text-align: left; direction: ltr; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🟢</div>
    <h1>الخادم يعمل</h1>
    <p>خادم Express.js يعمل بنجاح</p>
    <span class="badge">المنفذ 3000</span>
    <div class="response">
      GET / → 200 OK<br>
      {"message": "مرحبًا بالعالم!"}
    </div>
  </div>
</body>
</html>`
    }

    if (template === 'react') {
      return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; direction: rtl; }
    .app { text-align: center; padding: 3rem 1rem; }
    .logo { font-size: 3rem; margin-bottom: 1rem; animation: spin 2s linear infinite; display: inline-block; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .counter { font-size: 4rem; font-weight: bold; color: #10b981; margin: 1.5rem 0; }
    .btn { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.75rem; font-size: 1.1rem; cursor: pointer; transition: transform 0.2s; }
    .btn:hover { transform: scale(1.05); }
    .badge { display: inline-block; background: rgba(16,185,129,0.15); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="app">
    <div class="logo">⚛️</div>
    <h1>تطبيق React</h1>
    <p style="color:#94a3b8; margin-bottom:1rem;">مرحبًا بك في تطبيقك التفاعلي</p>
    <div class="counter">0</div>
    <button class="btn" onclick="this.parentElement.querySelector('.counter').textContent = parseInt(this.parentElement.querySelector('.counter').textContent) + 1">زيادة</button>
    <br>
    <span class="badge">React + Vite</span>
  </div>
</body>
</html>`
    }

    if (template === 'python') {
      return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; direction: rtl; padding: 2rem; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #10b981; margin-bottom: 1rem; font-size: 1.5rem; }
    pre { background: #1e293b; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #334155; overflow-x: auto; direction: ltr; text-align: left; }
    .output { color: #a5f3fc; }
    .line { padding: 0.15rem 0; }
    .badge { display: inline-block; background: rgba(16,185,129,0.15); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">🐍 Python 3.12</span>
    <h1>خرج التطبيق</h1>
    <pre class="output">
<span class="line">مرحبًا العالم!</span>
<span class="line">أول 10 أرقام من فيبوناتشي:</span>
<span class="line">  F(0) = 0</span>
<span class="line">  F(1) = 1</span>
<span class="line">  F(2) = 1</span>
<span class="line">  F(3) = 2</span>
<span class="line">  F(4) = 3</span>
<span class="line">  F(5) = 5</span>
<span class="line">  F(6) = 8</span>
<span class="line">  F(7) = 13</span>
<span class="line">  F(8) = 21</span>
<span class="line">  F(9) = 34</span>
    </pre>
  </div>
</body>
</html>`
    }

    // Default
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; direction: rtl; }
</style></head>
<body><div style="text-align:center"><h1 style="color:#10b981">مرحبًا!</h1></div></body>
</html>`
  }, [files, template])

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }

  if (!isRunning) {
    return (
      <div className="h-full flex flex-col bg-zinc-900">
        {/* URL Bar */}
        <div className="h-10 flex items-center px-3 bg-zinc-950 border-b border-zinc-800 shrink-0 gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-zinc-800 rounded-md px-3 py-1 text-xs text-zinc-500 text-center" dir="ltr">
            localhost:3000
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <Code2 className="h-16 w-16 mx-auto text-zinc-700 mb-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <p className="text-zinc-500 text-sm mb-1">معاينة مباشرة</p>
            <p className="text-zinc-600 text-xs">اضغط على تشغيل لمعاينة مشروعك</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* URL Bar */}
      <div className="h-10 flex items-center px-3 bg-zinc-950 border-b border-zinc-800 shrink-0 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-zinc-800 rounded-md px-3 py-1 text-xs text-zinc-400 text-center overflow-hidden" dir="ltr">
          <span className="text-green-400">🔒</span> localhost:3000
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          onClick={() => {
            const iframe = document.querySelector('iframe[data-preview]')
            if (iframe) {
              const win = window.open()
              if (win) {
                win.document.write(previewHtml)
                win.document.close()
              }
            }
          }}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Device Mode Toggle */}
      <div className="flex items-center justify-center gap-1 py-1.5 bg-zinc-950 border-b border-zinc-800 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${deviceMode === 'desktop' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
          onClick={() => setDeviceMode('desktop')}
        >
          <Monitor className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${deviceMode === 'tablet' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
          onClick={() => setDeviceMode('tablet')}
        >
          <Tablet className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${deviceMode === 'mobile' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
          onClick={() => setDeviceMode('mobile')}
        >
          <Smartphone className="h-3 w-3" />
        </Button>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-start justify-center bg-zinc-800/50 p-2 overflow-hidden">
        <div
          className="bg-white rounded-md overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            width: deviceWidths[deviceMode],
            maxWidth: '100%',
            height: '100%',
          }}
        >
          <iframe
            data-preview
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  )
}

// Additional icons needed
function Monitor({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  )
}

function Tablet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <line x1="12" x2="12.01" y1="18" y2="18" />
    </svg>
  )
}
