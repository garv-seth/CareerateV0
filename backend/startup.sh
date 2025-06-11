#!/bin/bash

echo "=== Careerate Full Stack Deployment ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Set environment variables for Node.js
export NODE_ENV=production
export PORT=${PORT:-8080}
export NODE_OPTIONS="--max-old-space-size=4096"

echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules
rm -rf public

# Install production dependencies
echo "📦 Installing backend dependencies..."
npm install --only=production --no-audit --no-fund

# Check if TypeScript compiler is available
if ! command -v tsc &> /dev/null; then
    echo "📦 Installing TypeScript globally..."
    npm install -g typescript
fi

# Build the backend
echo "🔨 Building backend..."
npm run build

# Create public directory and copy frontend build if it exists
echo "🌐 Setting up frontend assets..."
mkdir -p public

# Check if we have a built frontend in the repo
if [ -d "../frontend/dist" ]; then
    echo "📂 Copying frontend build from ../frontend/dist..."
    cp -r ../frontend/dist/* public/
elif [ -d "frontend/dist" ]; then
    echo "📂 Copying frontend build from frontend/dist..."
    cp -r frontend/dist/* public/
else
    echo "⚠️  No frontend build found, creating basic index.html..."
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Careerate API</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; margin-bottom: 20px; }
        .status { background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-bottom: 20px; }
        .endpoints { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .endpoint { margin: 10px 0; font-family: monospace; background: #e5e7eb; padding: 5px 10px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Careerate API Server</h1>
        <div class="status">✅ Server Running</div>
        <p>The Careerate API backend is running successfully. The frontend will be available once deployed.</p>
        <div class="endpoints">
            <h3>Available Endpoints:</h3>
            <div class="endpoint">GET /health - Health check</div>
            <div class="endpoint">GET /api - API information</div>
            <div class="endpoint">POST /api/chat - AI chat endpoint</div>
            <div class="endpoint">GET /api/agents - Available AI agents</div>
            <div class="endpoint">GET /api/auth/* - Authentication endpoints</div>
        </div>
        <p>Chrome extension and full frontend coming soon!</p>
    </div>
</body>
</html>
EOF
fi

echo "✅ Setup complete! Starting server..."
echo "Backend built: $(ls -la dist/)"
echo "Public assets: $(ls -la public/)"

# Start the server
node dist/server.js 