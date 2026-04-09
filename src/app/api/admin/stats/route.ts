import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/verify-admin'

export async function GET(request: NextRequest) {
  // 🔒 Admin-only endpoint
  const authResult = await verifyAdminAccess(request)
  if (!authResult.authorized) return authResult.response

  try {
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeProjects, error: activeError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: totalDeployments, error: deploysError } = await supabaseAdmin
      .from('deployments')
      .select('*', { count: 'exact', head: true })

    const { count: publicProjects, error: publicError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)

    if (usersError || activeError || deploysError || publicError) {
      console.error('Error fetching admin stats:', { usersError, activeError, deploysError, publicError })
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        activeProjects: activeProjects ?? 0,
        totalDeployments: totalDeployments ?? 0,
        publicProjects: publicProjects ?? 0,
        storage: '2.4 جيجابايت',
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
