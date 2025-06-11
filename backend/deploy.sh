#!/bin/bash

echo "🚀 Careerate Azure Deployment Script"
echo "======================================"

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Set Azure-specific variables
export NODE_ENV=production
export PORT=8080

echo "📁 Current directory: $(pwd)"
echo "🌍 Environment: $NODE_ENV"
echo "🔢 Port: $PORT"

# Clean up any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules
rm -rf public

# Create public directory
mkdir -p public

# Install dependencies
echo "📦 Installing production dependencies..."
npm install --only=production --no-audit --no-fund

# Install TypeScript if not available
if ! command -v tsc &> /dev/null; then
    echo "📦 Installing TypeScript..."
    npm install -g typescript@latest
fi

# Build the application
echo "🔨 Building backend..."
npm run build

# Copy frontend assets if available
echo "🌐 Setting up frontend assets..."
if [ -d "../frontend/dist" ]; then
    echo "📂 Copying frontend from ../frontend/dist..."
    cp -r ../frontend/dist/* public/
elif [ -f "public/index.html" ]; then
    echo "✅ Using existing frontend assets"
else
    echo "⚠️  Creating fallback index.html..."
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Careerate - AI-Powered Career Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            color: white;
        }
        .container { 
            text-align: center; 
            max-width: 600px; 
            padding: 40px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 20px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { font-size: 3rem; margin-bottom: 20px; font-weight: 700; }
        .subtitle { font-size: 1.5rem; margin-bottom: 30px; opacity: 0.9; }
        .status { 
            background: rgba(16, 185, 129, 0.2); 
            border: 2px solid #10b981; 
            color: #10b981; 
            padding: 15px 30px; 
            border-radius: 50px; 
            display: inline-block; 
            margin-bottom: 30px; 
            font-weight: 600;
            font-size: 1.1rem;
        }
        .endpoints { 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 15px; 
            margin-top: 30px; 
            text-align: left;
        }
        .endpoint { 
            margin: 15px 0; 
            font-family: 'Courier New', monospace; 
            background: rgba(0,0,0,0.2); 
            padding: 12px 20px; 
            border-radius: 8px; 
            border-left: 4px solid #10b981;
            font-size: 0.95rem;
        }
        .logo { font-size: 4rem; margin-bottom: 20px; }
        .note { 
            margin-top: 20px; 
            padding: 20px; 
            background: rgba(59, 130, 246, 0.2); 
            border-radius: 10px; 
            border-left: 4px solid #3b82f6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1>Careerate</h1>
        <div class="subtitle">AI-Powered Career Platform</div>
        <div class="status">✅ API Server Running</div>
        <p>The Careerate backend API is successfully deployed and running on Azure!</p>
        
        <div class="endpoints">
            <h3>🔗 Available API Endpoints:</h3>
            <div class="endpoint">GET /health - Health check</div>
            <div class="endpoint">GET /api - API information</div>
            <div class="endpoint">POST /api/chat - AI chat endpoint</div>
            <div class="endpoint">GET /api/agents - Available AI agents</div>
            <div class="endpoint">GET /api/auth/* - Authentication</div>
            <div class="endpoint">GET /api/workspace/* - Workspace management</div>
            <div class="endpoint">GET /api/mcp/* - MCP server integration</div>
        </div>
        
        <div class="note">
            <strong>🎯 Next Steps:</strong><br>
            ✓ Backend API deployed<br>
            ✓ Environment configured<br>
            ⏳ Frontend deployment in progress<br>
            ⏳ Chrome extension integration<br>
        </div>
    </div>
</body>
</html>
EOF
fi

echo "📊 Deployment Summary:"
echo "====================="
echo "✅ Dependencies installed: $(ls node_modules | wc -l) packages"
echo "✅ Backend built: $(ls -la dist/ | grep -c "^-"|| echo 0) files"
echo "✅ Frontend assets: $(ls -la public/ | grep -c "^-" || echo 0) files"
echo "✅ Environment: $NODE_ENV"
echo "✅ Port configured: $PORT"

echo ""
echo "🎉 Deployment complete! Starting server..."
echo "=========================================="

# Start the server
exec node dist/server.js 