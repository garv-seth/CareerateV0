#!/bin/bash

echo "=== Careerate Azure Lightweight Deployment ==="
echo "=============================================="

# Basic error handling
set -euo pipefail

# Navigate to correct directory
cd "$(dirname "$0")"

# Set essential environment variables
export NODE_ENV=production
export PORT=${PORT:-8080}
export NODE_OPTIONS="--max-old-space-size=2048"

echo "📁 Directory: $(pwd)"
echo "🌍 Environment: $NODE_ENV"
echo "🔢 Port: $PORT"

# Check available space
echo "💾 Disk space:"
df -h . | head -2

# Quick cleanup - preserve node_modules if exists and valid
echo "🧹 Quick cleanup..."
rm -rf dist 2>/dev/null || true

# Ensure directories exist
mkdir -p public dist

# Check if node_modules exists and seems valid
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
    echo "📦 Using existing node_modules ($(du -sh node_modules | cut -f1))"
    MODULES_EXIST=true
else
    echo "📦 Installing dependencies..."
    rm -rf node_modules 2>/dev/null || true
    
    # Use npm ci for faster, reliable installs in production
    if [ -f "package-lock.json" ]; then
        npm ci --only=production --silent --no-audit --no-fund 2>/dev/null || {
            echo "⚠️  npm ci failed, falling back to npm install"
            npm install --only=production --silent --no-audit --no-fund
        }
    else
        npm install --only=production --silent --no-audit --no-fund
    fi
    MODULES_EXIST=true
fi

# Quick build - try multiple strategies
echo "🔨 Building application..."

# Strategy 1: Check if TypeScript is available locally
if [ -f "node_modules/.bin/tsc" ]; then
    echo "✅ Using local TypeScript"
    ./node_modules/.bin/tsc --version
    ./node_modules/.bin/tsc || {
        echo "❌ Local TypeScript failed"
        exit 1
    }
elif command -v tsc >/dev/null 2>&1; then
    echo "✅ Using global TypeScript"
    tsc || {
        echo "❌ Global TypeScript failed"
        exit 1
    }
else
    # Install TypeScript quickly for build only
    echo "🔧 Installing TypeScript for build..."
    npm install typescript --no-save --silent 2>/dev/null || {
        echo "❌ TypeScript installation failed"
        exit 1
    }
    ./node_modules/.bin/tsc || {
        echo "❌ Build failed after TypeScript install"
        exit 1
    }
fi

# Verify build output
if [ ! -f "dist/server.js" ]; then
    echo "❌ Build failed - server.js not found"
    exit 1
fi

echo "✅ Build complete: $(stat -c%s dist/server.js 2>/dev/null || echo 'unknown') bytes"

# Set up minimal frontend
echo "🌐 Setting up frontend..."
if [ ! -f "public/index.html" ]; then
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Careerate API</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        .status { background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; color: #10b981; padding: 15px 30px; border-radius: 25px; display: inline-block; margin: 20px 0; }
        .endpoints { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 30px 0; }
        .endpoint { background: rgba(0,0,0,0.3); margin: 10px 0; padding: 10px 20px; border-radius: 8px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Careerate API</h1>
        <div class="status">✅ Production Ready</div>
        <p>Backend API is running successfully on Azure App Service</p>
        <div class="endpoints">
            <h3>API Endpoints</h3>
            <div class="endpoint">GET /health - Health check</div>
            <div class="endpoint">GET /api - API information</div>
            <div class="endpoint">POST /api/chat - AI chat</div>
            <div class="endpoint">GET /api/agents - Available agents</div>
        </div>
    </div>
</body>
</html>
EOF
fi

# Final status
echo ""
echo "✅ Deployment Summary:"
echo "- Environment: $NODE_ENV"
echo "- Port: $PORT"  
echo "- Node.js: $(node --version)"
echo "- Server: $(stat -c%s dist/server.js 2>/dev/null || echo 'unknown') bytes"
echo "- Frontend: Ready"
echo ""
echo "🚀 Starting server..."

# Start server
exec node dist/server.js 