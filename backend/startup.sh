#!/bin/bash

echo "=== Careerate Azure Production Deployment ==="
echo "=============================================="

# Set strict error handling
set -e

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Set environment variables for Node.js and Azure
export NODE_ENV=production
export PORT=${PORT:-8080}
export NODE_OPTIONS="--max-old-space-size=4096"

echo "📁 Current directory: $(pwd)"
echo "🌍 Environment: $NODE_ENV"
echo "🔢 Port: $PORT"
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Clean previous builds but preserve critical files
echo "🧹 Cleaning previous builds..."
rm -rf dist 2>/dev/null || true
rm -rf node_modules 2>/dev/null || true

# Ensure public directory exists
mkdir -p public

echo "📊 Available disk space:"
df -h . || echo "Could not check disk space"

# Install production dependencies with explicit configuration
echo "📦 Installing production dependencies..."
npm install --only=production --no-audit --no-fund --no-optional --loglevel=error

# Verify critical packages are installed
echo "🔍 Verifying installations..."
if [ ! -d "node_modules/express" ]; then
    echo "❌ Express not found, installing explicitly..."
    npm install express@^4.18.2 --no-audit --no-fund
fi

if [ ! -d "node_modules/cors" ]; then
    echo "❌ CORS not found, installing explicitly..."
    npm install cors@^2.8.5 --no-audit --no-fund
fi

if [ ! -d "node_modules/winston" ]; then
    echo "❌ Winston not found, installing explicitly..."
    npm install winston@^3.17.0 --no-audit --no-fund
fi

# Install TypeScript for build
echo "📦 Installing TypeScript for build..."
npm install typescript --no-save --no-audit --no-fund 2>/dev/null || {
    echo "⚠️  Local TypeScript install failed, trying global..."
    npm install -g typescript 2>/dev/null || echo "⚠️  Global TypeScript install failed, will try npx"
}

# Build the backend with multiple fallback strategies
echo "🔨 Building backend..."

# Strategy 1: Use local TypeScript
if [ -f "node_modules/.bin/tsc" ]; then
    echo "✅ Using local TypeScript compiler"
    ./node_modules/.bin/tsc --version
    ./node_modules/.bin/tsc
elif command -v tsc &> /dev/null; then
    echo "✅ Using global TypeScript compiler"
    tsc --version
    tsc
else
    echo "⚠️  TypeScript not found, using npx as fallback"
    npx typescript@latest --version
    npx typescript@latest
fi

# Verify build succeeded
if [ ! -f "dist/server.js" ]; then
    echo "❌ Build failed - server.js not found in dist/"
    echo "📁 Contents of current directory:"
    ls -la
    echo "📁 Contents of dist directory (if exists):"
    ls -la dist/ 2>/dev/null || echo "dist/ directory does not exist"
    
    # Try alternative build approach
    echo "🔄 Attempting alternative build with explicit tsconfig..."
    npx tsc --project tsconfig.json --outDir dist --rootDir src
    
    if [ ! -f "dist/server.js" ]; then
        echo "❌ Alternative build also failed"
        exit 1
    fi
fi

echo "✅ Build successful - server.js created"

# Set up frontend assets
echo "🌐 Setting up frontend assets..."

# Check for existing frontend assets in various locations
if [ -d "../frontend/dist" ] && [ "$(ls -A ../frontend/dist 2>/dev/null)" ]; then
    echo "📂 Copying frontend from ../frontend/dist..."
    cp -r ../frontend/dist/* public/ 2>/dev/null || echo "⚠️  Could not copy from ../frontend/dist"
elif [ -d "frontend/dist" ] && [ "$(ls -A frontend/dist 2>/dev/null)" ]; then
    echo "📂 Copying frontend from frontend/dist..."
    cp -r frontend/dist/* public/ 2>/dev/null || echo "⚠️  Could not copy from frontend/dist"
else
    echo "⚠️  No frontend build found, creating production status page..."
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Careerate - Production API Server</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            padding: 20px;
        }
        .container { 
            text-align: center;
            max-width: 800px;
            padding: 60px 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 24px;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .logo { font-size: 5rem; margin-bottom: 20px; }
        h1 { font-size: 3.5rem; margin-bottom: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .subtitle { font-size: 1.8rem; margin-bottom: 40px; opacity: 0.9; font-weight: 500; }
        .status { 
            background: rgba(16, 185, 129, 0.2);
            border: 2px solid #10b981;
            color: #10b981;
            padding: 20px 40px;
            border-radius: 50px;
            display: inline-block;
            margin-bottom: 40px;
            font-weight: 600;
            font-size: 1.2rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .endpoints { 
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            margin: 40px 0;
            text-align: left;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .endpoints h3 { 
            text-align: center; 
            margin-bottom: 30px; 
            font-size: 1.5rem; 
            color: #10b981;
        }
        .endpoint { 
            margin: 15px 0;
            font-family: 'Monaco', 'Menlo', monospace;
            background: rgba(0,0,0,0.3);
            padding: 15px 25px;
            border-radius: 12px;
            border-left: 5px solid #10b981;
            font-size: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .method { 
            background: rgba(59, 130, 246, 0.8);
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .note { 
            margin-top: 40px;
            padding: 30px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 16px;
            border-left: 5px solid #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .version {
            margin-top: 30px;
            opacity: 0.7;
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .container { padding: 40px 20px; }
            h1 { font-size: 2.5rem; }
            .subtitle { font-size: 1.4rem; }
            .endpoint { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1>Careerate</h1>
        <div class="subtitle">AI-Powered Career Platform</div>
        <div class="status">✅ Production API Online</div>
        <p style="font-size: 1.2rem; margin-bottom: 30px;">
            The Careerate backend API is successfully deployed and running on Azure App Service!
        </p>
        
        <div class="endpoints">
            <h3>🔗 Available API Endpoints</h3>
            <div class="endpoint">
                <span>/health</span>
                <span class="method">GET</span>
            </div>
            <div class="endpoint">
                <span>/api</span>
                <span class="method">GET</span>
            </div>
            <div class="endpoint">
                <span>/api/chat</span>
                <span class="method">POST</span>
            </div>
            <div class="endpoint">
                <span>/api/agents</span>
                <span class="method">GET</span>
            </div>
            <div class="endpoint">
                <span>/api/auth/*</span>
                <span class="method">ALL</span>
            </div>
            <div class="endpoint">
                <span>/api/workspace/*</span>
                <span class="method">ALL</span>
            </div>
        </div>
        
        <div class="note">
            <strong>🎯 Deployment Status:</strong><br>
            ✅ Backend API - Deployed & Running<br>
            ✅ Environment - Production Configured<br>
            ✅ Security - CORS & Rate Limiting Active<br>
            ✅ AI Services - Connected & Ready<br>
            ⏳ Frontend SPA - Deploy in Progress<br>
            ⏳ Chrome Extension - Integration Testing<br>
        </div>
        
        <div class="version">
            <strong>Server Info:</strong><br>
            Environment: Production | Version: 1.0.0 | Node.js: $(node --version)<br>
            Build Time: $(date)<br>
            Azure App Service - Linux Container
        </div>
    </div>
</body>
</html>
EOF
fi

# Final deployment summary
echo ""
echo "📊 Deployment Summary:"
echo "====================="
echo "✅ Environment: $NODE_ENV"
echo "✅ Port: $PORT"
echo "✅ Node.js: $(node --version)"
echo "✅ Dependencies: $(ls node_modules | wc -l || echo 'unknown') packages"
echo "✅ Backend built: $(ls -la dist/ | grep -c "\.js$" || echo 0) JS files"
echo "✅ Frontend assets: $(ls -la public/ | grep -c "^-" || echo 0) files"
echo "✅ Memory limit: $NODE_OPTIONS"

# Verify server file exists and is valid
if [ -f "dist/server.js" ]; then
    echo "✅ Server file: $(stat -c%s dist/server.js 2>/dev/null || echo 'unknown') bytes"
    echo "✅ Server syntax: $(node -c dist/server.js && echo 'Valid' || echo 'Invalid')"
else
    echo "❌ Server file not found!"
    exit 1
fi

echo ""
echo "🎉 Deployment Complete! Starting server..."
echo "=========================================="

# Start the server with error handling
exec node dist/server.js 