import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FavoritesService } from '@/lib/favorites-service';

export interface VendorProfile {
  id: string;
  slug: string | null;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  business_category: string;
  event_types: string[];
  profile_views: number;
  created_at: string;
  vendor_services: VendorService[];
  vendor_locations: VendorLocation[];
  vendor_contacts: VendorContact[];
}

interface VendorService {
  id: string;
  name: string;
  description: string | null;
  pricing_model: string;
  event_types: string[];
  is_active: boolean;
  category: {
    name: string;
    icon: string | null;
  };
}

interface VendorLocation {
  id: string;
  location: string;
}

interface VendorContact {
  id: string;
  contact_type: string;
  contact_value: string;
  is_primary: boolean;
}

export function useVendorFavorites() {
  const { user } = useAuth();
  const [favoriteVendors, setFavoriteVendors] = useState<VendorProfile[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites on mount
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const loadFavorites = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load favorite IDs
      const ids = await FavoritesService.getFavoriteVendorIds(user.id);
      setFavoriteIds(new Set(ids));

      // Load full vendor details
      const vendors = await FavoritesService.getFavoriteVendors(user.id);
      setFavoriteVendors(vendors);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id

  const toggleFavorite = useCallback(async (vendorId: string) => {
    if (!user) {
      return;
    }

    try {
      const success = await FavoritesService.toggleFavorite(user.id, vendorId);
      
      if (success) {
        // Update local state
        const newFavoriteIds = new Set(favoriteIds);
        if (newFavoriteIds.has(vendorId)) {
          newFavoriteIds.delete(vendorId);
          // Remove from vendors list
          setFavoriteVendors(prev => prev.filter(v => v.id !== vendorId));
        } else {
          newFavoriteIds.add(vendorId);
          // Note: We don't add to vendors list here as we don't have the full vendor data
          // The user would need to refresh or navigate to see the new favorite
        }
        setFavoriteIds(newFavoriteIds);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite');
    }
  }, [user, favoriteIds]);

  const addToFavorites = useCallback(async (vendorId: string) => {
    if (!user) {
      return false;
    }

    try {
      const success = await FavoritesService.addToFavorites(user.id, vendorId);
      
      if (success) {
        setFavoriteIds(prev => new Set([...prev, vendorId]));
      }
      
      return success;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      setError('Failed to add to favorites');
      return false;
    }
  }, [user?.id]);

  const removeFromFavorites = useCallback(async (vendorId: string) => {
    if (!user) {
      return false;
    }

    try {
      const success = await FavoritesService.removeFromFavorites(user.id, vendorId);
      
      if (success) {
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(vendorId);
          return newSet;
        });
        setFavoriteVendors(prev => prev.filter(v => v.id !== vendorId));
      }
      
      return success;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove from favorites');
      return false;
    }
  }, [user?.id]);

  const clearAllFavorites = useCallback(async () => {
    if (!user) {
      return false;
    }

    try {
      const success = await FavoritesService.clearAllFavorites(user.id);
      
      if (success) {
        setFavoriteIds(new Set());
        setFavoriteVendors([]);
      }
      
      return success;
    } catch (err) {
      console.error('Error clearing favorites:', err);
      setError('Failed to clear favorites');
      return false;
    }
  }, [user?.id]);

  const isFavorited = useCallback((vendorId: string): boolean => {
    return favoriteIds.has(vendorId);
  }, [favoriteIds]);

  const getFavoritesCount = useCallback((): number => {
    return favoriteIds.size;
  }, [favoriteIds]);

  return {
    favoriteVendors,
    favoriteIds,
    loading,
    error,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    clearAllFavorites,
    isFavorited,
    getFavoritesCount,
    refresh: loadFavorites,
  };
}
