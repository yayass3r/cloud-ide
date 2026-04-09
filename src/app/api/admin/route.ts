import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin — List users or get stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Get platform stats
      const [
        totalUsers,
        totalProjects,
        totalDeployments,
        activeUsers,
        adminUsers,
        publicProjects,
      ] = await Promise.all([
        db.user.count(),
        db.project.count(),
        db.deployment.count(),
        db.user.count({ where: { isOnline: true } }),
        db.user.count({ where: { role: 'admin' } }),
        db.project.count({ where: { isPublic: true } }),
      ]);

      const recentUsers = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true, role: true },
      });

      const recentProjects = await db.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          template: true,
          status: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers,
          totalProjects,
          totalDeployments,
          activeUsers,
          adminUsers,
          publicProjects,
        },
        recentUsers,
        recentProjects,
      });
    }

    // Default: list all users
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        skills: true,
        githubUrl: true,
        isFrozen: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { projects: true, deployments: true },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// PUT /api/admin — Update user (role, freeze status)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role, isFrozen } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'الدور يجب أن يكون user أو admin' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    if (isFrozen !== undefined) {
      updateData.isFrozen = isFrozen;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isFrozen: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Admin PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
