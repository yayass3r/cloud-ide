# Task 3 - JWT Authentication, Rate Limiting, and Password Reset

## Files Created
- `src/lib/auth.ts` — JWT utility functions (generateToken, verifyToken, getTokenFromHeader) using `jose` library
- `src/lib/rate-limit.ts` — In-memory rate limiter using Map with cleanup, includes `getClientIp()` helper
- `src/middleware.ts` — Next.js middleware protecting `/api/admin/*`, `/api/projects` PUT/DELETE, `/api/ai` POST
- `src/components/auth/ForgotPasswordForm.tsx` — Arabic RTL forgot password form with reset flow

## Files Modified
- `src/app/api/auth/route.ts` — Added JWT token generation on login/register, GET handler for token verification, rate limiting (5 login/min, 3 register/min, 3 reset/min), password reset request and reset actions
- `src/store/index.ts` — Added `token` state, `setToken`, `apiFetch` helper (auto-injects Authorization header), `getAuthHeaders`, `initAuthFromStorage`, updated `logout` to clear token, added `forgot-password` to AppView type
- `src/app/page.tsx` — Added `ForgotPasswordForm` import, `forgot-password` view routing, token verification on mount using GET /api/auth
- `src/components/auth/LoginForm.tsx` — Now stores JWT token via `setToken`, added "نسيت كلمة المرور؟" link
- `src/components/auth/RegisterForm.tsx` — Now stores JWT token via `setToken`
- `src/components/ide/IDEView.tsx` — Updated `handleSave` to use `apiFetch` for authenticated PUT requests
- `src/components/chat/AiChatPanel.tsx` — Updated AI chat to use `apiFetch` for authenticated POST requests
- `src/components/ide/ProjectTemplates.tsx` — Updated project creation to use `apiFetch`
- `src/components/admin/AdminDashboard.tsx` — Updated all admin API calls to use `apiFetch`
- `src/components/dashboard/UserDashboard.tsx` — Updated dashboard API calls to use `apiFetch`
- `src/components/dashboard/UserProfile.tsx` — Updated profile save/delete/toggle API calls to use `apiFetch`
- `supabase/migrations/001_initial_schema.sql` — Added `reset_token`, `reset_token_expires` columns and index

## Architecture
- JWT tokens: 7-day expiry, HS256 algorithm, secret from env or secure default
- Rate limiting: Per-IP, in-memory Map with automatic cleanup every 5 minutes
- Middleware: Protects admin routes (admin role required), project mutations (token required), AI chat (token required). Injects `x-user-id`, `x-user-role`, `x-user-email` headers for downstream use.
- API helper: `apiFetch()` in Zustand store automatically includes `Authorization: Bearer <token>` header and sets `Content-Type: application/json` for JSON bodies
- Password reset: Uses `reset_token` and `reset_token_expires` columns in users table, 30-minute token expiry
