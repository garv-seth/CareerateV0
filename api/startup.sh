#!/bin/bash

echo "=== Careerate API Startup ==="

# Check current directory
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    exit 1
fi

# Always install dependencies to ensure they're up to date
echo "Installing dependencies..."
npm ci --omit=dev --no-optional

# Verify pg module is installed
if [ -d "node_modules/pg" ]; then
    echo "✅ pg module found in node_modules"
else
    echo "❌ pg module NOT found in node_modules"
    echo "Contents of node_modules:"
    ls -la node_modules/ | head -20
fi

echo "Starting server..."
exec node dist/server.js 