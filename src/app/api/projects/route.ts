import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/projects - List projects by userId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { deployments: true },
        },
      },
    })

    return NextResponse.json({ projects })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في جلب المشاريع' }, { status: 500 })
  }
}

// POST /api/projects - Create project
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, template = 'static', userId } = body

    if (!name) {
      return NextResponse.json({ error: 'اسم المشروع مطلوب' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    // Default files based on template
    const defaultFiles: Record<string, Record<string, string>> = {
      node: {
        'package.json': JSON.stringify({ name, version: '1.0.0', main: 'index.js', scripts: { start: 'node index.js' }, dependencies: { express: '^4.18.2' } }, null, 2),
        'index.js': `const express = require('express');\nconst app = express();\nconst PORT = 3000;\n\napp.get('/', (req, res) => {\n  res.json({ message: 'مرحبًا من ${name}!' });\n});\n\napp.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
        'README.md': `# ${name}\n\nمشروع Node.js مع Express.`,
      },
      react: {
        'src/App.jsx': `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div style={{ textAlign: 'center', padding: '2rem' }}>\n      <h1>${name}</h1>\n      <p>العدد: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>زيادة</button>\n    </div>\n  );\n}`,
        'src/index.js': "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);",
        'public/index.html': `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <title>${name}</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script src="../src/index.js"></script>\n</body>\n</html>`,
      },
      static: {
        'index.html': `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${name}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header>\n    <h1>${name}</h1>\n    <p>مرحبًا بك في مشروعي</p>\n  </header>\n  <main>\n    <section class="hero">\n      <h2>مشروع ويب ثابت</h2>\n      <p>تم إنشاؤه باستخدام كود ستوديو</p>\n    </section>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>`,
        'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #e2e8f0; }\nheader { text-align: center; padding: 3rem 1rem; background: linear-gradient(135deg, #059669, #0d9488); }\nheader h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }\nheader p { opacity: 0.9; font-size: 1.1rem; }\n.hero { text-align: center; padding: 4rem 1rem; }\n.hero h2 { font-size: 1.8rem; color: #10b981; margin-bottom: 1rem; }`,
        'script.js': 'console.log("مرحبًا من كود ستوديو!");',
      },
      python: {
        'app.py': `# ${name}\nprint("مرحبًا العالم!")\n\ndef greet(name):\n    return f"مرحبًا {name}!"\n\nif __name__ == "__main__":\n    print(greet("المطور"))`,
        'requirements.txt': 'flask==3.0.0\nrequests==2.31.0',
        'README.md': `# ${name}\n\nتطبيق Python بسيط.`,
      },
    }

    const project = await db.project.create({
      data: {
        name,
        template,
        description: `مشروع ${name} من نوع ${template}`,
        files: JSON.stringify(defaultFiles[template] || defaultFiles.static),
        userId,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء المشروع' }, { status: 500 })
  }
}

// PUT /api/projects - Update project
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, isPublic, files } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف المشروع مطلوب' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (files !== undefined) updateData.files = files

    const project = await db.project.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث المشروع' }, { status: 500 })
  }
}

// DELETE /api/projects - Delete project
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف المشروع مطلوب' }, { status: 400 })
    }

    await db.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف المشروع' }, { status: 500 })
  }
}
