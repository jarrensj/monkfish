import { createSupabaseBrowserClient } from './supabase'

/**
 * Generate a URL-friendly slug from a team name
 */
export function generateSlug(teamName: string): string {
  return teamName
    .trim()
    .toLowerCase()
    .replace(/'/g, '') // Remove apostrophes (e.g., "kyle's" -> "kyles")
    .replace(/[^a-zA-Z0-9]+/g, '-') // Replace other special chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Create a unique slug by checking for conflicts and adding a counter if needed
 */
export async function createUniqueSlug(
  baseSlug: string, 
  excludeId?: string
): Promise<string> {
  const supabase = createSupabaseBrowserClient()
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    // Check if slug already exists (case-insensitive)
    let query = supabase
      .from('teams')
      .select('id')
      .ilike('slug', slug)
    
    // Exclude current team when updating
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { error } = await query.single()
    
    if (error && error.code === 'PGRST116') {
      // No conflict found (PGRST116 = no rows returned), slug is available
      return slug
    }
    
    if (error) {
      // Some other error occurred
      throw new Error(`Error checking slug uniqueness: ${error.message}`)
    }
    
    // Conflict found, try with counter
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Generate a unique slug from a team name
 */
export async function generateUniqueSlug(teamName: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(teamName)
  return await createUniqueSlug(baseSlug, excludeId)
}
