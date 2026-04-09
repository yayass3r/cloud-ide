import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/verify-admin'
import { toCamel, stripPassword } from '@/lib/supabase-utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 🔒 Admin-only endpoint
  const authResult = await verifyAdminAccess(request)
  if (!authResult.authorized) return authResult.response

  try {
    const { id } = await params
    const body = await request.json()

    // Convert camelCase keys to snake_case for the database
    const updateData: Record<string, unknown> = {}
    if (body.role !== undefined) updateData.role = body.role
    if (body.isFrozen !== undefined) updateData.is_frozen = body.isFrozen
    if (body.isOnline !== undefined) updateData.is_online = body.isOnline
    if (body.name !== undefined) updateData.name = body.name
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.skills !== undefined) updateData.skills = body.skills
    if (body.githubUrl !== undefined) updateData.github_url = body.githubUrl
    if (body.avatar !== undefined) updateData.avatar = body.avatar

    // If no known fields matched, try generic conversion for any other fields
    if (Object.keys(updateData).length === 0) {
      const snakeBody: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(body)) {
        const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
        snakeBody[snakeKey] = value
      }
      Object.assign(updateData, snakeBody)
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    const safeUser = stripPassword(user)
    return NextResponse.json({ user: toCamel(safeUser) })
  } catch (error) {
    console.error('Error updating admin user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
