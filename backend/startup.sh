#!/bin/bash

echo "=== Careerate Azure Production Start ==="
echo "========================================"

# Basic error handling
set -euo pipefail

# Navigate to correct directory
cd "$(dirname "$0")"

# Set essential environment variables
export NODE_ENV=production
export PORT=${PORT:-8080}

echo "📁 Directory: $(pwd)"
echo "🌍 Environment: $NODE_ENV"
echo "🔢 Port: $PORT"
echo "✅ Node.js: $(node --version)"

# Check for build artifacts
if [ ! -f "dist/server.js" ]; then
    echo "❌ Critical Error: Build artifact 'dist/server.js' not found."
    echo "   The application must be built *before* deployment."
    echo "   Ensure your CI/CD pipeline runs 'npm run build' and deploys the 'dist' folder."
    exit 1
fi

echo "✅ Build artifacts found."
echo ""
echo "🚀 Starting server..."

# Start server using the pre-built artifacts
exec node dist/server.js 