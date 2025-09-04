import { createClientComponentClient } from './supabase';

export interface VendorFavorite {
  id: string;
  user_id: string;
  vendor_id: string;
  created_at: string;
}

export class FavoritesService {
  private static getStorageKey(userId: string): string {
    return `vendor_favorites_${userId}`;
  }

  /**
   * Get all favorite vendor IDs for a user
   */
  static async getFavoriteVendorIds(userId: string): Promise<string[]> {
    try {
      // For now, use localStorage. This can be easily replaced with database calls later
      const stored = localStorage.getItem(this.getStorageKey(userId));
      const favoriteIds = stored ? JSON.parse(stored) : [];
      return favoriteIds;
    } catch (error) {
      console.error('Error getting favorite vendor IDs:', error);
      return [];
    }
  }

  /**
   * Check if a vendor is favorited by a user
   */
  static async isVendorFavorited(userId: string, vendorId: string): Promise<boolean> {
    try {
      const favoriteIds = await this.getFavoriteVendorIds(userId);
      return favoriteIds.includes(vendorId);
    } catch (error) {
      console.error('Error checking if vendor is favorited:', error);
      return false;
    }
  }

  /**
   * Add a vendor to favorites
   */
  static async addToFavorites(userId: string, vendorId: string): Promise<boolean> {
    try {
      const favoriteIds = await this.getFavoriteVendorIds(userId);
      
      if (!favoriteIds.includes(vendorId)) {
        favoriteIds.push(vendorId);
        localStorage.setItem(this.getStorageKey(userId), JSON.stringify(favoriteIds));
        
        // TODO: When database table is available, add this call:
        // await this.addToDatabase(userId, vendorId);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding vendor to favorites:', error);
      return false;
    }
  }

  /**
   * Remove a vendor from favorites
   */
  static async removeFromFavorites(userId: string, vendorId: string): Promise<boolean> {
    try {
      const favoriteIds = await this.getFavoriteVendorIds(userId);
      const updatedIds = favoriteIds.filter(id => id !== vendorId);
      
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(updatedIds));
      
      // TODO: When database table is available, add this call:
      // await this.removeFromDatabase(userId, vendorId);
      
      return true;
    } catch (error) {
      console.error('Error removing vendor from favorites:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status for a vendor
   */
  static async toggleFavorite(userId: string, vendorId: string): Promise<boolean> {
    try {
      const isFavorited = await this.isVendorFavorited(userId, vendorId);
      
      if (isFavorited) {
        return await this.removeFromFavorites(userId, vendorId);
      } else {
        return await this.addToFavorites(userId, vendorId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  /**
   * Get favorite vendors with full details
   */
  static async getFavoriteVendors(userId: string) {
    try {
      const supabase = createClientComponentClient();
      const favoriteIds = await this.getFavoriteVendorIds(userId);
      
      if (favoriteIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          *,
          vendor_services (
            id,
            name,
            description,
            pricing_model,
            event_types,
            is_active,
            category:service_categories (
              name,
              icon
            )
          ),
          vendor_locations (
            id,
            location
          ),
          vendor_contacts (
            id,
            contact_type,
            contact_value,
            is_primary
          )
        `)
        .in('id', favoriteIds)
        .order('business_name');

      if (error) {
        console.error('Error getting favorite vendors:', error);
        throw error;
      }

      // Filter to only show vendors with active services
      // But also include vendors that have no services at all (for testing/development)
      const filteredVendors = data?.filter(vendor => {
        // If vendor has no services, include them (for development/testing)
        if (!vendor.vendor_services || vendor.vendor_services.length === 0) {
          return true;
        }
        
        // If vendor has services, only include if at least one is active
        return vendor.vendor_services.some((service: any) => service.is_active);
      }) || [];
      
      return filteredVendors;
    } catch (error) {
      console.error('Error getting favorite vendors:', error);
      return [];
    }
  }

  /**
   * Clear all favorites for a user
   */
  static async clearAllFavorites(userId: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.getStorageKey(userId));
      
      // TODO: When database table is available, add this call:
      // await this.clearAllFromDatabase(userId);
      
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }

  /**
   * Get favorites count for a user
   */
  static async getFavoritesCount(userId: string): Promise<number> {
    try {
      const favoriteIds = await this.getFavoriteVendorIds(userId);
      return favoriteIds.length;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  }

  // TODO: Database methods for future migration
  /*
  private static async addToDatabase(userId: string, vendorId: string) {
    const supabase = createClientComponentClient();
    await supabase.from('vendor_favorites').insert({
      user_id: userId,
      vendor_id: vendorId
    });
  }

  private static async removeFromDatabase(userId: string, vendorId: string) {
    const supabase = createClientComponentClient();
    await supabase.from('vendor_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('vendor_id', vendorId);
  }

  private static async clearAllFromDatabase(userId: string) {
    const supabase = createClientComponentClient();
    await supabase.from('vendor_favorites')
      .delete()
      .eq('user_id', userId);
  }
  */
}
