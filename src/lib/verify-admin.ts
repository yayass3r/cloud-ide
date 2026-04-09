import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

/**
 * Verify admin access using JWT token.
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and checks that the user has the 'admin' role.
 *
 * Security: Only accepts JWT from the Authorization header.
 * No fallbacks to body/query params (prevents token injection).
 */
export async function verifyAdminAccess(
  request: NextRequest
): Promise<{ authorized: true; userId: string } | { authorized: false; response: NextResponse }> {
  // ONLY accept token from Authorization header (no body/query fallbacks)
  const token = getTokenFromHeader(request)

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'المصادقة مطلوبة' },
        { status: 401 }
      ),
    }
  }

  // Verify JWT and extract payload
  const payload = await verifyToken(token)
  if (!payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'رمز المصادقة غير صالح أو منتهي الصلاحية' },
        { status: 401 }
      ),
    }
  }

  // Check admin role
  if (payload.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية الوصول' },
        { status: 403 }
      ),
    }
  }

  return { authorized: true, userId: payload.userId }
}
