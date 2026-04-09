import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

/**
 * Next.js middleware for API route protection.
 *
 * Protected routes:
 * - /api/admin/* — requires JWT with role === 'admin'
 * - /api/projects (PUT/DELETE) — requires JWT with ownership (middleware just verifies token; ownership is checked in the route handler)
 * - /api/ai (POST) — requires JWT
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only intercept API routes that need protection
  const isAdminRoute = pathname.startsWith('/api/admin/')
  const isProjectsMutate = pathname === '/api/projects' && ['PUT', 'DELETE'].includes(request.method)
  const isAiPost = pathname === '/api/ai' && request.method === 'POST'

  if (!isAdminRoute && !isProjectsMutate && !isAiPost) {
    return NextResponse.next()
  }

  // Get token from Authorization header
  const token = getTokenFromHeader(request)
  if (!token) {
    return NextResponse.json(
      { error: 'رمز المصادقة مطلوب. يرجى تسجيل الدخول أولاً.' },
      { status: 401 }
    )
  }

  // Verify token
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'رمز المصادقة غير صالح أو منتهي الصلاحية.' },
      { status: 401 }
    )
  }

  // Admin routes require admin role
  if (isAdminRoute && payload.role !== 'admin') {
    return NextResponse.json(
      { error: 'ليس لديك صلاحية الوصول إلى هذا المسار.' },
      { status: 403 }
    )
  }

  // Inject userId and userRole into request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-role', payload.role)
  requestHeaders.set('x-user-email', payload.email)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/projects',
    '/api/ai',
  ],
}
