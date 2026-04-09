import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/verify-admin'
import { toCamel, stripPassword } from '@/lib/supabase-utils'

export async function GET(request: NextRequest) {
  // 🔒 Admin-only endpoint
  const authResult = await verifyAdminAccess(request)
  if (!authResult.authorized) return authResult.response

  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const allUsers = users || []

    // Get project counts grouped by user_id
    const { data: projectRows } = await supabaseAdmin
      .from('projects')
      .select('user_id')

    const projectCountMap: Record<string, number> = {}
    for (const p of projectRows || []) {
      projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1
    }

    // Get deployment counts grouped by user_id
    const { data: deployRows } = await supabaseAdmin
      .from('deployments')
      .select('user_id')

    const deployCountMap: Record<string, number> = {}
    for (const d of deployRows || []) {
      deployCountMap[d.user_id] = (deployCountMap[d.user_id] || 0) + 1
    }

    const result = allUsers.map(u => {
      const safeUser = stripPassword(u)
      return {
        ...toCamel(safeUser),
        _count: {
          projects: projectCountMap[u.id] || 0,
          deployments: deployCountMap[u.id] || 0,
        },
      }
    })

    return NextResponse.json({ users: result })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
