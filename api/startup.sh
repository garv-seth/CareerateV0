#!/bin/bash

echo "=== Careerate API Startup ==="

# Install dependencies if node_modules doesn't exist or is empty
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "Installing dependencies..."
    npm ci --omit=dev --no-optional
fi

echo "Starting server..."
exec node dist/server.js 