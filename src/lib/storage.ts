import { supabaseAdmin } from '@/lib/supabase'

const BUCKET_NAME = 'avatars'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

/**
 * Upload avatar image to Supabase Storage
 * @param userId - The user's UUID
 * @param file - File object or base64 data URI string
 * @param ext - File extension (jpg, png, etc.)
 * @returns The public URL of the uploaded file, or null on failure
 */
export async function uploadAvatar(
  userId: string,
  file: File | string,
  ext: string
): Promise<string | null> {
  try {
    // Validate extension
    const normalizedExt = ext.replace('.', '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(normalizedExt)) {
      console.error('Invalid file extension:', ext)
      return null
    }

    let buffer: Buffer

    if (file instanceof File) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.error('File too large:', file.size)
        return null
      }
      buffer = Buffer.from(await file.arrayBuffer())
    } else {
      // Base64 data URI
      const matches = file.match(/^data:[^;]+;base64,(.+)$/)
      if (!matches) {
        console.error('Invalid base64 data URI')
        return null
      }
      buffer = Buffer.from(matches[1], 'base64')
      if (buffer.length > MAX_FILE_SIZE) {
        console.error('File too large:', buffer.length)
        return null
      }
    }

    const filePath = `${userId}/${Date.now()}.${normalizedExt}`

    // Delete old avatar if exists
    await deleteAvatar(userId)

    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: `image/${normalizedExt === 'jpg' ? 'jpeg' : normalizedExt}`,
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return null
    }

    return getAvatarUrl(filePath)
  } catch (error) {
    console.error('Avatar upload error:', error)
    return null
  }
}

/**
 * Delete all avatar files for a user from Supabase Storage
 * @param userId - The user's UUID
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    // List all files in the user's folder
    const { data, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(userId)

    if (listError) {
      console.error('Storage list error:', listError)
      return
    }

    if (data && data.length > 0) {
      const filesToDelete = data.map((file) => `${userId}/${file.name}`)
      const { error: deleteError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete)

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
      }
    }
  } catch (error) {
    console.error('Avatar delete error:', error)
  }
}

/**
 * Get the public URL for an avatar file
 * @param path - The storage path (e.g., "userId/timestamp.png")
 * @returns The public URL string
 */
export function getAvatarUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return path
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${path}`
}
