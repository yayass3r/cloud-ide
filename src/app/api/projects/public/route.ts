import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel } from '@/lib/supabase-utils'

export async function GET() {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching public projects:', error)
      return NextResponse.json({ error: 'Failed to fetch public projects' }, { status: 500 })
    }

    const allProjects = projects || []

    // Get unique user IDs
    const userIds = [...new Set(allProjects.map(p => p.user_id))]
    const userMap = new Map<string, Record<string, unknown>>()

    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, avatar')
        .in('id', userIds)

      for (const u of users || []) {
        userMap.set(u.id, u)
      }
    }

    // Get deployment counts
    const projectIds = allProjects.map(p => p.id)
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

    const result = allProjects.map(p => {
      const userData = userMap.get(p.user_id)
      const camelProject = toCamel(p)
      return {
        ...camelProject,
        user: userData
          ? { id: userData.id, name: userData.name, avatar: userData.avatar }
          : null,
        _count: { deployments: deployCountMap[p.id] || 0 },
      }
    })

    return NextResponse.json({ projects: result })
  } catch (error) {
    console.error('Error fetching public projects:', error)
    return NextResponse.json({ error: 'Failed to fetch public projects' }, { status: 500 })
  }
}
