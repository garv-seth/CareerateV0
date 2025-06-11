#!/bin/bash

echo "=== Careerate API Startup ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo "Installing dependencies..."
# Use npm install instead of npm ci since we don't have a consistent lock file
npm install --only=production

# Check if pg module is available (dependency for database connections)
if [ -d "node_modules/pg" ]; then
    echo "✅ pg module found in node_modules"
else
    echo "❌ pg module not found, installing..."
    npm install pg
fi

echo "Starting server..."
node dist/server.js 