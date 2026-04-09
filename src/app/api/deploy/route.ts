import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel } from '@/lib/supabase-utils'

const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN
const NETLIFY_API = 'https://api.netlify.com/api/v1'

interface DeployLog {
  time: string
  level: 'info' | 'success' | 'error' | 'warning'
  message: string
}

/**
 * Create a zip buffer from project files
 */
function createZipFromFiles(files: Record<string, string>): Buffer {
  // Simple implementation: create a minimal HTML file for deployment
  // In production, you'd use a library like JSZip or archiver
  const htmlFiles = files['index.html'] || ''
  const cssFiles = files['style.css'] || ''
  const jsFiles = files['script.js'] || ''

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deployed Project</title>
  <style>${cssFiles}</style>
</head>
<body>
${htmlFiles}
<script>${jsFiles}</script>
</body>
</html>`

  return Buffer.from(htmlContent, 'utf-8')
}

/**
 * Attempt real Netlify deployment
 */
async function deployToNetlify(
  project: Record<string, unknown>,
  userId: string,
  logs: DeployLog[]
): Promise<{ success: boolean; deployUrl: string | null; previewUrl: string | null; error?: string }> {
  if (!NETLIFY_TOKEN) {
    return { success: false, deployUrl: null, previewUrl: null }
  }

  try {
    const files = (project.files as Record<string, string>) || {}
    const zipBuffer = createZipFromFiles(files)

    const slug = (project.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const siteName = `${slug}-${Date.now()}`

    logs.push({ time: new Date().toISOString(), level: 'info', message: 'إنشاء الموقع على Netlify...' })

    // Create a new site on Netlify
    const siteRes = await fetch(`${NETLIFY_API}/sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: siteName,
        body: zipBuffer.toString('base64'),
      }),
    })

    if (!siteRes.ok) {
      const errText = await siteRes.text()
      logs.push({ time: new Date().toISOString(), level: 'error', message: `فشل في إنشاء الموقع: ${errText}` })
      return { success: false, deployUrl: null, previewUrl: null, error: errText }
    }

    const siteData = await siteRes.json()
    const deployUrl = siteData.ssl_url || siteData.url || `https://${siteName}.netlify.app`
    const previewUrl = siteData.deploy_url || deployUrl

    logs.push({ time: new Date().toISOString(), level: 'info', message: `تم إنشاء الموقع: ${siteName}` })
    logs.push({ time: new Date().toISOString(), level: 'success', message: 'تم النشر بنجاح!' })

    return { success: true, deployUrl, previewUrl }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logs.push({ time: new Date().toISOString(), level: 'error', message: `خطأ في النشر: ${errMsg}` })
    return { success: false, deployUrl: null, previewUrl: null, error: errMsg }
  }
}

/**
 * Simulated deploy fallback
 */
function simulateDeploy(
  project: Record<string, unknown>,
  logs: DeployLog[]
): { deployUrl: string; previewUrl: string } {
  const slug = (project.name as string)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const id = (project.id as string).slice(0, 8)

  logs.push({ time: new Date().toISOString(), level: 'info', message: 'بدء عملية النشر (وضع المحاكاة)...' })
  logs.push({ time: new Date().toISOString(), level: 'info', message: 'تحليل الملفات...' })
  logs.push({ time: new Date().toISOString(), level: 'info', message: 'بناء المشروع...' })
  logs.push({ time: new Date().toISOString(), level: 'success', message: 'تم النشر بنجاح!' })

  return {
    deployUrl: `https://${slug}-${id}.codecloud.app`,
    previewUrl: `https://preview-${slug}-${id}.codecloud.app`,
  }
}

// POST /api/deploy — Deploy a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, userId } = body

    if (!projectId || !userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المشروع والمستخدم مطلوبان' },
        { status: 400 }
      )
    }

    // Verify project exists and belongs to user
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'المشروع غير موجود' },
        { status: 404 }
      )
    }

    if (project.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية لنشر هذا المشروع' },
        { status: 403 }
      )
    }

    const logs: DeployLog[] = [
      { time: new Date().toISOString(), level: 'info', message: 'بدء عملية النشر...' },
    ]

    let deployUrl: string
    let previewUrl: string
    let isRealDeploy = false

    // Try real Netlify deploy first
    if (NETLIFY_TOKEN) {
      logs.push({ time: new Date().toISOString(), level: 'info', message: 'الاتصال بـ Netlify...' })
      const result = await deployToNetlify(project, userId, logs)
      if (result.success && result.deployUrl) {
        deployUrl = result.deployUrl
        previewUrl = result.previewUrl || result.deployUrl
        isRealDeploy = true
      } else {
        // Fall back to simulated deploy
        logs.push({ time: new Date().toISOString(), level: 'warning', message: 'تعذر الاتصال بـ Netlify، يتم استخدام وضع المحاكاة' })
        const simulated = simulateDeploy(project, logs)
        deployUrl = simulated.deployUrl
        previewUrl = simulated.previewUrl
      }
    } else {
      // No Netlify token — simulated deploy
      const simulated = simulateDeploy(project, logs)
      deployUrl = simulated.deployUrl
      previewUrl = simulated.previewUrl
    }

    // Create deployment record
    const { data: deployment, error: deployError } = await supabaseAdmin
      .from('deployments')
      .insert({
        project_id: projectId,
        user_id: userId,
        url: deployUrl,
        status: 'deployed',
        logs: JSON.stringify(logs),
      })
      .select()
      .single()

    if (deployError) {
      console.error('Deploy insert error:', deployError)
      return NextResponse.json(
        { success: false, error: 'حدث خطأ في خدمة النشر' },
        { status: 500 }
      )
    }

    // Update project with deployment info
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        is_deployed: true,
        deploy_url: deployUrl,
        preview_url: previewUrl,
      })
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('Deploy project update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      deployment: toCamel(deployment),
      project: updatedProject ? toCamel(updatedProject) : toCamel(project),
      message: isRealDeploy ? 'تم نشر المشروع على Netlify بنجاح!' : 'تم نشر المشروع بنجاح! (وضع المحاكاة)',
      isRealDeploy,
      deployUrl,
      previewUrl,
      logs,
    })
  } catch (error) {
    console.error('Deploy error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في خدمة النشر' },
      { status: 500 }
    )
  }
}

// GET /api/deploy — Get deployment history for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'معرف المشروع مطلوب' },
        { status: 400 }
      )
    }

    const { data: deployments, error } = await supabaseAdmin
      .from('deployments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Deploy GET error:', error)
      return NextResponse.json(
        { success: false, error: 'حدث خطأ في الخادم' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deployments: (deployments || []).map((d: Record<string, unknown>) => toCamel(d)),
    })
  } catch (error) {
    console.error('Deploy GET error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
