import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/deploy — Deploy a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المشروع والمستخدم مطلوبان' },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to user
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'المشروع غير موجود' },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية لنشر هذا المشروع' },
        { status: 403 }
      );
    }

    // Generate a mock deployment URL
    const slug = project.name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const deployUrl = `https://${slug}-${project.id.slice(0, 8)}.codecloud.app`;
    const previewUrl = `https://preview-${slug}-${project.id.slice(0, 8)}.codecloud.app`;

    // Create deployment record
    const deployment = await db.deployment.create({
      data: {
        projectId,
        userId,
        url: deployUrl,
        status: 'deployed',
        logs: JSON.stringify([
          { time: new Date().toISOString(), level: 'info', message: 'بدء عملية النشر...' },
          { time: new Date().toISOString(), level: 'info', message: 'تحليل الملفات...' },
          { time: new Date().toISOString(), level: 'info', message: 'بناء المشروع...' },
          { time: new Date().toISOString(), level: 'success', message: 'تم النشر بنجاح!' },
        ]),
      },
    });

    // Update project with deployment info
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        isDeployed: true,
        deployUrl,
        previewUrl,
      },
    });

    return NextResponse.json({
      success: true,
      deployment,
      project: updatedProject,
      message: 'تم نشر المشروع بنجاح!',
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في خدمة النشر' },
      { status: 500 }
    );
  }
}

// GET /api/deploy — Get deployment history for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'معرف المشروع مطلوب' },
        { status: 400 }
      );
    }

    const deployments = await db.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, deployments });
  } catch (error) {
    console.error('Deploy GET error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
