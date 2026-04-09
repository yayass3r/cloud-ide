import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel, stripPassword } from '@/lib/supabase-utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.skills !== undefined) updateData.skills = body.skills
    if (body.githubUrl !== undefined) updateData.github_url = body.githubUrl
    if (body.avatar !== undefined) updateData.avatar = body.avatar

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    const safeUser = stripPassword(user)
    return NextResponse.json({ user: toCamel(safeUser) })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
