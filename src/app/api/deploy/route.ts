import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel } from '@/lib/supabase-utils'

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

    // Generate a mock deployment URL
    const slug = project.name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const deployUrl = `https://${slug}-${project.id.slice(0, 8)}.codecloud.app`
    const previewUrl = `https://preview-${slug}-${project.id.slice(0, 8)}.codecloud.app`

    // Create deployment record
    const { data: deployment, error: deployError } = await supabaseAdmin
      .from('deployments')
      .insert({
        project_id: projectId,
        user_id: userId,
        url: deployUrl,
        status: 'deployed',
        logs: JSON.stringify([
          { time: new Date().toISOString(), level: 'info', message: 'بدء عملية النشر...' },
          { time: new Date().toISOString(), level: 'info', message: 'تحليل الملفات...' },
          { time: new Date().toISOString(), level: 'info', message: 'بناء المشروع...' },
          { time: new Date().toISOString(), level: 'success', message: 'تم النشر بنجاح!' },
        ]),
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
      message: 'تم نشر المشروع بنجاح!',
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
