import { createSupabaseBrowserClient } from './supabase'

/**
 * Generate a URL-friendly slug from a team name
 */
export function generateSlug(teamName: string): string {
  return teamName
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, '-')
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
    // Check if slug already exists
    let query = supabase
      .from('teams')
      .select('id')
      .eq('slug', slug)
    
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
    
    // Prevent infinite loop (though very unlikely)
    if (counter > 1000) {
      throw new Error('Unable to generate unique slug after 1000 attempts')
    }
  }
}

/**
 * Generate a unique slug from a team name
 */
export async function generateUniqueSlug(teamName: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(teamName)
  return await createUniqueSlug(baseSlug, excludeId)
}
