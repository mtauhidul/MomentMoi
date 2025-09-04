#!/bin/bash

# Clear all development caches for MomentMoi

echo "🧹 Clearing all development caches..."

# Clear Next.js build cache
echo "📁 Clearing Next.js build cache..."
rm -rf .next

# Clear node_modules cache (optional, uncomment if needed)
# echo "📦 Clearing node_modules..."
# rm -rf node_modules
# pnpm install

# Clear pnpm cache
echo "📦 Clearing pnpm cache..."
pnpm store prune

# Clear browser cache programmatically (if service worker is registered)
echo "🌐 Updating service worker version..."

# Start development server
echo "🚀 Starting development server..."
pnpm run dev

echo "✅ Cache clearing complete!"
echo "💡 If you still see old content, please:"
echo "   1. Open DevTools (F12)"
echo "   2. Right-click refresh button"
echo "   3. Select 'Empty Cache and Hard Reload'"
