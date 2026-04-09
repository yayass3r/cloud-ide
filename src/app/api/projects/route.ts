import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel } from '@/lib/supabase-utils'

// GET /api/projects - List projects by userId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Fetch projects error:', error)
      return NextResponse.json({ error: 'حدث خطأ في جلب المشاريع' }, { status: 500 })
    }

    // Get deployment counts for all user's projects
    const projectIds = (projects || []).map(p => p.id)
    const deployCountMap: Record<string, number> = {}

    if (projectIds.length > 0) {
      const { data: deploys } = await supabaseAdmin
        .from('deployments')
        .select('project_id')
        .in('project_id', projectIds)

      for (const d of deploys || []) {
        deployCountMap[d.project_id] = (deployCountMap[d.project_id] || 0) + 1
      }
    }

    const result = (projects || []).map(p => ({
      ...toCamel(p),
      _count: { deployments: deployCountMap[p.id] || 0 },
    }))

    return NextResponse.json({ projects: result })
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

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        name,
        template,
        description: `مشروع ${name} من نوع ${template}`,
        files: JSON.stringify(defaultFiles[template] || defaultFiles.static),
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Create project error:', error)
      return NextResponse.json({ error: 'حدث خطأ في إنشاء المشروع' }, { status: 500 })
    }

    return NextResponse.json({ project: toCamel(project) })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء المشروع' }, { status: 500 })
  }
}

// PUT /api/projects - Update project
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, isPublic, files, userId } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف المشروع مطلوب' }, { status: 400 })
    }

    // Verify ownership
    if (userId) {
      const { data: existingProject } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', id)
        .single()

      if (!existingProject || existingProject.user_id !== userId) {
        return NextResponse.json({ error: 'ليس لديك صلاحية تعديل هذا المشروع' }, { status: 403 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isPublic !== undefined) updateData.is_public = isPublic
    if (files !== undefined) updateData.files = files

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update project error:', error)
      return NextResponse.json({ error: 'حدث خطأ في تحديث المشروع' }, { status: 500 })
    }

    return NextResponse.json({ project: toCamel(project) })
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
    const userId = searchParams.get('userId')

    if (!id) {
      return NextResponse.json({ error: 'معرف المشروع مطلوب' }, { status: 400 })
    }

    // Verify ownership
    if (userId) {
      const { data: existingProject } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', id)
        .single()

      if (!existingProject || existingProject.user_id !== userId) {
        return NextResponse.json({ error: 'ليس لديك صلاحية حذف هذا المشروع' }, { status: 403 })
      }
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete project error:', error)
      return NextResponse.json({ error: 'حدث خطأ في حذف المشروع' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف المشروع' }, { status: 500 })
  }
}
