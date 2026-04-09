/**
 * Database abstraction layer using Supabase.
 *
 * This module re-exports the Supabase admin client as `db` so that existing
 * code that imported `db` from '@/lib/db' continues to work with minimal churn.
 *
 * For new code, prefer importing directly from '@/lib/supabase'.
 */

export { supabaseAdmin as db } from '@/lib/supabase'
