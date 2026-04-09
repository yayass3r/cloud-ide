import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Extract user ID from request and verify admin role.
 * Checks Authorization header, query params, and request body.
 */
export async function verifyAdminAccess(
  request: NextRequest
): Promise<{ authorized: true; userId: string } | { authorized: false; response: NextResponse }> {
  let userId: string | null = null

  // 1. Check Authorization: Bearer <userId> header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.replace('Bearer ', '')
  }

  // 2. For non-GET requests, also check body for userId
  if (!userId && request.method !== 'GET') {
    try {
      const cloned = request.clone()
      const body = await cloned.json()
      userId = body.userId || null
    } catch {
      // Ignore parse errors
    }
  }

  // 3. For GET requests, check query params
  if (!userId) {
    const { searchParams } = new URL(request.url)
    userId = searchParams.get('userId')
  }

  if (!userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'المصادقة مطلوبة' },
        { status: 401 }
      ),
    }
  }

  // Verify user exists and has admin role
  const { data: adminUser, error } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (error || !adminUser || adminUser.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية الوصول' },
        { status: 403 }
      ),
    }
  }

  return { authorized: true, userId }
}
