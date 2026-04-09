import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: { isPublic: true, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: { select: { deployments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching public projects:', error)
    return NextResponse.json({ error: 'Failed to fetch public projects' }, { status: 500 })
  }
}
