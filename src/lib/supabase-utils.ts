/**
 * Conversion utilities for Supabase <-> Frontend data
 * Supabase uses snake_case columns, frontend uses camelCase
 */

/**
 * Convert a single object's keys from snake_case to camelCase
 */
export function toCamel<T = Record<string, unknown>>(
  row: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = value
  }
  return result as T
}

/**
 * Convert a single object's keys from camelCase to snake_case
 */
export function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
    result[snakeKey] = value
  }
  return result
}

/**
 * Convert an array of snake_case objects to camelCase
 */
export function toCamelArray<T = Record<string, unknown>>(
  rows: Record<string, unknown>[]
): T[] {
  return rows.map(row => toCamel<T>(row))
}

/**
 * Strip the password field from a user object (DB row)
 */
export function stripPassword(
  user: Record<string, unknown>
): Record<string, unknown> {
  const { password: _, ...safeUser } = user
  return safeUser
}
