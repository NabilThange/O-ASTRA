#!/bin/bash

# Build script for Vercel deployment
# This script handles the shared package dependency

echo "🔨 Building aria-ui for Vercel..."

# Check if shared package exists (monorepo setup)
if [ -d "../shared" ]; then
  echo "✅ Found shared package, building it first..."
  cd ../shared
  npm install
  npm run build
  cd ../aria-ui
else
  echo "⚠️  Shared package not found at ../shared"
  echo "📦 Checking if shared is in node_modules..."
  
  # If shared is not in node_modules, we need to handle it
  if [ ! -d "node_modules/@bytebot/shared" ]; then
    echo "❌ Shared package not found. This build will likely fail."
    echo "💡 Make sure to deploy from the repository root or include shared package."
  fi
fi

echo "🏗️  Building Next.js app..."
npm run build:next
