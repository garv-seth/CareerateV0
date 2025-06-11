#!/bin/bash

echo "🔄 Careerate Fallback Deployment"
echo "================================="

set -euo pipefail
cd "$(dirname "$0")"

export NODE_ENV=production
export PORT=${PORT:-8080}
export NODE_OPTIONS="--max-old-space-size=1024"

echo "⚠️  Using minimal fallback mode..."

# Clean everything
rm -rf node_modules dist 2>/dev/null || true
mkdir -p public dist

# Use minimal package.json
if [ -f "package.minimal.json" ]; then
    echo "📦 Switching to minimal dependencies..."
    cp package.minimal.json package.json
fi

# Install minimal dependencies with retries
echo "📦 Installing minimal dependencies..."
for i in {1..3}; do
    if npm install --only=production --silent --no-audit --no-fund 2>/dev/null; then
        echo "✅ Dependencies installed on attempt $i"
        break
    else
        echo "❌ Attempt $i failed"
        if [ $i -eq 3 ]; then
            echo "💥 All install attempts failed"
            exit 1
        fi
        sleep 5
    fi
done

# Simple build
echo "🔨 Building with minimal setup..."
if [ -f "node_modules/.bin/tsc" ]; then
    ./node_modules/.bin/tsc || exit 1
else
    npx tsc || exit 1
fi

# Create minimal server if build fails
if [ ! -f "dist/server.js" ]; then
    echo "🚨 Creating emergency server..."
    mkdir -p dist
    cat > dist/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
    res.json({ 
        message: 'Careerate API - Emergency Mode',
        version: '1.0.0',
        endpoints: ['/health', '/api']
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Emergency server running on port ${PORT}`);
});
EOF
fi

# Create minimal frontend
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Careerate - Emergency Mode</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; text-align: center; }
        h1 { color: #e74c3c; }
        .status { background: #f39c12; color: white; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 Careerate - Emergency Mode</h1>
        <div class="status">System Running in Fallback Configuration</div>
        <p>The API is operational with minimal functionality.</p>
        <p><strong>Health Check:</strong> <a href="/health">/health</a></p>
        <p><strong>API Info:</strong> <a href="/api">/api</a></p>
    </div>
</body>
</html>
EOF

echo "🚀 Starting emergency server..."
exec node dist/server.js 