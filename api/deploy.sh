#!/bin/bash

# Exit on any error
set -e

echo "=== Azure Deployment Script for Careerate API ==="
echo "Starting deployment process..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in PATH"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in current directory"
    echo "Current directory contents:"
    ls -la
    exit 1
fi

echo "Found package.json, installing dependencies..."

# Install production dependencies
echo "Running: npm ci --omit=dev --no-optional"
npm ci --omit=dev --no-optional

if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully!"
else
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo "=== Deployment completed successfully ==="
echo "Application is ready to start with: node dist/server.js" 