import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toCamel, stripPassword } from '@/lib/supabase-utils'
import { uploadAvatar, deleteAvatar } from '@/lib/storage'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.skills !== undefined) updateData.skills = body.skills
    if (body.githubUrl !== undefined) updateData.github_url = body.githubUrl

    // Handle avatar upload to Supabase Storage
    if (body.avatar !== undefined) {
      const avatarDataUri = body.avatar as string

      // Check if it's a base64 data URI (new upload)
      if (avatarDataUri && avatarDataUri.startsWith('data:image/')) {
        // Extract extension from data URI
        const mimeMatch = avatarDataUri.match(/^data:image\/([a-z]+);/)
        const ext = mimeMatch ? mimeMatch[1] : 'png'

        const publicUrl = await uploadAvatar(id, avatarDataUri, ext)
        if (publicUrl) {
          updateData.avatar = publicUrl
        } else {
          return NextResponse.json(
            { error: 'فشل في رفع الصورة الرمزية. تأكد أن حجمها أقل من 2 ميجابايت' },
            { status: 400 }
          )
        }
      } else if (avatarDataUri === null || avatarDataUri === '') {
        // Remove avatar
        await deleteAvatar(id)
        updateData.avatar = null
      }
      // If it's already a URL (no change), skip processing
      else if (avatarDataUri && !avatarDataUri.startsWith('data:')) {
        updateData.avatar = avatarDataUri
      }
    }

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

    // Delete avatar from storage
    await deleteAvatar(id)

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
