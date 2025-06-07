#!/bin/bash

echo "=== Careerate API Startup ==="
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"

# Clean install
echo "Cleaning up previous installation..."
rm -rf node_modules package-lock.json

echo "Installing dependencies..."
npm install --production --no-optional

echo "Building TypeScript..."
npm run build

echo "Checking build output..."
if [ ! -f "./dist/server.js" ]; then
    echo "❌ Build failed - server.js not found"
    exit 1
fi

echo "✅ Build successful"
echo "Starting server..."
npm start 