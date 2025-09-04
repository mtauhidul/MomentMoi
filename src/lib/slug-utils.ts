/**
 * Utility functions for generating and managing URL slugs
 */

import { createClientComponentClient } from './supabase';

/**
 * Generate a URL-friendly slug from a business name
 * @param name - The business name to convert to a slug
 * @returns A URL-friendly slug string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by checking for conflicts in the database
 * If a slug already exists, appends an increment (e.g., business-name-1, business-name-2)
 * @param businessName - The business name to generate a slug for
 * @param existingSlug - Optional existing slug to update (for avoiding self-conflict)
 * @returns A unique slug string
 */
export async function generateUniqueSlug(
  businessName: string,
  existingSlug?: string
): Promise<string> {
  try {
    const supabase = createClientComponentClient();
    const baseSlug = generateSlug(businessName);

    if (!baseSlug) {
      throw new Error('Unable to generate slug from business name');
    }

    // First, try the base slug
    if (existingSlug !== baseSlug) {
      const { data: existing } = await supabase
        .from('vendor_profiles')
        .select('slug')
        .eq('slug', baseSlug)
        .single();

      if (!existing) {
        return baseSlug;
      }
    }

    // If base slug exists, find the next available increment
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;

    while (true) {
      // Skip if this is the existing slug (for updates)
      if (existingSlug === uniqueSlug) {
        return uniqueSlug;
      }

      const { data: existing } = await supabase
        .from('vendor_profiles')
        .select('slug')
        .eq('slug', uniqueSlug)
        .single();

      if (!existing) {
        return uniqueSlug;
      }

      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;

      // Safety check to prevent infinite loops
      if (counter > 1000) {
        throw new Error('Unable to generate unique slug after 1000 attempts');
      }
    }
  } catch (error) {
    // If database operations fail, return a fallback slug
    console.warn('Failed to generate unique slug from database, using fallback:', error);
    const baseSlug = generateSlug(businessName);
    return baseSlug || 'vendor';
  }
}

/**
 * Validate if a slug is URL-friendly
 * @param slug - The slug to validate
 * @returns True if the slug is valid
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}

/**
 * Clean and normalize a slug
 * @param slug - The slug to clean
 * @returns A cleaned slug string
 */
export function cleanSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
