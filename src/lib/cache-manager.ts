"use client";

import { useEffect } from 'react';

/**
 * Client-side cache management utility
 * Handles browser cache, service worker cache, and localStorage
 */
export function useCacheManager() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Check if we need to clear cache based on version
    const currentVersion = document.body.getAttribute('data-version');
    const lastVersion = localStorage.getItem('app-version');

    if (lastVersion && lastVersion !== currentVersion) {
      console.log('🧹 App version changed, clearing caches...');
      clearAllCaches();
    }

    // Store current version
    if (currentVersion) {
      localStorage.setItem('app-version', currentVersion);
    }
  }, []);

  const clearAllCaches = async () => {
    try {
      // Clear all browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Browser caches cleared');
      }

      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log('✅ Service workers unregistered');
      }

      // Clear localStorage (except essential items)
      const essentialKeys = ['app-version'];
      Object.keys(localStorage).forEach(key => {
        if (!essentialKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ All caches cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  };

  return { clearAllCaches };
}

/**
 * Development-only cache clearing component
 * Add this to your layout in development mode
 */
export function CacheManager() {
  useCacheManager();
  return null;
}
