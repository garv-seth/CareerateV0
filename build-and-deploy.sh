#!/bin/bash

# Build and Deploy Script for Both Replit and Azure
set -e

echo "Building Careerate Platform for production..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf backend/dist backend/public frontend/dist

# Install dependencies
echo "Installing dependencies..."
npm ci
cd frontend && npm ci
cd ../backend && npm ci
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Build backend
echo "Building backend..."
cd backend
npm run build

# Copy frontend to backend public directory
echo "Preparing production files..."
mkdir -p public
cp -r ../frontend/dist/* public/

# Create production package.json
cat > package.json << EOF
{
  "name": "careerate-backend",
  "version": "1.0.0",
  "description": "Careerate AI Platform Backend - Production",
  "main": "dist/simple-server-backup.js",
  "scripts": {
    "start": "node dist/simple-server-backup.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

echo "Production build complete!"
echo "Files ready for Azure deployment in backend/ directory"
echo "Run ./deploy-azure.sh to deploy to Azure"