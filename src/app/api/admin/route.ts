import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/verify-admin'
import { toCamel, stripPassword } from '@/lib/supabase-utils'

// GET /api/admin — List users or get stats
export async function GET(request: NextRequest) {
  const authResult = await verifyAdminAccess(request)
  if (!authResult.authorized) return authResult.response

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Get platform stats using count queries
      const [
        { count: totalUsers },
        { count: totalProjects },
        { count: totalDeployments },
        { count: activeUsers },
        { count: adminUsers },
        { count: publicProjects },
      ] = await Promise.all([
        supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('projects')
          .select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('deployments')
          .select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_online', true),
        supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin'),
        supabaseAdmin
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true),
      ])

      // Recent users (last 5)
      const { data: recentUsers } = await supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, role')
        .order('created_at', { ascending: false })
        .limit(5)

      // Recent projects with owner name (last 5)
      const { data: recentProjects } = await supabaseAdmin
        .from('projects')
        .select('id, name, template, status, created_at, user:users(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      // Map recent users to camelCase
      const mappedRecentUsers = (recentUsers || []).map((u) => toCamel(u))

      // Map recent projects – flatten the nested user object to match the old Prisma shape
      const mappedRecentProjects = (recentProjects || []).map((p: Record<string, unknown>) => {
        const project = toCamel(p)
        const rawUser = p.user as Record<string, unknown> | null
        return {
          ...project,
          user: rawUser ? { name: rawUser.name } : { name: null },
        }
      })

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers: totalUsers ?? 0,
          totalProjects: totalProjects ?? 0,
          totalDeployments: totalDeployments ?? 0,
          activeUsers: activeUsers ?? 0,
          adminUsers: adminUsers ?? 0,
          publicProjects: publicProjects ?? 0,
        },
        recentUsers: mappedRecentUsers,
        recentProjects: mappedRecentProjects,
      })
    }

    // Default: list all users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin list users error:', error)
      return NextResponse.json(
        { success: false, error: 'حدث خطأ في الخادم' },
        { status: 500 }
      )
    }

    // Compute project & deployment counts per user
    const allUsers = users || []
    const userIds = allUsers.map((u) => u.id)

    const projectCountMap: Record<string, number> = {}
    const deployCountMap: Record<string, number> = {}

    if (userIds.length > 0) {
      const [projectRows, deployRows] = await Promise.all([
        supabaseAdmin.from('projects').select('user_id').in('user_id', userIds),
        supabaseAdmin.from('deployments').select('user_id').in('user_id', userIds),
      ])

      for (const p of projectRows || []) {
        projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1
      }
      for (const d of deployRows || []) {
        deployCountMap[d.user_id] = (deployCountMap[d.user_id] || 0) + 1
      }
    }

    const result = allUsers.map((u) => {
      const safeUser = stripPassword(u)
      return {
        ...toCamel(safeUser),
        _count: {
          projects: projectCountMap[u.id] || 0,
          deployments: deployCountMap[u.id] || 0,
        },
      }
    })

    return NextResponse.json({ success: true, users: result })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// PUT /api/admin — Update user (role, freeze status)
export async function PUT(request: NextRequest) {
  const authResult = await verifyAdminAccess(request)
  if (!authResult.authorized) return authResult.response

  try {
    const body = await request.json()
    const { id, role, isFrozen } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'الدور يجب أن يكون user أو admin' },
          { status: 400 }
        )
      }
      updateData.role = role
    }
    if (isFrozen !== undefined) {
      updateData.is_frozen = isFrozen
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, name, role, is_frozen')
      .single()

    if (error) {
      console.error('Admin PUT error:', error)
      return NextResponse.json(
        { success: false, error: 'حدث خطأ في الخادم' },
        { status: 500 }
      )
    }

    // Map is_frozen back to isFrozen for frontend compatibility
    const camelUser = toCamel(user)

    return NextResponse.json({ success: true, user: camelUser })
  } catch (error) {
    console.error('Admin PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
