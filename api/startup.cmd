@echo off
echo "Starting Careerate API..."
echo "Installing dependencies..."
npm install --production --no-optional
echo "Starting server..."
node dist/server.js 