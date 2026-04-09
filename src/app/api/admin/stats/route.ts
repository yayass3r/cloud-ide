import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const totalUsers = await db.user.count()
    const activeProjects = await db.project.count({ where: { status: 'active' } })
    const totalDeployments = await db.deployment.count()
    const publicProjects = await db.project.count({ where: { isPublic: true } })

    return NextResponse.json({
      stats: {
        totalUsers,
        activeProjects,
        totalDeployments,
        publicProjects,
        storage: '2.4 جيجابايت',
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
