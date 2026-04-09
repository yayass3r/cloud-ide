'use client'

import React, { useState } from 'react'
import {
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
}

interface FileExplorerProps {
  template: string
  onFileSelect: (filePath: string, content: string) => void
  activeFile: string | null
}

const templateFiles: Record<string, FileNode[]> = {
  node: [
    { name: 'package.json', type: 'file', content: JSON.stringify({ name: 'my-project', version: '1.0.0', main: 'index.js', scripts: { start: 'node index.js', dev: 'nodemon index.js' }, dependencies: { express: '^4.18.2' } }, null, 2) },
    { name: 'index.js', type: 'file', content: `const express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({ message: 'مرحبًا بالعالم!' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`الخادم يعمل على المنفذ \${PORT}\`);\n});` },
    {
      name: 'utils',
      type: 'folder',
      children: [
        { name: 'helpers.js', type: 'file', content: `// أدوات مساعدة\n\nfunction formatDate(date) {\n  return new Intl.DateTimeFormat('ar-SA').format(date);\n}\n\nfunction generateId() {\n  return Math.random().toString(36).substr(2, 9);\n}\n\nmodule.exports = { formatDate, generateId };` },
      ],
    },
    { name: '.env', type: 'file', content: 'PORT=3000\nNODE_ENV=development' },
    { name: 'README.md', type: 'file', content: '# مشروع Node.js\n\nخادم بسيط باستخدام Express.js' },
  ],
  react: [
    { name: 'package.json', type: 'file', content: JSON.stringify({ name: 'my-react-app', version: '1.0.0', scripts: { start: 'react-scripts start', build: 'react-scripts build' }, dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0', 'react-scripts': '5.0.1' } }, null, 2) },
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'App.jsx', type: 'file', content: `import React from 'react';\nimport './App.css';\n\nfunction App() {\n  const [count, setCount] = React.useState(0);\n\n  return (\n    <div className="app">\n      <h1>مرحبًا بالعالم!</h1>\n      <p>العداد: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>\n        زيادة\n      </button>\n    </div>\n  );\n}\n\nexport default App;` },
        { name: 'index.js', type: 'file', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(\n  document.getElementById('root')\n);\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);` },
        { name: 'App.css', type: 'file', content: `.app {\n  text-align: center;\n  padding: 2rem;\n  font-family: Arial, sans-serif;\n  direction: rtl;\n}\n\nh1 {\n  color: #10b981;\n}\n\nbutton {\n  background: #10b981;\n  color: white;\n  border: none;\n  padding: 0.5rem 1.5rem;\n  border-radius: 0.5rem;\n  font-size: 1rem;\n  cursor: pointer;\n}\n\nbutton:hover {\n  background: #059669;\n}` },
      ],
    },
    {
      name: 'public',
      type: 'folder',
      children: [
        { name: 'index.html', type: 'file', content: `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>تطبيق React</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>` },
      ],
    },
  ],
  static: [
    { name: 'index.html', type: 'file', content: `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>موقعي</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header>\n    <h1>مرحبًا بك في موقعي</h1>\n    <p>هذا موقع ثابت تم إنشاؤه باستخدام HTML و CSS</p>\n  </header>\n  <main>\n    <section class="features">\n      <div class="feature">\n        <h2>⚡ سريع</h2>\n        <p>أداء عالي وسرعة تحميل ممتازة</p>\n      </div>\n      <div class="feature">\n        <h2>📱 متجاوب</h2>\n        <p>يعمل على جميع الأجهزة</p>\n      </div>\n      <div class="feature">\n        <h2>🎨 جميل</h2>\n        <p>تصميم عصري وأنيق</p>\n      </div>\n    </section>\n  </main>\n  <footer>\n    <p>صُنع بـ ❤️ في CodeStudio</p>\n  </footer>\n  <script src="script.js"></script>\n</body>\n</html>` },
    { name: 'style.css', type: 'file', content: `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n  background: linear-gradient(135deg, #0f172a, #1e293b);\n  color: #e2e8f0;\n  min-height: 100vh;\n  direction: rtl;\n}\n\nheader {\n  text-align: center;\n  padding: 4rem 2rem;\n  background: linear-gradient(135deg, #059669, #10b981);\n  color: white;\n}\n\nheader h1 {\n  font-size: 2.5rem;\n  margin-bottom: 0.5rem;\n}\n\n.features {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 2rem;\n  padding: 3rem 2rem;\n  max-width: 900px;\n  margin: 0 auto;\n}\n\n.feature {\n  background: rgba(255,255,255,0.05);\n  padding: 2rem;\n  border-radius: 1rem;\n  text-align: center;\n  border: 1px solid rgba(255,255,255,0.1);\n}\n\n.feature h2 {\n  color: #10b981;\n  margin-bottom: 0.5rem;\n}\n\nfooter {\n  text-align: center;\n  padding: 2rem;\n  color: #94a3b8;\n}` },
    { name: 'script.js', type: 'file', content: `// JavaScript للموقع الثابت\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('تم تحميل الموقع بنجاح!');\n\n  // تأثير الحركة عند التمرير\n  const features = document.querySelectorAll('.feature');\n  features.forEach((el, i) => {\n    el.style.opacity = '0';\n    el.style.transform = 'translateY(20px)';\n    setTimeout(() => {\n      el.style.transition = 'all 0.5s ease';\n      el.style.opacity = '1';\n      el.style.transform = 'translateY(0)';\n    }, i * 200);\n  });\n});` },
  ],
  python: [
    { name: 'app.py', type: 'file', content: `# تطبيق Python بسيط\n\ndef greet(name):\n    """ترحيب بالمستخدم"""\n    return f"مرحبًا {name}!"\n\ndef fibonacci(n):\n    """حساب تسلسل فيبوناتشي"""\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\nif __name__ == "__main__":\n    print(greet("العالم"))\n    print("أول 10 أرقام من فيبوناتشي:")\n    for i in range(10):\n        print(f"  F({i}) = {fibonacci(i)}")` },
    { name: 'requirements.txt', type: 'file', content: 'flask==3.0.0\nrequests==2.31.0' },
    { name: 'README.md', type: 'file', content: '# مشروع Python\n\nتطبيق Python بسيط يوضح الأساسيات' },
  ],
}

function getFileIcon(name: string, type: string, isOpen: boolean) {
  if (type === 'folder') {
    return isOpen ? <FolderOpen className="h-4 w-4 text-amber-400" /> : <Folder className="h-4 w-4 text-amber-400" />
  }
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="h-4 w-4 text-yellow-400" />
    case 'html':
      return <FileCode className="h-4 w-4 text-orange-400" />
    case 'css':
      return <FileCode className="h-4 w-4 text-blue-400" />
    case 'json':
      return <FileText className="h-4 w-4 text-green-400" />
    case 'py':
      return <FileCode className="h-4 w-4 text-cyan-400" />
    case 'md':
      return <FileText className="h-4 w-4 text-zinc-400" />
    case 'env':
      return <File className="h-4 w-4 text-zinc-500" />
    case 'txt':
      return <FileText className="h-4 w-4 text-zinc-400" />
    default:
      return <File className="h-4 w-4 text-zinc-400" />
  }
}

interface FileTreeNodeProps {
  node: FileNode
  path: string
  depth: number
  activeFile: string | null
  onFileSelect: (filePath: string, content: string) => void
  onToggleFolder?: (path: string) => void
  openFolders: Set<string>
}

function FileTreeNode({ node, path, depth, activeFile, onFileSelect, onToggleFolder, openFolders }: FileTreeNodeProps) {
  const isFolder = node.type === 'folder'
  const isOpen = openFolders.has(path)
  const isActive = activeFile === path

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder?.(path)
    } else {
      onFileSelect(path, node.content || '')
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          onClick={handleClick}
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm transition-colors rounded-md ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
          }`}
          style={{ paddingRight: `${depth * 16 + 8}px` }}
        >
          {isFolder && (
            <span className="text-zinc-500">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </span>
          )}
          {!isFolder && <span className="w-3" />}
          {getFileIcon(node.name, node.type, isOpen)}
          <span className="truncate" dir="ltr" style={{ textAlign: 'right' }}>{node.name}</span>
        </div>
        {isFolder && isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={`${path}/${child.name}`}
                node={child}
                path={`${path}/${child.name}`}
                depth={depth + 1}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                onToggleFolder={onToggleFolder}
                openFolders={openFolders}
              />
            ))}
          </div>
        )}
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-zinc-800 border-zinc-700" dir="rtl">
        <ContextMenuItem className="text-zinc-200 focus:bg-zinc-700">ملف جديد</ContextMenuItem>
        <ContextMenuItem className="text-zinc-200 focus:bg-zinc-700">إعادة تسمية</ContextMenuItem>
        <ContextMenuItem className="text-red-400 focus:bg-zinc-700">حذف</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default function FileExplorer({ template, onFileSelect, activeFile }: FileExplorerProps) {
  const files = templateFiles[template] || templateFiles.static
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['src', 'public', 'utils']))

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ملفات المشروع</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">
          {files.map((node) => (
            <FileTreeNode
              key={node.name}
              node={node}
              path={node.name}
              depth={0}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onToggleFolder={toggleFolder}
              openFolders={openFolders}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
